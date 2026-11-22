import uuid
from datetime import datetime
from app.core.file_db import db

def log_audit(user_id: str, action: str, target_type: str, target_id: str, details: dict):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "created_at": datetime.utcnow().isoformat()
    }
    db.insert("audit_logs", entry)

def send_notification(user_id: str, message: str, link: str = ""):
    notif = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "message": message,
        "link": link,
        "read": False,
        "created_at": datetime.utcnow().isoformat()
    }
    db.insert("notifications", notif)
