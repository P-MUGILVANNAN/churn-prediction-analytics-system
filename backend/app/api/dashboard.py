"""
Dashboard API Endpoints for executive overviews and KPIs.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.schemas.schemas import DashboardSummaryResponse
from backend.app.services.analytics_service import get_dashboard_summary_kpis

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """Returns overview KPIs, risk distributions, and revenue-at-risk metrics."""
    return get_dashboard_summary_kpis(db)
