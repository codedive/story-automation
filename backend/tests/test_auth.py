"""Tests for Google Sign-In verification, JWT session tokens, and the single-allowed-email restriction."""
from unittest.mock import patch

import jwt
import pytest
from fastapi import HTTPException

from app.core.auth import create_access_token, get_current_user, verify_google_id_token
from app.core.config import settings


@pytest.fixture(autouse=True)
def _configure_auth_settings(monkeypatch):
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "ALLOWED_GOOGLE_EMAIL", "owner@example.com")
    monkeypatch.setattr(settings, "JWT_SECRET_KEY", "test-secret")


def test_verify_google_id_token_accepts_allowed_email():
    with patch("app.core.auth.google_id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = {
            "email": "Owner@Example.com",
            "email_verified": True,
            "name": "Owner",
            "picture": "https://example.com/pic.png",
        }
        user = verify_google_id_token("fake-token")
    assert user.email == "owner@example.com"
    assert user.name == "Owner"


def test_verify_google_id_token_rejects_other_email():
    with patch("app.core.auth.google_id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = {"email": "stranger@example.com", "email_verified": True}
        with pytest.raises(HTTPException) as exc_info:
            verify_google_id_token("fake-token")
    assert exc_info.value.status_code == 403


def test_verify_google_id_token_rejects_unverified_email():
    with patch("app.core.auth.google_id_token.verify_oauth2_token") as mock_verify:
        mock_verify.return_value = {"email": "owner@example.com", "email_verified": False}
        with pytest.raises(HTTPException) as exc_info:
            verify_google_id_token("fake-token")
    assert exc_info.value.status_code == 401


def test_create_and_decode_access_token_round_trip():
    token = create_access_token("owner@example.com")

    class FakeCredentials:
        credentials = token

    email = get_current_user(FakeCredentials())
    assert email == "owner@example.com"


def test_get_current_user_rejects_token_for_different_email(monkeypatch):
    token = jwt.encode({"sub": "stranger@example.com", "exp": 9999999999}, "test-secret", algorithm="HS256")

    class FakeCredentials:
        credentials = token

    with pytest.raises(HTTPException) as exc_info:
        get_current_user(FakeCredentials())
    assert exc_info.value.status_code == 403


def test_get_current_user_rejects_missing_credentials():
    with pytest.raises(HTTPException) as exc_info:
        get_current_user(None)
    assert exc_info.value.status_code == 401
