"""
Churn Prediction and Explainable Recommendation Engine.
Performs real-time single and batch inference, computes risk tiers,
calculates local SHAP feature impacts, and maps customer context
to transparent, rule-based retention decision-support recommendations.
"""
import os
import sys
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from datetime import datetime, timedelta

from backend.ml.explainability.explainer import ExplainabilityEngine

CHAMPION_PIPELINE_PATH = os.path.join("models", "champion_pipeline.joblib")


def derive_retention_recommendations(customer: Dict[str, Any], churn_prob: float, risk_tier: str) -> Dict[str, Any]:
    """
    Transparent rule-based retention strategy generator based on
    contract, support services, tenure, payment method, and predicted risk.
    """
    recs = []
    priority = "Low"

    # Contract Rule
    contract = customer.get("Contract", "Month-to-month")
    if contract == "Month-to-month" and churn_prob >= 0.40:
        recs.append({
            "trigger": "Month-to-month contract with elevated churn probability",
            "action": "Offer annual loyalty lock-in with 15% discount for 6 months or free device upgrade",
            "rationale": "Month-to-month subscribers represent 74% of historical churn events."
        })
        priority = "High" if churn_prob < 0.65 else "Urgent"

    # Support & Security Rule
    tech_support = customer.get("TechSupport", "No")
    online_sec = customer.get("OnlineSecurity", "No")
    internet = customer.get("InternetService", "Fiber optic")
    if (tech_support == "No" or online_sec == "No") and internet != "No" and churn_prob >= 0.35:
        recs.append({
            "trigger": "Subscribed to Fiber/DSL without TechSupport or OnlineSecurity",
            "action": "Enroll in complimentary 90-day Premier TechSupport & Cybersecurity suite",
            "rationale": "Lack of support infrastructure on premium connections increases frustration and churn risk."
        })
        if priority != "Urgent":
            priority = "High"

    # Payment Method Rule
    payment = customer.get("PaymentMethod", "Electronic check")
    if "Electronic check" in payment and churn_prob >= 0.35:
        recs.append({
            "trigger": "Manual payment via Electronic check",
            "action": "Incentivize Auto-Pay via Bank Transfer / Credit Card with $10 bill credit",
            "rationale": "Electronic check users exhibit highest involuntary churn and friction."
        })

    # Early Tenure Onboarding Rule
    tenure = float(customer.get("tenure", 12))
    if tenure <= 6 and churn_prob >= 0.45:
        recs.append({
            "trigger": "High-risk early tenure subscriber (tenure <= 6 months)",
            "action": "Schedule proactive 1-on-1 customer satisfaction concierge call",
            "rationale": "Early lifecycle intervention reduces 90-day churn cliffs significantly."
        })
        priority = "Urgent"

    # Fallback default if low risk
    if not recs:
        recs.append({
            "trigger": "Healthy customer engagement profile",
            "action": "Maintain standard quarterly relationship touchpoints; explore cross-sell opportunities",
            "rationale": "Customer displays stable usage patterns and strong retention characteristics."
        })
        priority = "Low"

    # Suggested follow-up
    days_to_followup = 3 if priority == "Urgent" else (7 if priority == "High" else 30)
    follow_up_date = (datetime.now() + timedelta(days=days_to_followup)).strftime("%Y-%m-%d")

    return {
        "risk_tier": risk_tier,
        "priority": priority,
        "primary_recommendation": recs[0]["action"],
        "all_recommendations": recs,
        "suggested_follow_up_date": follow_up_date,
        "disclaimer": "Decision-support recommendation. Not a guaranteed outcome; effectiveness subject to campaign evaluation."
    }


class ChurnPredictor:
    def __init__(self, pipeline_path: str = CHAMPION_PIPELINE_PATH):
        if not os.path.exists(pipeline_path):
            raise FileNotFoundError(f"Model pipeline not found at {pipeline_path}.")
        
        self.bundle = joblib.load(pipeline_path)
        self.preprocessor = self.bundle["preprocessor"]
        self.model = self.bundle["model"]
        self.feature_names = self.bundle["feature_names"]
        self.model_name = self.bundle["model_name"]
        self.explainer_engine = ExplainabilityEngine(pipeline_path)

    def predict_single(self, customer_data: Dict[str, Any]) -> Dict[str, Any]:
        """Runs single-customer prediction, XAI explanation, and recommendation."""
        # Convert dictionary to DataFrame
        row_df = pd.DataFrame([customer_data])
        
        # Ensure TotalCharges is present and numeric
        if "TotalCharges" not in row_df or pd.isna(row_df["TotalCharges"].iloc[0]):
            row_df["TotalCharges"] = float(row_df["tenure"].iloc[0]) * float(row_df["MonthlyCharges"].iloc[0])
        else:
            row_df["TotalCharges"] = pd.to_numeric(row_df["TotalCharges"], errors="coerce").fillna(0.0)

        row_df["tenure"] = pd.to_numeric(row_df["tenure"], errors="coerce").fillna(0).astype(int)
        row_df["MonthlyCharges"] = pd.to_numeric(row_df["MonthlyCharges"], errors="coerce").fillna(0.0).astype(float)
        row_df["SeniorCitizen"] = pd.to_numeric(row_df.get("SeniorCitizen", 0), errors="coerce").fillna(0).astype(int)

        # Preprocess & Predict
        X_trans = self.preprocessor.transform(row_df)
        prob = float(self.model.predict_proba(X_trans)[0, 1])

        # Risk Tier categorization (documented thresholds)
        if prob >= 0.65:
            risk_tier = "High"
        elif prob >= 0.35:
            risk_tier = "Medium"
        else:
            risk_tier = "Low"

        # Local Explainability
        explanation = self.explainer_engine.explain_instance(row_df)

        # Retention Decision Support
        retention_strategy = derive_retention_recommendations(customer_data, prob, risk_tier)

        return {
            "customer_id": customer_data.get("customerID", "UNKNOWN"),
            "churn_probability": round(prob, 4),
            "predicted_churn": bool(prob >= 0.5),
            "risk_tier": risk_tier,
            "monthly_charges": float(row_df["MonthlyCharges"].iloc[0]),
            "monthly_revenue_at_risk": round(float(row_df["MonthlyCharges"].iloc[0]) if prob >= 0.5 else 0.0, 2),
            "model_version": self.model_name,
            "prediction_timestamp": datetime.now().isoformat(),
            "explanation": explanation,
            "retention": retention_strategy
        }

    def predict_batch(self, df: pd.DataFrame) -> pd.DataFrame:
        """Batch scores customer records."""
        df_clean = df.copy()
        if "TotalCharges" in df_clean.columns:
            df_clean["TotalCharges"] = pd.to_numeric(df_clean["TotalCharges"].astype(str).str.strip(), errors="coerce")
            df_clean["TotalCharges"] = df_clean["TotalCharges"].fillna(df_clean["tenure"] * df_clean["MonthlyCharges"])

        X_trans = self.preprocessor.transform(df_clean)
        probs = self.model.predict_proba(X_trans)[:, 1]

        df_clean["churn_probability"] = np.round(probs, 4)
        df_clean["predicted_churn"] = (probs >= 0.5).astype(int)
        df_clean["risk_tier"] = np.where(probs >= 0.65, "High", np.where(probs >= 0.35, "Medium", "Low"))
        df_clean["monthly_revenue_at_risk"] = np.where(probs >= 0.5, df_clean["MonthlyCharges"], 0.0)

        return df_clean


if __name__ == "__main__":
    predictor = ChurnPredictor()
    sample_customer = {
        "customerID": "DEMO-9999",
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
        "MonthlyCharges": 85.5,
        "TotalCharges": 171.0
    }
    pred_res = predictor.predict_single(sample_customer)
    print("Prediction result:")
    print(f"  Probability: {pred_res['churn_probability'] * 100:.1f}% ({pred_res['risk_tier']} Risk)")
    print(f"  Top Factor: {pred_res['explanation']['contributions'][0]['feature']} ({pred_res['explanation']['contributions'][0]['impact']})")
    print(f"  Recommendation: {pred_res['retention']['primary_recommendation']}")
