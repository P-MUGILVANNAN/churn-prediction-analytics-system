"""
Customer Segmentation Engine using K-Means and Business Risk-Value Matrix.
Clusters customers into actionable segments:
1. High-Risk High-Value (Priority 1 for immediate retention outreach)
2. High-Risk New Customers (Onboarding & satisfaction check)
3. Loyal High-Value (Brand advocates / VIP treatment)
4. Low-Risk Steady (Core recurring base)
5. Upsell / Cross-Sell Candidates (Low-risk, basic services, high tenure)
"""
import os
import sys
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

SEGMENTS_CACHE_PATH = os.path.join("models", "customer_segments_summary.json")


class SegmentationEngine:
    def __init__(self, n_clusters: int = 5, random_state: int = 42):
        self.n_clusters = n_clusters
        self.random_state = random_state
        self.scaler = StandardScaler()
        self.kmeans = KMeans(n_clusters=n_clusters, random_state=random_state, n_init=10)

    def fit_and_profile_segments(self, df_with_predictions: pd.DataFrame) -> Dict[str, Any]:
        """
        Segments customers using numeric features + churn risk score,
        and labels each cluster with business semantics.
        """
        df = df_with_predictions.copy()
        
        # Prepare clustering features: tenure, MonthlyCharges, TotalCharges, churn_probability
        cluster_features = ["tenure", "MonthlyCharges", "TotalCharges", "churn_probability"]
        X_scaled = self.scaler.fit_transform(df[cluster_features])
        
        cluster_labels = self.kmeans.fit_predict(X_scaled)
        df["cluster_id"] = cluster_labels

        # Profile each cluster by mean stats to map to meaningful business titles
        cluster_profiles = []
        for cid in range(self.n_clusters):
            c_df = df[df["cluster_id"] == cid]
            mean_prob = float(c_df["churn_probability"].mean())
            mean_charges = float(c_df["MonthlyCharges"].mean())
            mean_tenure = float(c_df["tenure"].mean())
            count = len(c_df)
            rev_at_risk = float(c_df[c_df["churn_probability"] >= 0.5]["MonthlyCharges"].sum())

            # Assign business semantic label
            if mean_prob >= 0.50 and mean_charges >= 70:
                code = "HIGH_RISK_HIGH_VALUE"
                name = "High-Risk High-Value"
                action = "Executive Outreach & Bespoke Annual Discount"
                priority = "Critical"
                color = "#EF4444"
            elif mean_prob >= 0.45 and mean_tenure <= 20:
                code = "HIGH_RISK_NEW"
                name = "High-Risk New Customers"
                action = "Onboarding Support & Service Quality Check"
                priority = "High"
                color = "#F97316"
            elif mean_prob < 0.25 and mean_charges >= 75:
                code = "LOYAL_HIGH_VALUE"
                name = "Loyal High-Value"
                action = "VIP Loyalty Rewards & Early Feature Access"
                priority = "Low"
                color = "#10B981"
            elif mean_prob < 0.25 and mean_tenure > 30:
                code = "LOW_RISK_STEADY"
                name = "Low-Risk Steady"
                action = "Automated Quarterly Check-in"
                priority = "Standard"
                color = "#3B82F6"
            else:
                code = "UPSELL_CANDIDATE"
                name = "Upsell & Cross-Sell Candidates"
                action = "Bundled Multi-Product Upgrade Campaign"
                priority = "Medium"
                color = "#8B5CF6"

            cluster_profiles.append({
                "cluster_id": cid,
                "segment_code": code,
                "segment_name": name,
                "customer_count": count,
                "percentage": round((count / len(df)) * 100, 1),
                "avg_churn_prob": round(mean_prob, 3),
                "avg_monthly_charges": round(mean_charges, 2),
                "avg_tenure": round(mean_tenure, 1),
                "revenue_at_risk_monthly": round(rev_at_risk, 2),
                "recommended_action": action,
                "business_priority": priority,
                "color": color
            })

        # Save summary cache
        summary_result = {
            "total_customers": len(df),
            "segments": cluster_profiles,
            "generated_at": pd.Timestamp.now().isoformat()
        }

        os.makedirs("models", exist_ok=True)
        with open(SEGMENTS_CACHE_PATH, "w") as f:
            json.dump(summary_result, f, indent=2)

        return summary_result


if __name__ == "__main__":
    from backend.ml.data.ingestion import load_and_validate_dataset
    bundle = joblib.load(os.path.join("models", "champion_pipeline.joblib"))
    df, _ = load_and_validate_dataset()
    features = [c for c in df.columns if c not in ["customerID", "Churn", "Churn_Binary"]]
    X_trans = bundle["preprocessor"].transform(df[features])
    df["churn_probability"] = bundle["model"].predict_proba(X_trans)[:, 1]

    engine = SegmentationEngine()
    summary = engine.fit_and_profile_segments(df)
    print("Segmentation summary:")
    for seg in summary["segments"]:
        print(f"  [{seg['segment_name']}] Count: {seg['customer_count']} ({seg['percentage']}%) | Avg Churn: {seg['avg_churn_prob']} | MRR at Risk: ${seg['revenue_at_risk_monthly']:,.2f}")
