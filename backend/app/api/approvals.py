from fastapi import APIRouter, Depends
from app.core.deps import require_admin
from app.schemas.all_schemas import ApprovalDecision
from app.services.approval_engine import process_approval

router = APIRouter(prefix="/approvals", tags=["approvals"])

@router.post("/{app_id}")
def approve_or_reject(app_id: str, body: ApprovalDecision, admin: dict = Depends(require_admin)):
    return process_approval(
        application_id=app_id,
        admin_id=admin["id"],
        decision=body.decision,
        remarks=body.remarks or ""
    )
