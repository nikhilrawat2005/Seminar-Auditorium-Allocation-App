import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from app.core.file_db import db
from app.core.deps import get_current_user
from app.schemas.all_schemas import ApplicationCreate, ApplicationResponse
from app.services.audit_service import log_audit, send_notification

router = APIRouter(prefix="/applications", tags=["applications"])

def generate_public_ref() -> str:
    year = datetime.utcnow().year
    apps = db.select("applications")
    count = len(apps) + 1
    return f"VB-{year}-{count:04d}"

def enrich_app(app: dict) -> dict:
    applicant = db.select_one("users", lambda u: u["id"] == app.get("applicant_id"))
    venue = db.select_one("venues", lambda v: v["id"] == app.get("venue_id"))
    approvals = db.select("approvals", lambda a: a.get("application_id") == app["id"])
    enriched = dict(app)
    enriched["applicant_name"] = applicant["name"] if applicant else "Unknown"
    enriched["organization_name"] = applicant.get("organization_name", "") if applicant else ""
    enriched["venue_name"] = venue["name"] if venue else "Unknown"
    enriched["approvals"] = approvals
    return enriched

@router.get("", response_model=List[ApplicationResponse])
def get_applications(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == "admin":
        apps = db.select("applications")
    else:
        apps = db.select("applications", lambda a: a.get("applicant_id") == current_user["id"])
    return [enrich_app(a) for a in apps]

@router.get("/{app_id}", response_model=ApplicationResponse)
def get_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = db.select_one("applications", lambda a: a["id"] == app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] != "admin" and app["applicant_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return enrich_app(app)

@router.post("", response_model=ApplicationResponse)
def submit_application(app_in: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "applicant":
        raise HTTPException(status_code=403, detail="Only applicant accounts can submit booking requests")

    # Venue capacity & active check
    venue = db.select_one("venues", lambda v: v["id"] == app_in.venue_id)
    if not venue or venue.get("status") != "active":
        raise HTTPException(status_code=400, detail="Selected venue is not active or does not exist")

    if app_in.expected_participants > venue["capacity"]:
        raise HTTPException(status_code=400, detail=f"Expected participants ({app_in.expected_participants}) exceeds venue capacity ({venue['capacity']})")

    # Operating hours constraint: 07:00 to 18:30
    if app_in.start_time < "07:00" or app_in.end_time > "18:30":
        raise HTTPException(
            status_code=400,
            detail="Booking time must be within college facility operating hours (07:00 AM to 06:30 PM)."
        )

    if app_in.start_time >= app_in.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time."
        )

    # Check for direct conflict with existing confirmed bookings
    start_dt = datetime.strptime(f"{app_in.event_date}T{app_in.start_time}:00", "%Y-%m-%dT%H:%M:%S")
    end_dt = datetime.strptime(f"{app_in.event_date}T{app_in.end_time}:00", "%Y-%m-%dT%H:%M:%S")
    from app.services.conflict_engine import check_venue_conflict
    if check_venue_conflict(app_in.venue_id, start_dt, end_dt):
        raise HTTPException(
            status_code=409,
            detail="Venue is already booked for this time slot on this date! Please choose a different time or half-day slot."
        )

    new_app = {
        "id": str(uuid.uuid4()),
        "public_ref": generate_public_ref(),
        "applicant_id": current_user["id"],
        "venue_id": app_in.venue_id,
        "event_name": app_in.event_name,
        "event_description": app_in.event_description,
        "event_category": app_in.event_category,
        "event_date": app_in.event_date,
        "start_time": app_in.start_time,
        "end_time": app_in.end_time,
        "expected_participants": app_in.expected_participants,
        "additional_requirements": app_in.additional_requirements or "",
        "status": "SUBMITTED",
        "parent_application_id": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    db.insert("applications", new_app)
    log_audit(current_user["id"], "SUBMIT_APPLICATION", "application", new_app["id"], {"event_name": new_app["event_name"]})

    # Notify admins
    admins = db.select("users", lambda u: u["role"] == "admin" and u.get("status") == "active")
    for adm in admins:
        send_notification(adm["id"], f"New application {new_app['public_ref']} submitted by {current_user['name']}")

    return enrich_app(new_app)

@router.post("/{app_id}/withdraw")
def withdraw_application(app_id: str, current_user: dict = Depends(get_current_user)):
    app = db.select_one("applications", lambda a: a["id"] == app_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if current_user["role"] != "admin" and app["applicant_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")

    if app["status"] not in ["SUBMITTED", "UNDER_REVIEW", "PARTIALLY_APPROVED"]:
        raise HTTPException(status_code=400, detail=f"Cannot withdraw application in status {app['status']}")

    db.update("applications", lambda a: a["id"] == app_id, {
        "status": "WITHDRAWN",
        "updated_at": datetime.utcnow().isoformat()
    })
    log_audit(current_user["id"], "WITHDRAW_APPLICATION", "application", app_id, {})
    return {"message": "Application successfully withdrawn"}

@router.post("/{app_id}/resubmit", response_model=ApplicationResponse)
def resubmit_application(app_id: str, app_in: ApplicationCreate, current_user: dict = Depends(get_current_user)):
    old_app = db.select_one("applications", lambda a: a["id"] == app_id)
    if not old_app:
        raise HTTPException(status_code=404, detail="Application not found")
    if old_app["applicant_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    if old_app["status"] != "REJECTED":
        raise HTTPException(status_code=400, detail="Only rejected applications can be resubmitted")

    # Operating hours constraint: 07:00 to 18:30
    if app_in.start_time < "07:00" or app_in.end_time > "18:30":
        raise HTTPException(
            status_code=400,
            detail="Booking time must be within college facility operating hours (07:00 AM to 06:30 PM)."
        )

    if app_in.start_time >= app_in.end_time:
        raise HTTPException(
            status_code=400,
            detail="End time must be after start time."
        )

    # Check for direct conflict with existing confirmed bookings
    start_dt = datetime.strptime(f"{app_in.event_date}T{app_in.start_time}:00", "%Y-%m-%dT%H:%M:%S")
    end_dt = datetime.strptime(f"{app_in.event_date}T{app_in.end_time}:00", "%Y-%m-%dT%H:%M:%S")
    from app.services.conflict_engine import check_venue_conflict
    if check_venue_conflict(app_in.venue_id, start_dt, end_dt):
        raise HTTPException(
            status_code=409,
            detail="Venue is already booked for this time slot on this date! Please choose a different time or half-day slot."
        )

    new_app = {
        "id": str(uuid.uuid4()),
        "public_ref": generate_public_ref(),
        "applicant_id": current_user["id"],
        "venue_id": app_in.venue_id,
        "event_name": app_in.event_name,
        "event_description": app_in.event_description,
        "event_category": app_in.event_category,
        "event_date": app_in.event_date,
        "start_time": app_in.start_time,
        "end_time": app_in.end_time,
        "expected_participants": app_in.expected_participants,
        "additional_requirements": app_in.additional_requirements or "",
        "status": "SUBMITTED",
        "parent_application_id": old_app["id"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    db.insert("applications", new_app)
    log_audit(current_user["id"], "RESUBMIT_APPLICATION", "application", new_app["id"], {"parent_id": old_app["id"]})
    return enrich_app(new_app)
