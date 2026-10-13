"""
Retention Campaigns and Outreach Tracker API Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from pydantic import BaseModel

from backend.app.db.database import get_db
from backend.app.schemas.schemas import CampaignCreate, CampaignResponse
from backend.app.services.campaign_service import (
    get_all_campaigns_with_stats,
    create_new_campaign,
    get_campaign_activities,
    update_activity_status
)

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


class StatusUpdateBody(BaseModel):
    status: str
    notes: str = ""


@router.get("", response_model=List[CampaignResponse])
def list_campaigns(db: Session = Depends(get_db)):
    """Lists all retention campaigns with live conversion and saved MRR metrics."""
    return get_all_campaigns_with_stats(db)


@router.post("")
def create_campaign(camp_in: CampaignCreate, db: Session = Depends(get_db)):
    """Creates a new targeted retention campaign and maps segment customers."""
    return create_new_campaign(camp_in, db)


@router.get("/{campaign_id}/activities")
def list_activities(campaign_id: int, db: Session = Depends(get_db)):
    """Returns customer outreach records for a specific campaign."""
    return get_campaign_activities(campaign_id, db)


@router.patch("/activities/{activity_id}")
def update_activity(activity_id: int, body: StatusUpdateBody, db: Session = Depends(get_db)):
    """Updates customer outreach outcome (e.g., Contacted, Offer Sent, Retained, Churned)."""
    try:
        return update_activity_status(activity_id, body.status, body.notes, db)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
