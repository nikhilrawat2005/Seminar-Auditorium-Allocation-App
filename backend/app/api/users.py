import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.file_db import db
from app.core.security import get_password_hash
from app.core.deps import require_admin
from app.schemas.all_schemas import UserCreate, UserUpdate, UserResponse
from app.services.audit_service import log_audit

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[UserResponse])
def list_users(admin: dict = Depends(require_admin)):
    return db.select("users")

@router.post("", response_model=UserResponse)
def create_user(user_in: UserCreate, admin: dict = Depends(require_admin)):
    existing = db.select_one("users", lambda u: u["email"].lower() == user_in.email.lower())
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = {
        "id": str(uuid.uuid4()),
        "name": user_in.name,
        "email": user_in.email.lower(),
        "password_hash": get_password_hash(user_in.password),
        "role": user_in.role,
        "organization_name": user_in.organization_name,
        "status": user_in.status,
        "created_at": datetime.utcnow().isoformat()
    }
    db.insert("users", new_user)
    log_audit(admin["id"], "CREATE_USER", "user", new_user["id"], {"email": new_user["email"], "role": new_user["role"]})
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, user_in: UserUpdate, admin: dict = Depends(require_admin)):
    target = db.select_one("users", lambda u: u["id"] == user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    updates = {k: v for k, v in user_in.dict(exclude_unset=True).items() if v is not None}
    if "password" in updates and updates["password"]:
        updates["password_hash"] = get_password_hash(updates.pop("password"))

    updated = db.update("users", lambda u: u["id"] == user_id, updates)
    log_audit(admin["id"], "UPDATE_USER", "user", user_id, updates)
    return updated[0]

@router.delete("/{user_id}")
def delete_user(user_id: str, admin: dict = Depends(require_admin)):
    target = db.select_one("users", lambda u: u["id"] == user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    if target["role"] == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete administrator accounts")

    db.delete("users", lambda u: u["id"] == user_id)
    log_audit(admin["id"], "DELETE_USER", "user", user_id, {"email": target["email"], "name": target["name"]})
    return {"message": f"Applicant '{target['name']}' deleted successfully"}
