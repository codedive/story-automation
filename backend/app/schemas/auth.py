"""Pydantic schemas for Google Sign-In authentication."""
from pydantic import BaseModel


class GoogleLoginRequest(BaseModel):
    id_token: str


class AuthUser(BaseModel):
    email: str
    name: str | None = None
    picture: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AuthUser
