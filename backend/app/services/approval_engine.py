import uuid
from datetime import datetime
from fastapi import HTTPException
from app.core.file_db import db
from app.services.conflict_engine import check_venue_conflict, parse_iso
from app.services.audit_service import log_audit, send_notification

VALID_STATUSES = {
    "SUBMITTED",
    "UNDER_REVIEW",
    "PARTIALLY_APPROVED",
    "APPROVED",
    "REJECTED",
    "WITHDRAWN",
    "CANCELLED"
}

def process_approval(application_id: str, admin_id: str, decision: str, remarks: str) -> dict:
    if decision not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Decision must be 'approved' or 'rejected'")

    if decision == "rejected" and not remarks.strip():
        raise HTTPException(status_code=400, detail="Remarks are mandatory when rejecting an application.")

    with db._lock:
        app = db.select_one("applications", lambda a: a["id"] == application_id)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        current_status = app.get("status")
        if current_status not in ["SUBMITTED", "UNDER_REVIEW", "PARTIALLY_APPROVED"]:
            raise HTTPException(status_code=400, detail=f"Cannot review application with status {current_status}")

        existing_approvals = db.select("approvals", lambda a: a["application_id"] == application_id)
        if any(a["admin_id"] == admin_id for a in existing_approvals):
            raise HTTPException(status_code=400, detail="This admin has already submitted a decision for this application.")

        # Record approval
        approval_record = {
            "id": str(uuid.uuid4()),
            "application_id": application_id,
            "admin_id": admin_id,
            "decision": decision,
            "remarks": remarks,
            "decided_at": datetime.utcnow().isoformat()
        }
        db.insert("approvals", approval_record)

        applicant_id = app["applicant_id"]

        if decision == "rejected":
            new_status = "REJECTED"
            db.update("applications", lambda a: a["id"] == application_id, {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat()
            })
            log_audit(admin_id, "REJECT_APPLICATION", "application", application_id, {"remarks": remarks})
            send_notification(applicant_id, f"Your application '{app['event_name']}' was rejected: {remarks}")
            return {"status": new_status, "message": "Application rejected."}

        # Decision is approved
        all_approvals = existing_approvals + [approval_record]
        approved_count = len([a for a in all_approvals if a["decision"] == "approved"])

        if approved_count == 1:
            new_status = "PARTIALLY_APPROVED"
            db.update("applications", lambda a: a["id"] == application_id, {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat()
            })
            log_audit(admin_id, "PARTIALLY_APPROVE_APPLICATION", "application", application_id, {"remarks": remarks})
            send_notification(applicant_id, f"Your application '{app['event_name']}' has been approved by 1 admin (Pending 2nd approval).")
            return {"status": new_status, "message": "Application partially approved. Pending second admin approval."}

        elif approved_count >= 2:
            # 2nd Admin approval -> Final conflict check & Booking Creation!
            venue = db.select_one("venues", lambda v: v["id"] == app["venue_id"])
            buffer_min = venue.get("setup_buffer_minutes", 30) if venue else 30

            start_dt_str = f"{app['event_date']}T{app['start_time']}:00"
            end_dt_str = f"{app['event_date']}T{app['end_time']}:00"
            start_dt = parse_iso(start_dt_str)
            end_dt = parse_iso(end_dt_str)

            if check_venue_conflict(app["venue_id"], start_dt, end_dt, buffer_minutes=0):
                raise HTTPException(
                    status_code=409,
                    detail="Conflict detected! Another confirmed booking occupies this venue or buffer period."
                )

            # Create confirmed booking
            booking = {
                "id": str(uuid.uuid4()),
                "application_id": application_id,
                "venue_id": app["venue_id"],
                "start_datetime": start_dt.isoformat(),
                "end_datetime": end_dt.isoformat(),
                "status": "confirmed",
                "created_at": datetime.utcnow().isoformat()
            }
            db.insert("bookings", booking)

            new_status = "APPROVED"
            db.update("applications", lambda a: a["id"] == application_id, {
                "status": new_status,
                "updated_at": datetime.utcnow().isoformat()
            })

            log_audit(admin_id, "FINAL_APPROVE_APPLICATION", "application", application_id, {"booking_id": booking["id"]})
            send_notification(applicant_id, f"Congratulations! Your application '{app['event_name']}' is FULLY APPROVED and booking confirmed.")

            return {
                "status": new_status,
                "message": "Application approved by both admins! Confirmed booking has been created.",
                "booking": booking
            }
