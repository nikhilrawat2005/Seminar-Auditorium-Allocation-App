from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str
    organization_name: Optional[str] = None
    status: str = "active"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = None
    organization_name: Optional[str] = None
    status: Optional[str] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    created_at: str

class VenueBase(BaseModel):
    name: str
    location: str
    block: Optional[str] = "General"
    capacity: int
    description: Optional[str] = ""
    equipment_notes: Optional[str] = ""
    setup_buffer_minutes: int = 30
    status: str = "active"

class VenueCreate(VenueBase):
    pass

class VenueUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    block: Optional[str] = None
    capacity: Optional[int] = None
    description: Optional[str] = None
    equipment_notes: Optional[str] = None
    setup_buffer_minutes: Optional[int] = None
    status: Optional[str] = None

class VenueResponse(VenueBase):
    id: str

class ApplicationCreate(BaseModel):
    venue_id: str
    event_name: str
    event_description: str
    event_category: str
    event_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str    # HH:MM
    expected_participants: int
    additional_requirements: Optional[str] = ""

class ApplicationResponse(BaseModel):
    id: str
    public_ref: str
    applicant_id: str
    applicant_name: Optional[str] = None
    organization_name: Optional[str] = None
    venue_id: str
    venue_name: Optional[str] = None
    event_name: str
    event_description: str
    event_category: str
    event_date: str
    start_time: str
    end_time: str
    expected_participants: int
    additional_requirements: Optional[str] = ""
    status: str
    parent_application_id: Optional[str] = None
    created_at: str
    updated_at: str
    approvals: Optional[List[Dict[str, Any]]] = []

class ApprovalDecision(BaseModel):
    decision: str  # "approved" or "rejected"
    remarks: Optional[str] = ""

class BookingResponse(BaseModel):
    id: str
    application_id: str
    venue_id: str
    venue_name: Optional[str] = None
    event_name: Optional[str] = None
    start_datetime: str
    end_datetime: str
    status: str
    created_at: str

class PublicCalendarItem(BaseModel):
    id: str
    event_name: str
    organization_name: str
    venue_id: str
    venue_name: str
    start: str
    end: str
    category: str
