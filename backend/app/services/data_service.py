"""
Customer Data Ingestion, Storage, Filtering, and CSV Processing Service.
"""
import os
import io
import json
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from backend.app.models.entities import Customer, DatasetImport, CustomerSegment
from backend.ml.data.ingestion import PROCESSED_DATA_PATH, load_and_validate_dataset
from backend.ml.prediction.predictor import ChurnPredictor


def seed_database_if_empty(db: Session) -> int:
    """Seeds the customer database from the clean processed Telco dataset with predictions."""
    count = db.query(Customer).count()
    if count > 0:
        return count

    print("Database is empty. Ingesting and batch scoring initial dataset...")
    if not os.path.exists(PROCESSED_DATA_PATH):
        load_and_validate_dataset()

    df = pd.read_csv(PROCESSED_DATA_PATH)
    predictor = ChurnPredictor()
    df_scored = predictor.predict_batch(df)

    # Load segments
    seg_summary_file = os.path.join("models", "customer_segments_summary.json")
    if os.path.exists(seg_summary_file):
        with open(seg_summary_file) as f:
            seg_data = json.load(f)
            for seg in seg_data.get("segments", []):
                db.add(CustomerSegment(
                    cluster_id=seg.get("cluster_id", 0),
                    segment_code=seg["segment_code"],
                    segment_name=seg["segment_name"],
                    customer_count=seg["customer_count"],
                    avg_churn_prob=seg["avg_churn_prob"],
                    avg_monthly_charges=seg["avg_monthly_charges"],
                    avg_tenure=seg["avg_tenure"],
                    revenue_at_risk_monthly=seg["revenue_at_risk_monthly"],
                    recommended_action=seg["recommended_action"],
                    business_priority=seg["business_priority"],
                    color=seg["color"]
                ))
            db.commit()

    # Batch insert customers
    batch = []
    for _, row in df_scored.iterrows():
        # Assign coarse segment code
        prob = float(row["churn_probability"])
        chg = float(row["MonthlyCharges"])
        ten = int(row["tenure"])
        if prob >= 0.50 and chg >= 70:
            seg_code = "HIGH_RISK_HIGH_VALUE"
        elif prob >= 0.45 and ten <= 20:
            seg_code = "HIGH_RISK_NEW"
        elif prob < 0.25 and chg >= 75:
            seg_code = "LOYAL_HIGH_VALUE"
        elif prob < 0.25 and ten > 30:
            seg_code = "LOW_RISK_STEADY"
        else:
            seg_code = "UPSELL_CANDIDATE"

        cust = Customer(
            customer_id=str(row["customerID"]),
            gender=str(row["gender"]),
            senior_citizen=int(row["SeniorCitizen"]),
            partner=str(row["Partner"]),
            dependents=str(row["Dependents"]),
            tenure=int(row["tenure"]),
            phone_service=str(row["PhoneService"]),
            multiple_lines=str(row["MultipleLines"]),
            internet_service=str(row["InternetService"]),
            online_security=str(row["OnlineSecurity"]),
            online_backup=str(row["OnlineBackup"]),
            device_protection=str(row["DeviceProtection"]),
            tech_support=str(row["TechSupport"]),
            streaming_tv=str(row["StreamingTV"]),
            streaming_movies=str(row["StreamingMovies"]),
            contract=str(row["Contract"]),
            paperless_billing=str(row["PaperlessBilling"]),
            payment_method=str(row["PaymentMethod"]),
            monthly_charges=float(row["MonthlyCharges"]),
            total_charges=float(row["TotalCharges"]),
            actual_churn=str(row.get("Churn", "No")),
            predicted_churn_prob=float(row["churn_probability"]),
            risk_tier=str(row["risk_tier"]),
            segment_code=seg_code
        )
        batch.append(cust)

    db.bulk_save_objects(batch)
    db.commit()
    print(f"Successfully seeded {len(batch)} customer records into database.")
    return len(batch)


def get_paginated_customers(
    db: Session,
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    contract: Optional[str] = None,
    risk_tier: Optional[str] = None,
    actual_churn: Optional[str] = None,
    segment_code: Optional[str] = None,
    sort_by: str = "id",
    sort_desc: bool = False
) -> Tuple[List[Customer], int]:
    """Retrieves paginated, filtered customer records with search capability."""
    query = db.query(Customer)

    if search and search.strip() and search.lower() not in ("undefined", "null", "none"):
        s = f"%{search.strip()}%"
        query = query.filter(or_(Customer.customer_id.ilike(s), Customer.payment_method.ilike(s)))

    if contract and contract != "All":
        query = query.filter(Customer.contract == contract)

    if risk_tier and risk_tier != "All":
        query = query.filter(Customer.risk_tier == risk_tier)

    if actual_churn and actual_churn != "All":
        query = query.filter(Customer.actual_churn == actual_churn)

    if segment_code and segment_code != "All":
        query = query.filter(Customer.segment_code == segment_code)

    total = query.count()

    # Sorting
    sort_col = getattr(Customer, sort_by, Customer.id)
    if sort_desc:
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    items = query.offset((page - 1) * limit).limit(limit).all()
    return items, total


def process_uploaded_csv(file_bytes: bytes, filename: str, db: Session) -> Dict[str, Any]:
    """Validates and processes an uploaded customer CSV file."""
    try:
        df = pd.read_csv(io.BytesIO(file_bytes))
    except Exception as e:
        raise ValueError(f"Could not parse CSV file: {str(e)}")

    # Check minimum required columns
    required = ["customerID", "tenure", "MonthlyCharges", "Contract"]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing mandatory columns: {missing}")

    predictor = ChurnPredictor()
    scored_df = predictor.predict_batch(df)

    imported_count = 0
    updated_count = 0
    for _, row in scored_df.iterrows():
        cid = str(row["customerID"])
        prob = float(row["churn_probability"])
        chg = float(row.get("MonthlyCharges", 50.0))
        
        # Segment code determination
        if prob >= 0.50 and chg >= 70:
            seg_code = "HIGH_RISK_HIGH_VALUE"
        elif prob >= 0.50:
            seg_code = "HIGH_RISK_LOW_VALUE"
        elif chg >= 70:
            seg_code = "LOW_RISK_HIGH_VALUE"
        else:
            seg_code = "LOW_RISK_LOW_VALUE"

        existing = db.query(Customer).filter(Customer.customer_id == cid).first()
        if existing:
            existing.tenure = int(row.get("tenure", existing.tenure))
            existing.monthly_charges = chg
            existing.total_charges = float(row.get("TotalCharges", existing.total_charges))
            existing.contract = str(row.get("Contract", existing.contract))
            existing.payment_method = str(row.get("PaymentMethod", existing.payment_method))
            existing.predicted_churn_prob = prob
            existing.risk_tier = str(row["risk_tier"])
            existing.segment_code = seg_code
            updated_count += 1
        else:
            cust = Customer(
                customer_id=cid,
                gender=str(row.get("gender", "Unknown")),
                senior_citizen=int(row.get("SeniorCitizen", 0)),
                partner=str(row.get("Partner", "No")),
                dependents=str(row.get("Dependents", "No")),
                tenure=int(row.get("tenure", 0)),
                phone_service=str(row.get("PhoneService", "Yes")),
                multiple_lines=str(row.get("MultipleLines", "No")),
                internet_service=str(row.get("InternetService", "DSL")),
                online_security=str(row.get("OnlineSecurity", "No")),
                online_backup=str(row.get("OnlineBackup", "No")),
                device_protection=str(row.get("DeviceProtection", "No")),
                tech_support=str(row.get("TechSupport", "No")),
                streaming_tv=str(row.get("StreamingTV", "No")),
                streaming_movies=str(row.get("StreamingMovies", "No")),
                contract=str(row.get("Contract", "Month-to-month")),
                paperless_billing=str(row.get("PaperlessBilling", "Yes")),
                payment_method=str(row.get("PaymentMethod", "Electronic check")),
                monthly_charges=chg,
                total_charges=float(row.get("TotalCharges", 100.0)),
                actual_churn=str(row.get("Churn", "No")),
                predicted_churn_prob=prob,
                risk_tier=str(row["risk_tier"]),
                segment_code=seg_code
            )
            db.add(cust)
            imported_count += 1

    audit = DatasetImport(
        filename=filename,
        record_count=len(df),
        feature_count=len(df.columns),
        missing_values_handled=int(df.isna().sum().sum()),
        status="Success"
    )
    db.add(audit)
    db.commit()

    return {
        "status": "Success",
        "imported_records": imported_count,
        "updated_records": updated_count,
        "total_in_file": len(df),
        "mean_predicted_churn": round(float(scored_df["churn_probability"].mean()), 4)
    }
