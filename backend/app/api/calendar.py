from typing import List, Optional
from fastapi import APIRouter, Query
from app.core.file_db import db
from app.schemas.all_schemas import PublicCalendarItem

router = APIRouter(prefix="/calendar", tags=["calendar"])

@router.get("", response_model=List[PublicCalendarItem])
def get_public_calendar(
    venue_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None)
):
    """
    Public Read-Only Calendar API.
    Returns ONLY confirmed bookings with public-safe fields:
    event_name, organization_name, venue_name, start, end, category.
    Strictly NO private remarks, emails, or phone numbers.
    """
    confirmed_bookings = db.select("bookings", lambda b: b.get("status") == "confirmed")
    if venue_id:
        confirmed_bookings = [b for b in confirmed_bookings if b.get("venue_id") == venue_id]

    items = []
    for b in confirmed_bookings:
        app = db.select_one("applications", lambda a: a["id"] == b.get("application_id"))
        if not app:
            continue
        if category and app.get("event_category") != category:
            continue

        venue = db.select_one("venues", lambda v: v["id"] == b.get("venue_id"))
        applicant = db.select_one("users", lambda u: u["id"] == app.get("applicant_id"))

        items.append(PublicCalendarItem(
            id=b["id"],
            event_name=app.get("event_name", ""),
            organization_name=applicant.get("organization_name", "College Org") if applicant else "College Org",
            venue_id=b["venue_id"],
            venue_name=venue["name"] if venue else "Venue",
            start=b["start_datetime"],
            end=b["end_datetime"],
            category=app.get("event_category", "General")
        ))
    return items
