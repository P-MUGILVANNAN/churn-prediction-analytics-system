"""
Customer Data Explorer and Management API Endpoints.
Supports searching, sorting, filtering, single customer inspection, CSV ingestion and export.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional
import io
import pandas as pd

from backend.app.db.database import get_db
from backend.app.models.entities import Customer
from backend.app.schemas.schemas import PaginatedCustomersResponse
from backend.app.services.data_service import get_paginated_customers, process_uploaded_csv

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.get("", response_model=PaginatedCustomersResponse)
def list_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    contract: Optional[str] = None,
    risk_tier: Optional[str] = None,
    actual_churn: Optional[str] = None,
    segment_code: Optional[str] = None,
    sort_by: str = "id",
    sort_desc: bool = False,
    db: Session = Depends(get_db)
):
    """Retrieves paginated, searchable customer records with filters."""
    items, total = get_paginated_customers(
        db=db,
        page=page,
        limit=limit,
        search=search,
        contract=contract,
        risk_tier=risk_tier,
        actual_churn=actual_churn,
        segment_code=segment_code,
        sort_by=sort_by,
        sort_desc=sort_desc
    )
    total_pages = (total + limit - 1) // limit
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }


@router.get("/export")
def export_customers_csv(
    risk_tier: Optional[str] = None,
    contract: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Exports filtered customer records and prediction scores as downloadable CSV."""
    query = db.query(Customer)
    if risk_tier and risk_tier != "All":
        query = query.filter(Customer.risk_tier == risk_tier)
    if contract and contract != "All":
        query = query.filter(Customer.contract == contract)

    customers = query.limit(1000).all()
    records = []
    for c in customers:
        records.append({
            "CustomerID": c.customer_id,
            "Gender": c.gender,
            "Tenure": c.tenure,
            "Contract": c.contract,
            "InternetService": c.internet_service,
            "MonthlyCharges": c.monthly_charges,
            "TotalCharges": c.total_charges,
            "ActualChurn": c.actual_churn,
            "PredictedChurnProbability": c.predicted_churn_prob,
            "RiskTier": c.risk_tier,
            "Segment": c.segment_code
        })

    df = pd.DataFrame(records)
    output = io.StringIO()
    df.to_csv(output, index=False)
    csv_bytes = output.getvalue().encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=customers_churn_export.csv"}
    )


@router.get("/{customer_id}")
def get_customer_details(customer_id: str, db: Session = Depends(get_db)):
    """Retrieves detailed 360-degree customer profile."""
    cust = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not cust:
        raise HTTPException(status_code=404, detail=f"Customer '{customer_id}' not found.")
    return cust


@router.post("/upload")
async def upload_dataset_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Validates and ingests customer records from CSV."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    
    content = await file.read()
    try:
        result = process_uploaded_csv(content, file.filename, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
