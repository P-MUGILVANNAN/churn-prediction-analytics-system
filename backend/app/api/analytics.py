"""
Exploratory Data Analysis and Revenue-at-Risk API Endpoints.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.db.database import get_db
from backend.app.services.analytics_service import get_revenue_risk_deep_dive
from backend.ml.data.ingestion import load_and_validate_dataset

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/eda")
def get_exploratory_data_analysis():
    """
    Returns authentic exploratory data distributions, missing value audits,
    and churn rates across features from the cleaned dataset.
    """
    df, audit = load_and_validate_dataset()
    
    # Contract vs Churn
    contract_df = df.groupby("Contract")["Churn_Binary"].agg(["count", "mean"]).reset_index()
    contract_eda = [
        {"contract": row["Contract"], "count": int(row["count"]), "churn_rate": round(float(row["mean"]) * 100, 1)}
        for _, row in contract_df.iterrows()
    ]

    # Payment Method vs Churn
    pm_df = df.groupby("PaymentMethod")["Churn_Binary"].agg(["count", "mean"]).reset_index()
    payment_eda = [
        {"payment_method": row["PaymentMethod"], "count": int(row["count"]), "churn_rate": round(float(row["mean"]) * 100, 1)}
        for _, row in pm_df.iterrows()
    ]

    # Tech Support vs Churn
    ts_df = df.groupby("TechSupport")["Churn_Binary"].agg(["count", "mean"]).reset_index()
    tech_support_eda = [
        {"tech_support": row["TechSupport"], "count": int(row["count"]), "churn_rate": round(float(row["mean"]) * 100, 1)}
        for _, row in ts_df.iterrows()
    ]

    # Online Security vs Churn
    os_df = df.groupby("OnlineSecurity")["Churn_Binary"].agg(["count", "mean"]).reset_index()
    online_sec_eda = [
        {"online_security": row["OnlineSecurity"], "count": int(row["count"]), "churn_rate": round(float(row["mean"]) * 100, 1)}
        for _, row in os_df.iterrows()
    ]

    # Correlation with Churn
    numeric_corr = {
        "tenure": round(float(df["tenure"].corr(df["Churn_Binary"])), 3),
        "MonthlyCharges": round(float(df["MonthlyCharges"].corr(df["Churn_Binary"])), 3),
        "TotalCharges": round(float(df["TotalCharges"].corr(df["Churn_Binary"])), 3),
        "SeniorCitizen": round(float(df["SeniorCitizen"].corr(df["Churn_Binary"])), 3)
    }

    return {
        "audit": audit,
        "contract_eda": contract_eda,
        "payment_eda": payment_eda,
        "tech_support_eda": tech_support_eda,
        "online_sec_eda": online_sec_eda,
        "correlations": numeric_corr
    }


@router.get("/revenue-risk")
def get_revenue_risk(db: Session = Depends(get_db)):
    """Returns detailed revenue-at-risk analysis across contracts and customer segments."""
    return get_revenue_risk_deep_dive(db)
