import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import datetime
from app.core.file_db import db
from app.core.deps import require_admin
from app.schemas.all_schemas import VenueCreate, VenueUpdate, VenueResponse
from app.services.audit_service import log_audit
from app.services.conflict_engine import check_venue_conflict, parse_iso

router = APIRouter(prefix="/venues", tags=["venues"])

@router.get("", response_model=List[VenueResponse])
def list_venues(status: Optional[str] = Query(None), block: Optional[str] = Query(None)):
    def filter_fn(v):
        if status and v.get("status") != status:
            return False
        if block and v.get("block") != block:
            return False
        return True
    return db.select("venues", filter_fn)

@router.get("/{venue_id}", response_model=VenueResponse)
def get_venue(venue_id: str):
    venue = db.select_one("venues", lambda v: v["id"] == venue_id)
    if not venue:
        raise HTTPException(status_code=404, detail="Venue not found")
    return venue

@router.post("", response_model=VenueResponse)
def create_venue(venue_in: VenueCreate, admin: dict = Depends(require_admin)):
    new_venue = {
        "id": str(uuid.uuid4()),
        "name": venue_in.name,
        "location": venue_in.location,
        "block": venue_in.block or "General",
        "capacity": venue_in.capacity,
        "description": venue_in.description or "",
        "equipment_notes": venue_in.equipment_notes or "",
        "setup_buffer_minutes": venue_in.setup_buffer_minutes,
        "status": venue_in.status
    }
    db.insert("venues", new_venue)
    log_audit(admin["id"], "CREATE_VENUE", "venue", new_venue["id"], {"name": new_venue["name"]})
    return new_venue

@router.put("/{venue_id}", response_model=VenueResponse)
def update_venue(venue_id: str, venue_in: VenueUpdate, admin: dict = Depends(require_admin)):
    target = db.select_one("venues", lambda v: v["id"] == venue_id)
    if not target:
        raise HTTPException(status_code=404, detail="Venue not found")

    updates = {k: v for k, v in venue_in.dict(exclude_unset=True).items() if v is not None}
    updated = db.update("venues", lambda v: v["id"] == venue_id, updates)
    log_audit(admin["id"], "UPDATE_VENUE", "venue", venue_id, updates)
    return updated[0]

@router.get("/{venue_id}/availability")
def check_availability(venue_id: str, date: str, start_time: str, end_time: str):
    start_dt = parse_iso(f"{date}T{start_time}:00")
    end_dt = parse_iso(f"{date}T{end_time}:00")
    venue = db.select_one("venues", lambda v: v["id"] == venue_id)
    buffer_min = venue.get("setup_buffer_minutes", 30) if venue else 30
    has_conflict = check_venue_conflict(venue_id, start_dt, end_dt, buffer_minutes=buffer_min)
    return {"venue_id": venue_id, "available": not has_conflict}
