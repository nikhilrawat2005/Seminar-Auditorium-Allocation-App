from typing import List
from fastapi import APIRouter, Depends, HTTPException
from app.core.file_db import db
from app.core.deps import require_admin
from app.schemas.all_schemas import BookingResponse
from app.services.audit_service import log_audit, send_notification

router = APIRouter(prefix="/bookings", tags=["bookings"])

@router.get("", response_model=List[BookingResponse])
def list_bookings(admin: dict = Depends(require_admin)):
    bookings = db.select("bookings")
    results = []
    for b in bookings:
        v = db.select_one("venues", lambda item: item["id"] == b.get("venue_id"))
        app = db.select_one("applications", lambda item: item["id"] == b.get("application_id"))
        item = dict(b)
        item["venue_name"] = v["name"] if v else "Unknown"
        item["event_name"] = app["event_name"] if app else "Unknown"
        results.append(item)
    return results

@router.post("/{booking_id}/cancel")
def cancel_booking(booking_id: str, admin: dict = Depends(require_admin)):
    booking = db.select_one("bookings", lambda b: b["id"] == booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    db.update("bookings", lambda b: b["id"] == booking_id, {"status": "cancelled"})
    db.update("applications", lambda a: a["id"] == booking["application_id"], {"status": "CANCELLED"})

    log_audit(admin["id"], "CANCEL_BOOKING", "booking", booking_id, {})
    app = db.select_one("applications", lambda a: a["id"] == booking["application_id"])
    if app:
        send_notification(app["applicant_id"], f"Your confirmed booking for '{app['event_name']}' has been cancelled by admin.")

    return {"message": "Booking and associated application have been cancelled"}
