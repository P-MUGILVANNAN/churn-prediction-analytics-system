"""
Customer Segmentation API Endpoints.
Profiles customer cohorts across risk tiers, behavioral metrics, and revenue exposure.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import json

from backend.app.db.database import get_db
from backend.app.models.entities import CustomerSegment
from backend.ml.segmentation.segmenter import SEGMENTS_CACHE_PATH

router = APIRouter(prefix="/segments", tags=["Segmentation"])


@router.get("")
def get_segments(db: Session = Depends(get_db)):
    """Returns all identified customer segments with cluster statistics and strategic recommendations."""
    segments = db.query(CustomerSegment).all()
    if segments:
        return [
            {
                "id": s.id,
                "segment_code": s.segment_code,
                "segment_name": s.segment_name,
                "customer_count": s.customer_count,
                "avg_churn_prob": s.avg_churn_prob,
                "avg_monthly_charges": s.avg_monthly_charges,
                "avg_tenure": s.avg_tenure,
                "revenue_at_risk_monthly": s.revenue_at_risk_monthly,
                "recommended_action": s.recommended_action,
                "business_priority": s.business_priority,
                "color": s.color
            } for s in segments
        ]

    # Fallback to cached summary
    if os.path.exists(SEGMENTS_CACHE_PATH):
        with open(SEGMENTS_CACHE_PATH) as f:
            data = json.load(f)
            return data.get("segments", [])

    return []
