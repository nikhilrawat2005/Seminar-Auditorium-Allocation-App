from datetime import datetime, timedelta
from app.core.file_db import db

def parse_iso(dt_str: str) -> datetime:
    try:
        return datetime.fromisoformat(dt_str.replace("Z", "+00:00")).replace(tzinfo=None)
    except Exception:
        # Fallback for plain YYYY-MM-DDTHH:MM:SS
        return datetime.strptime(dt_str[:19], "%Y-%m-%dT%H:%M:%S")

def check_venue_conflict(venue_id: str, start_dt: datetime, end_dt: datetime, buffer_minutes: int = 0) -> bool:
    """
    Returns True if conflict exists with any confirmed booking, False otherwise.
    Allows back-to-back non-overlapping bookings (e.g. 07:00-12:30 and 12:30-18:30).
    Only returns True if intervals strictly overlap: max(start, b_start) < min(end, b_end).
    """
    bookings = db.select("bookings", lambda b: b.get("venue_id") == venue_id and b.get("status") == "confirmed")
    for b in bookings:
        b_start = parse_iso(b["start_datetime"])
        b_end = parse_iso(b["end_datetime"])

        # Strict interval overlap check (allows exact boundary hand-off)
        if max(start_dt, b_start) < min(end_dt, b_end):
            return True
    return False
