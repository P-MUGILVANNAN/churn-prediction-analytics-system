"""
Explainable AI (XAI) Engine using SHAP (SHapley Additive exPlanations).
Extracts global feature importance, summary distribution data,
and local individual customer Shapley feature contributions.
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
import shap
from typing import Dict, Any, List

MODELS_DIR = "models"
CHAMPION_PIPELINE_PATH = os.path.join(MODELS_DIR, "champion_pipeline.joblib")
XAI_CACHE_PATH = os.path.join(MODELS_DIR, "xai_global_summary.json")


class ExplainabilityEngine:
    def __init__(self, pipeline_path: str = CHAMPION_PIPELINE_PATH):
        if not os.path.exists(pipeline_path):
            raise FileNotFoundError(f"Model pipeline not found at {pipeline_path}. Please train models first.")
        
        bundle = joblib.load(pipeline_path)
        self.preprocessor = bundle["preprocessor"]
        self.model = bundle["model"]
        self.feature_names = bundle["feature_names"]
        self.model_name = bundle["model_name"]

        # Select tree model component for TreeExplainer
        if hasattr(self.model, "estimators_"):
            # VotingClassifier - use the XGBoost component (estimator 2) for exact fast tree SHAP
            tree_model = self.model.estimators_[2] # xgb
        elif hasattr(self.model, "estimators"):
            tree_model = self.model.estimators[2][1]
        else:
            tree_model = self.model

        self.tree_model = tree_model
        self.explainer = shap.TreeExplainer(self.tree_model)

    def compute_and_cache_global_importance(self, X_sample: pd.DataFrame, n_samples: int = 500) -> Dict[str, Any]:
        """Calculates global mean absolute SHAP values and feature impact directions."""
        sample_df = X_sample.sample(min(n_samples, len(X_sample)), random_state=42)
        X_trans = self.preprocessor.transform(sample_df)

        shap_vals = self.explainer.shap_values(X_trans)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1] # positive class if list
        
        # Mean absolute SHAP per transformed feature
        mean_abs = np.mean(np.abs(shap_vals), axis=0)
        
        # Rank features
        ranked_indices = np.argsort(mean_abs)[::-1]
        top_features = []
        for rank, idx in enumerate(ranked_indices[:15]):
            feat_name = self.feature_names[idx]
            imp_val = float(mean_abs[idx])
            # Determine correlation direction with churn
            direction = "Increases Risk" if np.corrcoef(X_trans[:, idx], shap_vals[:, idx])[0, 1] > 0 else "Reduces Risk"
            top_features.append({
                "rank": rank + 1,
                "feature": feat_name,
                "importance": round(imp_val, 4),
                "direction": direction,
                "display_name": feat_name.replace("cat__", "").replace("num__", "").replace("_", " ").title()
            })

        result = {
            "top_features": top_features,
            "sample_size": len(sample_df),
            "generated_at": pd.Timestamp.now().isoformat()
        }

        with open(XAI_CACHE_PATH, "w") as f:
            json.dump(result, f, indent=2)

        return result

    def explain_instance(self, single_row_df: pd.DataFrame) -> Dict[str, Any]:
        """Generates localized Shapley feature contributions for an individual customer."""
        X_trans = self.preprocessor.transform(single_row_df)
        shap_vals = self.explainer.shap_values(X_trans)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[1]

        inst_shap = shap_vals[0]
        base_value = float(self.explainer.expected_value) if not isinstance(self.explainer.expected_value, list) else float(self.explainer.expected_value[1])

        # Rank impacts for this individual
        sorted_indices = np.argsort(np.abs(inst_shap))[::-1]
        contributions = []
        for idx in sorted_indices[:10]:
            val = float(inst_shap[idx])
            feat_name = self.feature_names[idx]
            clean_name = feat_name.replace("cat__", "").replace("num__", "").replace("_", " ").title()
            contributions.append({
                "feature": clean_name,
                "raw_feature": feat_name,
                "shap_value": round(val, 4),
                "impact": "Increases Risk" if val > 0 else "Protective Factor",
                "percentage_weight": round(float(abs(val) / (np.sum(np.abs(inst_shap)) + 1e-7)) * 100, 1)
            })

        return {
            "base_value": round(base_value, 4),
            "contributions": contributions,
            "positive_risk_factors": [c for c in contributions if c["shap_value"] > 0],
            "mitigating_factors": [c for c in contributions if c["shap_value"] < 0]
        }


if __name__ == "__main__":
    from backend.ml.data.ingestion import load_and_validate_dataset
    df, _ = load_and_validate_dataset()
    engine = ExplainabilityEngine()
    features = [c for c in df.columns if c not in ["customerID", "Churn", "Churn_Binary"]]
    global_xai = engine.compute_and_cache_global_importance(df[features])
    print(f"Global XAI calculated. Top 5 drivers of churn:")
    for f in global_xai["top_features"][:5]:
        print(f"  {f['rank']}. {f['display_name']} (SHAP: {f['importance']:.4f}) -> {f['direction']}")
    
    # Test single instance explanation
    local_xai = engine.explain_instance(df[features].iloc[[0]])
    print("\nLocal Explanation for Customer #1:")
    for c in local_xai["contributions"][:3]:
        print(f"  {c['feature']}: {c['shap_value']:+.4f} ({c['impact']})")
