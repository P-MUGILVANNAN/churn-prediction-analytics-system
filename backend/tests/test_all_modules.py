"""
Comprehensive Automated Test Suite for Customer Churn Analytics System.
Tests data validation, leakage-free preprocessing, model training & inference,
SHAP explainability, retention recommendations, and REST API endpoints.
"""
import pytest
import os
import sys
import numpy as np
import pandas as pd
from fastapi.testclient import TestClient

# Ensure sys.path includes project root
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.ml.data.ingestion import load_and_validate_dataset, EXPECTED_COLUMNS
from backend.ml.preprocessing.pipeline import get_feature_preprocessor, prepare_train_test_data
from backend.ml.prediction.predictor import ChurnPredictor, derive_retention_recommendations
from backend.ml.explainability.explainer import ExplainabilityEngine
from backend.ml.segmentation.segmenter import SegmentationEngine
from backend.app.main import app


@pytest.fixture(scope="session")
def dataset_df():
    df, audit = load_and_validate_dataset()
    return df


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


# 1. Dataset Ingestion & Quality Tests
def test_dataset_ingestion_and_schema(dataset_df):
    assert len(dataset_df) >= 7000, "Dataset should have at least 7,000 customer records"
    for col in EXPECTED_COLUMNS:
        assert col in dataset_df.columns, f"Column '{col}' must be present"
    assert dataset_df["customerID"].duplicated().sum() == 0, "No duplicate customer IDs allowed"
    assert not dataset_df["TotalCharges"].isna().any(), "TotalCharges should have zero NaNs after imputation"


# 2. Leakage-Free Preprocessing Tests
def test_preprocessing_leakage_free(dataset_df):
    X_train, X_test, y_train, y_test = prepare_train_test_data(dataset_df, test_size=0.2, random_state=42)
    assert len(X_train) == 5634
    assert len(X_test) == 1409

    preprocessor = get_feature_preprocessor()
    # Fit strictly on X_train
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)

    assert X_train_proc.shape[0] == len(X_train)
    assert X_test_proc.shape[0] == len(X_test)
    assert X_train_proc.shape[1] == X_test_proc.shape[1]
    assert not np.isnan(X_train_proc).any()
    assert not np.isnan(X_test_proc).any()


# 3. Model Inference & Risk Tier Assignment Tests
def test_churn_prediction_inference():
    predictor = ChurnPredictor()
    sample = {
        "customerID": "TEST-CUST-01",
        "gender": "Female",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 2,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "Yes",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 85.0,
        "TotalCharges": 170.0
    }
    pred = predictor.predict_single(sample)
    assert "churn_probability" in pred
    assert 0.0 <= pred["churn_probability"] <= 1.0
    assert pred["risk_tier"] in ["Low", "Medium", "High"]
    assert pred["risk_tier"] == "High", "Short tenure + month-to-month fiber should be classified as High Risk"
    assert pred["monthly_revenue_at_risk"] == 85.0


# 4. SHAP Explainability Engine Tests
def test_shap_explainability():
    engine = ExplainabilityEngine()
    sample_row = pd.DataFrame([{
        "gender": "Male",
        "SeniorCitizen": 0,
        "Partner": "No",
        "Dependents": "No",
        "tenure": 4,
        "PhoneService": "Yes",
        "MultipleLines": "No",
        "InternetService": "Fiber optic",
        "OnlineSecurity": "No",
        "OnlineBackup": "No",
        "DeviceProtection": "No",
        "TechSupport": "No",
        "StreamingTV": "No",
        "StreamingMovies": "No",
        "Contract": "Month-to-month",
        "PaperlessBilling": "Yes",
        "PaymentMethod": "Electronic check",
        "MonthlyCharges": 75.0,
        "TotalCharges": 300.0
    }])
    explanation = engine.explain_instance(sample_row)
    assert "contributions" in explanation
    assert len(explanation["contributions"]) > 0
    top_driver = explanation["contributions"][0]
    assert "feature" in top_driver
    assert "shap_value" in top_driver


# 5. Rule-Based Retention Recommendation Logic
def test_retention_recommendation_rules():
    cust = {
        "Contract": "Month-to-month",
        "TechSupport": "No",
        "OnlineSecurity": "No",
        "InternetService": "Fiber optic",
        "PaymentMethod": "Electronic check",
        "tenure": 3
    }
    rec = derive_retention_recommendations(cust, churn_prob=0.75, risk_tier="High")
    assert rec["priority"] == "Urgent"
    assert "Month-to-month" in rec["all_recommendations"][0]["trigger"]
    assert "suggested_follow_up_date" in rec


# 6. REST API Health and Dashboard Endpoints
def test_api_health_and_dashboard(client):
    res_health = client.get("/api/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"

    res_dash = client.get("/api/dashboard/summary")
    assert res_dash.status_code == 200
    data = res_dash.json()
    assert data["total_customers"] >= 7000
    assert data["predicted_churners"] > 0
    assert data["estimated_revenue_at_risk"] > 50000


# 7. Customer Filtering API Test
def test_api_customers_filtering(client):
    res = client.get("/api/customers?limit=10&risk_tier=High")
    assert res.status_code == 200
    data = res.json()
    assert len(data["items"]) == 10
    for item in data["items"]:
        assert item["risk_tier"] == "High"


# 8. Model Experiments API Test
def test_api_model_experiments(client):
    res = client.get("/api/models/experiments")
    assert res.status_code == 200
    exps = res.json()
    assert len(exps) >= 6, "At least 6 baseline experiments should be recorded"
    model_names = [e["model_name"] for e in exps]
    assert "Proposed_HybridEnsemble" in model_names
