from typing import List
from fastapi import APIRouter, Depends
from app.core.file_db import db
from app.core.deps import require_admin, get_current_user

router = APIRouter(tags=["logs & notifications"])

@router.get("/logs")
def get_audit_logs(admin: dict = Depends(require_admin)):
    logs = db.select("audit_logs")
    return sorted(logs, key=lambda x: x["created_at"], reverse=True)

@router.get("/notifications")
def get_my_notifications(current_user: dict = Depends(get_current_user)):
    notifs = db.select("notifications", lambda n: n.get("user_id") == current_user["id"])
    return sorted(notifs, key=lambda x: x["created_at"], reverse=True)

@router.post("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str, current_user: dict = Depends(get_current_user)):
    db.update("notifications", lambda n: n["id"] == notif_id and n["user_id"] == current_user["id"], {"read": True})
    return {"message": "Notification marked as read"}
