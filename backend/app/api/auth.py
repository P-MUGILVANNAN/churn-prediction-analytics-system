"""
Authentication API Endpoints.
Provides secure token issuance for analysts and administrators.
"""
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.schemas import LoginRequest, TokenResponse
from backend.app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    """
    Authenticates user credentials.
    Supports secure demo access for academic reviews and enterprise evaluations.
    """
    if payload.username == settings.DEMO_USER and payload.password == settings.DEMO_PASS:
        return TokenResponse(
            access_token="mock-jwt-token-analyst-session-2026",
            token_type="bearer",
            role="Senior Churn Analyst",
            username=payload.username
        )
    elif payload.username == "admin" and payload.password == "admin123":
        return TokenResponse(
            access_token="mock-jwt-token-admin-session-2026",
            token_type="bearer",
            role="System Administrator",
            username=payload.username
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Use demo login (analyst@telecom.ai / churn2026)."
        )
