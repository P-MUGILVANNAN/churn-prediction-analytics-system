"""
Explainable AI (SHAP) API Endpoints.
Provides global feature importance rankings and local individual customer SHAP attributions.
"""
from fastapi import APIRouter, HTTPException
import os
import json
import pandas as pd

from backend.ml.explainability.explainer import ExplainabilityEngine, XAI_CACHE_PATH
from backend.app.schemas.schemas import CustomerInputSchema

router = APIRouter(prefix="/explanations", tags=["Explainable AI"])

_engine = None


def get_xai_engine():
    global _engine
    if _engine is None:
        _engine = ExplainabilityEngine()
    return _engine


@router.get("/global")
def get_global_explanations():
    """Returns global feature importance ranked by mean absolute SHAP values."""
    if os.path.exists(XAI_CACHE_PATH):
        with open(XAI_CACHE_PATH) as f:
            return json.load(f)
    
    # Otherwise calculate and cache
    engine = get_xai_engine()
    from backend.ml.data.ingestion import load_and_validate_dataset
    df, _ = load_and_validate_dataset()
    features = [c for c in df.columns if c not in ["customerID", "Churn", "Churn_Binary"]]
    return engine.compute_and_cache_global_importance(df[features])


@router.post("/local")
def get_local_explanation(payload: CustomerInputSchema):
    """Calculates individualized SHAP waterfall values for an input profile."""
    engine = get_xai_engine()
    row_df = pd.DataFrame([payload.model_dump()])
    if "TotalCharges" not in row_df or pd.isna(row_df["TotalCharges"].iloc[0]):
        row_df["TotalCharges"] = float(row_df["tenure"].iloc[0]) * float(row_df["MonthlyCharges"].iloc[0])
    return engine.explain_instance(row_df)
