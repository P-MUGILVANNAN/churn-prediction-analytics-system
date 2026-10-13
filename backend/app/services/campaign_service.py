"""
Campaign and Retention Activity Service.
Tracks campaigns, outreach status, outcomes (Retained/Churned), and ROI.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from backend.app.models.entities import Campaign, CampaignActivity, Customer
from backend.app.schemas.schemas import CampaignCreate


def get_all_campaigns_with_stats(db: Session) -> List[Dict[str, Any]]:
    """Lists all campaigns along with live outcome counts and calculated ROI."""
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    
    # If no campaigns exist yet, seed a default demo campaign
    if not campaigns:
        default_camp = Campaign(
            campaign_name="Q4 High-Value VIP Retention Initiative",
            target_segment="HIGH_RISK_HIGH_VALUE",
            budget=2500.0,
            offer_details="15% Annual contract discount + Complimentary 1-year cybersecurity suite",
            channel="Dedicated Account Manager Outreach",
            status="Active"
        )
        db.add(default_camp)
        db.commit()
        db.refresh(default_camp)

        # Seed sample activities
        high_risk_custs = db.query(Customer).filter(Customer.risk_tier == "High").limit(15).all()
        for idx, cust in enumerate(high_risk_custs):
            status = "Retained" if idx < 5 else ("Offer Sent" if idx < 10 else "Contacted")
            act = CampaignActivity(
                campaign_id=default_camp.id,
                customer_id=cust.customer_id,
                outreach_channel="Phone & Email",
                status=status,
                notes="Offered bespoke annual lock-in."
            )
            db.add(act)
        db.commit()
        campaigns = [default_camp]

    results = []
    for c in campaigns:
        acts = db.query(CampaignActivity).filter(CampaignActivity.campaign_id == c.id).all()
        retained = sum(1 for a in acts if a.status == "Retained")
        churned = sum(1 for a in acts if a.status == "Churned")
        contacted = sum(1 for a in acts if a.status in ["Contacted", "Offer Sent", "Retained"])

        # Estimate saved MRR
        saved_mrr = 0.0
        retained_ids = [a.customer_id for a in acts if a.status == "Retained"]
        if retained_ids:
            saved_mrr = db.query(func.sum(Customer.monthly_charges)).filter(Customer.customer_id.in_(retained_ids)).scalar() or 0.0

        results.append({
            "id": c.id,
            "campaign_name": c.campaign_name,
            "target_segment": c.target_segment,
            "budget": c.budget,
            "offer_details": c.offer_details,
            "channel": c.channel,
            "status": c.status,
            "activity_count": len(acts),
            "contacted_count": contacted,
            "retained_count": retained,
            "churned_count": churned,
            "saved_mrr": round(float(saved_mrr), 2),
            "roi_ratio": round((float(saved_mrr) * 12) / c.budget, 2) if c.budget > 0 else 0.0,
            "created_at": c.created_at.strftime("%Y-%m-%d")
        })

    return results


def create_new_campaign(camp_in: CampaignCreate, db: Session) -> Dict[str, Any]:
    """Creates a new campaign and automatically links relevant target customers."""
    camp = Campaign(
        campaign_name=camp_in.campaign_name,
        target_segment=camp_in.target_segment,
        budget=camp_in.budget,
        offer_details=camp_in.offer_details,
        channel=camp_in.channel,
        status="Active"
    )
    db.add(camp)
    db.commit()
    db.refresh(camp)

    # Automatically populate activities from matching segment or risk tier
    query = db.query(Customer)
    if camp_in.target_segment == "HIGH_RISK_HIGH_VALUE":
        query = query.filter(Customer.risk_tier == "High", Customer.monthly_charges >= 70)
    elif camp_in.target_segment == "HIGH_RISK_NEW":
        query = query.filter(Customer.risk_tier == "High", Customer.tenure <= 12)
    else:
        query = query.filter(Customer.risk_tier.in_(["High", "Medium"]))

    target_custs = query.limit(25).all()
    for cust in target_custs:
        act = CampaignActivity(
            campaign_id=camp.id,
            customer_id=cust.customer_id,
            outreach_channel=camp_in.channel,
            status="Pending",
            notes=f"Targeted based on segment: {camp_in.target_segment}"
        )
        db.add(act)

    db.commit()
    return {"id": camp.id, "campaign_name": camp.campaign_name, "linked_customers": len(target_custs)}


def get_campaign_activities(campaign_id: int, db: Session) -> List[Dict[str, Any]]:
    """Fetches customer activities for a specific campaign with customer details."""
    activities = db.query(CampaignActivity).filter(CampaignActivity.campaign_id == campaign_id).all()
    results = []
    for a in activities:
        cust = db.query(Customer).filter(Customer.customer_id == a.customer_id).first()
        results.append({
            "id": a.id,
            "customer_id": a.customer_id,
            "status": a.status,
            "outreach_channel": a.outreach_channel,
            "notes": a.notes,
            "monthly_charges": cust.monthly_charges if cust else 0.0,
            "contract": cust.contract if cust else "Unknown",
            "risk_tier": cust.risk_tier if cust else "Medium",
            "churn_prob": cust.predicted_churn_prob if cust else 0.5,
            "updated_at": a.updated_at.strftime("%Y-%m-%d")
        })
    return results


def update_activity_status(activity_id: int, new_status: str, notes: str, db: Session) -> Dict[str, Any]:
    """Updates campaign activity status and outcome notes."""
    act = db.query(CampaignActivity).filter(CampaignActivity.id == activity_id).first()
    if not act:
        raise ValueError(f"Activity {activity_id} not found.")
    
    act.status = new_status
    if notes:
        act.notes = notes
    act.updated_at = datetime.utcnow()
    db.commit()
    return {"id": act.id, "status": act.status, "notes": act.notes}
