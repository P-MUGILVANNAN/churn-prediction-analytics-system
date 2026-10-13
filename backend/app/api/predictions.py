"""
Churn Prediction API Endpoints.
Supports real-time single inference, batch CSV scoring, and local SHAP explanations.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import Response
from sqlalchemy.orm import Session
import io
import json
import pandas as pd

from backend.app.db.database import get_db
from backend.app.models.entities import PredictionRecord, Customer
from backend.app.schemas.schemas import CustomerInputSchema, SinglePredictionResponse
from backend.ml.prediction.predictor import ChurnPredictor

router = APIRouter(prefix="/predictions", tags=["Predictions"])

# Singleton predictor instance
_predictor = None


def get_predictor():
    global _predictor
    if _predictor is None:
        _predictor = ChurnPredictor()
    return _predictor


@router.post("/single", response_model=SinglePredictionResponse)
def predict_single_customer(payload: CustomerInputSchema, db: Session = Depends(get_db)):
    """Generates churn probability, risk tier, local SHAP explanation, and retention strategy."""
    predictor = get_predictor()
    data_dict = payload.model_dump()
    result = predictor.predict_single(data_dict)

    # Persist prediction record in audit history
    pred_rec = PredictionRecord(
        customer_id=result["customer_id"],
        model_version=result["model_version"],
        churn_probability=result["churn_probability"],
        predicted_churn=result["predicted_churn"],
        risk_tier=result["risk_tier"],
        top_factors_json=json.dumps(result["explanation"]["contributions"][:5]),
        recommendation_json=json.dumps(result["retention"])
    )
    db.add(pred_rec)
    db.commit()

    return result


@router.post("/batch")
async def predict_batch_customers(file: UploadFile = File(...)):
    """Uploads a CSV and returns scored predictions with probabilities and risk tiers."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported.")
    
    content = await file.read()
    df = pd.read_csv(io.BytesIO(content))
    
    predictor = get_predictor()
    scored_df = predictor.predict_batch(df)

    # Return CSV file stream
    output = io.StringIO()
    scored_df.to_csv(output, index=False)
    csv_bytes = output.getvalue().encode("utf-8")

    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=scored_{file.filename}"}
    )


@router.get("/history")
def get_recent_predictions(db: Session = Depends(get_db)):
    """Returns the most recent single customer predictions."""
    records = db.query(PredictionRecord).order_by(PredictionRecord.created_at.desc()).limit(20).all()
    results = []
    for r in records:
        results.append({
            "id": r.id,
            "customer_id": r.customer_id,
            "churn_probability": r.churn_probability,
            "risk_tier": r.risk_tier,
            "predicted_churn": r.predicted_churn,
            "created_at": r.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
    return results
