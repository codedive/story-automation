"""Google Sign-In login endpoint."""
from fastapi import APIRouter

from app.core.auth import create_access_token, verify_google_id_token
from app.schemas.auth import AuthUser, GoogleLoginRequest, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/google", response_model=TokenResponse)
def login_with_google(payload: GoogleLoginRequest):
    user = verify_google_id_token(payload.id_token)
    access_token = create_access_token(user.email)
    return TokenResponse(
        access_token=access_token,
        user=AuthUser(email=user.email, name=user.name, picture=user.picture),
    )
