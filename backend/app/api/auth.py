from fastapi import APIRouter, Depends, HTTPException, Response, status
from app.core.file_db import db
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.core.deps import get_current_user
from app.schemas.all_schemas import LoginRequest, Token, UserResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, response: Response):
    user = db.select_one("users", lambda u: u["email"].lower() == login_data.email.lower())
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(user["id"], user["role"])
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/profiles", response_model=list[UserResponse])
def get_profiles():
    """List available active profiles for seamless switching without credentials."""
    users = db.select("users", lambda u: u.get("status") == "active")
    return users

@router.post("/switch/{user_id}", response_model=Token)
def switch_profile(user_id: str, response: Response):
    """Switch immediately to any active profile without requiring password."""
    user = db.select_one("users", lambda u: u["id"] == user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Profile not found")
    if user.get("status") != "active":
        raise HTTPException(status_code=403, detail="Account is deactivated")

    access_token = create_access_token(user["id"], user["role"])
    refresh_token = create_refresh_token(user["id"])

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False
    )

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key="refresh_token")
    return {"message": "Logged out successfully"}
