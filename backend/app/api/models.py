"""
Machine Learning Model Training, Benchmark Comparison, and Champion API Endpoints.
"""
from fastapi import APIRouter, BackgroundTasks, HTTPException
import os
import json
from typing import Dict, Any, List

from backend.ml.training.trainer import train_and_evaluate_all_models, EXPERIMENTS_FILE, CHAMPION_META_FILE

router = APIRouter(prefix="/models", tags=["Machine Learning"])


@router.get("/experiments")
def get_model_experiments() -> List[Dict[str, Any]]:
    """Returns recorded benchmark experiments with evaluation metrics and confusion matrices."""
    if not os.path.exists(EXPERIMENTS_FILE):
        return []
    with open(EXPERIMENTS_FILE) as f:
        return json.load(f)


@router.get("/champion")
def get_champion_model():
    """Returns metadata, hyperparams, and test metrics for the current champion pipeline."""
    if not os.path.exists(CHAMPION_META_FILE):
        raise HTTPException(status_code=404, detail="Champion model not found. Please train models first.")
    with open(CHAMPION_META_FILE) as f:
        return json.load(f)


@router.post("/train")
def train_models_endpoint(use_smote: bool = False):
    """
    Triggers full benchmark retraining across 6 models + Proposed Hybrid Ensemble.
    Calculates 5-fold cross-validation and selects champion pipeline.
    """
    result = train_and_evaluate_all_models(use_smote=use_smote)
    return {
        "status": "Success",
        "champion": result["champion"]["model_name"],
        "roc_auc": result["champion"]["roc_auc"],
        "experiments_count": len(result["experiments"])
    }
