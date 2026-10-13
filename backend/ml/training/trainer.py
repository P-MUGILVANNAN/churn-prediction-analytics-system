"""
Comprehensive Machine Learning Training Pipeline for Customer Churn Analytics.
Trains 6 benchmark models + Proposed Research Hybrid Ensemble.
Performs 5-fold Stratified Cross-Validation, Resampling comparisons,
evaluates on held-out test split, and serializes the champion model artifact.
"""
import os
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List, Tuple

from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier, VotingClassifier
from sklearn.svm import SVC
from xgboost import XGBClassifier
from sklearn.model_selection import StratifiedKFold, cross_val_score
from imblearn.over_sampling import SMOTE

from backend.ml.data.ingestion import load_and_validate_dataset
from backend.ml.preprocessing.pipeline import get_feature_preprocessor, prepare_train_test_data
from backend.ml.evaluation.metrics import compute_comprehensive_metrics

MODELS_DIR = "models"
EXPERIMENTS_FILE = os.path.join(MODELS_DIR, "experiments_history.json")
CHAMPION_META_FILE = os.path.join(MODELS_DIR, "champion_model_meta.json")


def get_model_instances() -> Dict[str, Any]:
    """Instantiates the benchmark suite and the proposed hybrid ensemble."""
    return {
        "LogisticRegression": LogisticRegression(max_iter=1000, C=0.8, random_state=42),
        "DecisionTree": DecisionTreeClassifier(max_depth=5, min_samples_leaf=10, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=120, max_depth=8, min_samples_leaf=4, random_state=42),
        "SupportVectorMachine": SVC(probability=True, kernel="rbf", C=1.0, random_state=42),
        "GradientBoosting": GradientBoostingClassifier(n_estimators=100, learning_rate=0.08, max_depth=3, random_state=42),
        "XGBoost": XGBClassifier(n_estimators=120, learning_rate=0.06, max_depth=4, eval_metric="logloss", random_state=42),
    }


def train_and_evaluate_all_models(
    use_smote: bool = False,
    random_state: int = 42
) -> Dict[str, Any]:
    """
    Executes full benchmark suite across held-out test set and 5-fold CV.
    Also builds and evaluates Proposed Research Hybrid Ensemble.
    Identifies champion based on optimal ROC-AUC & Recall trade-off.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)
    df, audit = load_and_validate_dataset()
    X_train_raw, X_test_raw, y_train, y_test = prepare_train_test_data(df, random_state=random_state)

    # Fit preprocessor strictly on X_train (Leakage-free)
    preprocessor = get_feature_preprocessor()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)
    feature_names = list(preprocessor.get_feature_names_out())

    # Handle class imbalance if requested
    resampling_name = "None"
    if use_smote:
        sm = SMOTE(random_state=random_state)
        X_train_fit, y_train_fit = sm.fit_resample(X_train, y_train)
        resampling_name = "SMOTE"
    else:
        X_train_fit, y_train_fit = X_train, y_train

    models_dict = get_model_instances()

    # Also build the Proposed Research Hybrid Ensemble (Soft Voting)
    hybrid_ensemble = VotingClassifier(
        estimators=[
            ("lr", LogisticRegression(max_iter=1000, C=0.8, random_state=random_state)),
            ("rf", RandomForestClassifier(n_estimators=120, max_depth=8, min_samples_leaf=4, random_state=random_state)),
            ("xgb", XGBClassifier(n_estimators=120, learning_rate=0.06, max_depth=4, eval_metric="logloss", random_state=random_state)),
        ],
        voting="soft",
        weights=[1.0, 1.2, 1.5]
    )
    models_dict["Proposed_HybridEnsemble"] = hybrid_ensemble

    experiments = []
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=random_state)
    trained_estimators = {}

    for name, model in models_dict.items():
        print(f"Training and cross-validating {name}...")
        # 5-Fold Cross Validation on training split
        cv_scores = cross_val_score(model, X_train_fit, y_train_fit, cv=skf, scoring="roc_auc")
        cv_mean = float(np.mean(cv_scores))
        cv_std = float(np.std(cv_scores))

        # Fit on entire training set
        model.fit(X_train_fit, y_train_fit)
        trained_estimators[name] = model

        # Evaluate on held-out test set
        y_prob = model.predict_proba(X_test)[:, 1]
        y_pred = (y_prob >= 0.5).astype(int)

        metrics = compute_comprehensive_metrics(y_test.values, y_pred, y_prob)
        metrics["model_name"] = name
        metrics["resampling"] = resampling_name
        metrics["cv_roc_auc_mean"] = round(cv_mean, 4)
        metrics["cv_roc_auc_std"] = round(cv_std, 4)
        metrics["parameters"] = str(model.get_params())
        metrics["trained_at"] = datetime.utcnow().isoformat()

        experiments.append(metrics)

    # Rank and select Champion model (Highest ROC-AUC on held-out test split)
    champion_record = max(experiments, key=lambda x: x["roc_auc"])
    champion_name = champion_record["model_name"]
    champion_estimator = trained_estimators[champion_name]

    # Package complete champion pipeline (preprocessor + model)
    champion_artifact_path = os.path.join(MODELS_DIR, "champion_pipeline.joblib")
    joblib.dump({
        "preprocessor": preprocessor,
        "model": champion_estimator,
        "feature_names": feature_names,
        "model_name": champion_name,
        "metrics": champion_record,
        "trained_at": champion_record["trained_at"]
    }, champion_artifact_path)

    # Save meta & experiments
    with open(CHAMPION_META_FILE, "w") as f:
        json.dump(champion_record, f, indent=2)

    with open(EXPERIMENTS_FILE, "w") as f:
        json.dump(experiments, f, indent=2)

    print(f"\nTraining Complete! Champion Model Selected: {champion_name} (ROC-AUC: {champion_record['roc_auc']})")
    return {
        "champion": champion_record,
        "experiments": experiments,
        "artifact_path": champion_artifact_path,
        "feature_count": len(feature_names)
    }


if __name__ == "__main__":
    result = train_and_evaluate_all_models()
    print("\nSummary of Model Evaluation Benchmark:")
    for exp in result["experiments"]:
        print(f"  {exp['model_name']:25s} | ROC-AUC: {exp['roc_auc']:.4f} | Recall: {exp['recall']:.4f} | F1: {exp['f1_score']:.4f} | Acc: {exp['accuracy']:.4f}")
