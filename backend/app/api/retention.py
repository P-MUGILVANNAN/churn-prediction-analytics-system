"""
Retention Recommendation Decision-Support API Endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.db.database import get_db
from backend.app.models.entities import Customer, RetentionRecommendation
from backend.app.schemas.schemas import RecommendationUpdate
from backend.ml.prediction.predictor import derive_retention_recommendations

router = APIRouter(prefix="/retention", tags=["Retention"])


@router.get("/recommendations")
def get_recommendations(db: Session = Depends(get_db)):
    """Fetches high-risk customers requiring immediate decision support and outreach."""
    high_risk_custs = db.query(Customer).filter(Customer.risk_tier == "High").limit(20).all()
    results = []
    for c in high_risk_custs:
        cust_dict = {
            "customerID": c.customer_id,
            "Contract": c.contract,
            "TechSupport": c.tech_support,
            "OnlineSecurity": c.online_security,
            "InternetService": c.internet_service,
            "PaymentMethod": c.payment_method,
            "tenure": c.tenure,
            "MonthlyCharges": c.monthly_charges
        }
        rec = derive_retention_recommendations(cust_dict, c.predicted_churn_prob or 0.65, "High")
        results.append({
            "id": c.id,
            "customer_id": c.customer_id,
            "churn_probability": c.predicted_churn_prob,
            "risk_tier": c.risk_tier,
            "monthly_charges": c.monthly_charges,
            "contract": c.contract,
            "tenure": c.tenure,
            "priority": rec["priority"],
            "primary_recommendation": rec["primary_recommendation"],
            "rationale": rec["all_recommendations"][0]["rationale"] if rec["all_recommendations"] else "",
            "suggested_follow_up_date": rec["suggested_follow_up_date"],
            "status": "Pending"
        })
    return results
