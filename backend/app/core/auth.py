"""Google Sign-In verification + our own short-lived session JWT, restricted to a single allowed email."""
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from app.core.config import settings

JWT_ALGORITHM = "HS256"

_bearer_scheme = HTTPBearer(auto_error=False)


class GoogleUser:
    def __init__(self, email: str, name: str | None = None, picture: str | None = None):
        self.email = email
        self.name = name
        self.picture = picture


def verify_google_id_token(token: str) -> GoogleUser:
    """Verify a Google Identity Services ID token and ensure it belongs to the one allowed account."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="GOOGLE_CLIENT_ID is not configured on the server.",
        )
    try:
        payload = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token: {exc}") from exc

    email = (payload.get("email") or "").lower().strip()
    if not payload.get("email_verified", False):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Google email is not verified.")
    if not settings.ALLOWED_GOOGLE_EMAIL or email != settings.ALLOWED_GOOGLE_EMAIL.lower().strip():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This Google account is not authorized.")

    return GoogleUser(email=email, name=payload.get("name"), picture=payload.get("picture"))


def create_access_token(email: str) -> str:
    if not settings.JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="JWT_SECRET_KEY is not configured on the server."
        )
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": email, "exp": expire}, settings.JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme)) -> str:
    """FastAPI dependency: validates the session JWT and returns the authenticated email."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please sign in again.") from exc
    except jwt.InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid session token.") from exc

    email = payload.get("sub")
    if not email or email != settings.ALLOWED_GOOGLE_EMAIL.lower().strip():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized.")
    return email
