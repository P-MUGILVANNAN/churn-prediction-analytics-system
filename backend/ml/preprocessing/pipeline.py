"""
Preprocessing pipeline for Telco Churn prediction.
Constructs a scikit-learn ColumnTransformer that guarantees:
1. No data leakage (fit strictly on X_train).
2. Proper scaling for numerical columns.
3. One-hot encoding for categorical columns with handle_unknown='ignore'.
4. Feature name preservation for explainability (SHAP).
"""
import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

import pandas as pd
import numpy as np
from typing import List, Tuple
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.model_selection import train_test_split

NUMERICAL_COLS = ["tenure", "MonthlyCharges", "TotalCharges"]
CATEGORICAL_COLS = [
    "gender", "SeniorCitizen", "Partner", "Dependents",
    "PhoneService", "MultipleLines", "InternetService",
    "OnlineSecurity", "OnlineBackup", "DeviceProtection",
    "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaperlessBilling", "PaymentMethod"
]
TARGET_COL = "Churn_Binary"


def get_feature_preprocessor() -> ColumnTransformer:
    """Returns a scikit-learn ColumnTransformer for numerical and categorical features."""
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_COLS),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLS),
        ],
        remainder="drop",
        verbose_feature_names_out=False
    )
    return preprocessor


def prepare_train_test_data(
    df: pd.DataFrame, 
    test_size: float = 0.2, 
    random_state: int = 42
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    """
    Splits features and target using stratified sampling to maintain churn distribution.
    Guarantees no data leakage prior to preprocessing fit.
    """
    feature_cols = NUMERICAL_COLS + CATEGORICAL_COLS
    X = df[feature_cols].copy()
    y = df[TARGET_COL].copy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )
    return X_train, X_test, y_train, y_test


if __name__ == "__main__":
    from backend.ml.data.ingestion import load_and_validate_dataset
    df, _ = load_and_validate_dataset()
    X_train, X_test, y_train, y_test = prepare_train_test_data(df)
    preproc = get_feature_preprocessor()
    X_train_proc = preproc.fit_transform(X_train)
    X_test_proc = preproc.transform(X_test)
    feature_names = preproc.get_feature_names_out()
    print(f"X_train shape: {X_train.shape} -> Processed: {X_train_proc.shape}")
    print(f"X_test shape: {X_test.shape} -> Processed: {X_test_proc.shape}")
    print(f"Generated {len(feature_names)} transformed feature columns.")
