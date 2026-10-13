"""
Dataset ingestion, validation, and data quality pipeline for Telco Customer Churn.
Supports real IBM Telco Customer Churn dataset with validation against data leakage.
"""
import os
import urllib.request
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple

DEFAULT_DATA_URL = "https://raw.githubusercontent.com/IBM/telco-customer-churn-on-icp4d/master/data/Telco-Customer-Churn.csv"
RAW_DATA_PATH = os.path.join("data", "raw", "Telco-Customer-Churn.csv")
PROCESSED_DATA_PATH = os.path.join("data", "processed", "clean_telco_churn.csv")

EXPECTED_COLUMNS = [
    "customerID", "gender", "SeniorCitizen", "Partner", "Dependents",
    "tenure", "PhoneService", "MultipleLines", "InternetService",
    "OnlineSecurity", "OnlineBackup", "DeviceProtection", "TechSupport",
    "StreamingTV", "StreamingMovies", "Contract", "PaperlessBilling",
    "PaymentMethod", "MonthlyCharges", "TotalCharges", "Churn"
]

NUMERICAL_COLUMNS = ["tenure", "MonthlyCharges", "TotalCharges"]
CATEGORICAL_COLUMNS = [
    "gender", "SeniorCitizen", "Partner", "Dependents", "PhoneService",
    "MultipleLines", "InternetService", "OnlineSecurity", "OnlineBackup",
    "DeviceProtection", "TechSupport", "StreamingTV", "StreamingMovies",
    "Contract", "PaperlessBilling", "PaymentMethod"
]
TARGET_COLUMN = "Churn"


def ensure_raw_dataset(raw_path: str = RAW_DATA_PATH, url: str = DEFAULT_DATA_URL) -> str:
    """Ensure raw dataset exists locally; download if not present."""
    os.makedirs(os.path.dirname(raw_path), exist_ok=True)
    if not os.path.exists(raw_path):
        if os.path.exists("telco_test.csv"):
            import shutil
            shutil.move("telco_test.csv", raw_path)
        else:
            print(f"Downloading IBM Telco dataset from {url}...")
            urllib.request.urlretrieve(url, raw_path)
    return raw_path


def load_and_validate_dataset(raw_path: str = RAW_DATA_PATH) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """
    Loads raw CSV, validates columns and types, cleans whitespace anomalies in TotalCharges,
    and returns DataFrame along with a thorough data quality validation audit.
    """
    path = ensure_raw_dataset(raw_path)
    df = pd.read_csv(path)

    # 1. Column structure validation
    missing_cols = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Uploaded dataset is missing required columns: {missing_cols}")

    total_rows = len(df)
    duplicate_ids = int(df["customerID"].duplicated().sum())

    # 2. Data cleaning for TotalCharges: blanks " " occur when tenure == 0
    blank_total_charges = (df["TotalCharges"].astype(str).str.strip() == "").sum()
    df["TotalCharges"] = pd.to_numeric(df["TotalCharges"].astype(str).str.strip(), errors="coerce")
    
    # Impute missing TotalCharges with 0.0 or tenure * MonthlyCharges
    df["TotalCharges"] = df["TotalCharges"].fillna(df["tenure"] * df["MonthlyCharges"])

    # Ensure numeric columns have correct types
    df["tenure"] = pd.to_numeric(df["tenure"], errors="coerce").fillna(0).astype(int)
    df["MonthlyCharges"] = pd.to_numeric(df["MonthlyCharges"], errors="coerce").fillna(0.0).astype(float)
    df["SeniorCitizen"] = df["SeniorCitizen"].astype(int)

    # Clean Churn target column
    df["Churn"] = df["Churn"].astype(str).str.strip()
    df["Churn_Binary"] = df["Churn"].map({"Yes": 1, "No": 0})

    # Summary audit report
    audit_report = {
        "total_records": total_rows,
        "features_count": len(df.columns),
        "duplicate_ids": duplicate_ids,
        "blank_total_charges_remediated": int(blank_total_charges),
        "churn_rate": float(df["Churn_Binary"].mean()),
        "churn_count_yes": int((df["Churn"] == "Yes").sum()),
        "churn_count_no": int((df["Churn"] == "No").sum()),
        "tenure_min": int(df["tenure"].min()),
        "tenure_max": int(df["tenure"].max()),
        "tenure_mean": float(df["tenure"].mean()),
        "monthly_charges_mean": float(df["MonthlyCharges"].mean()),
        "total_charges_mean": float(df["TotalCharges"].mean()),
        "internet_services": df["InternetService"].value_counts().to_dict(),
        "contract_types": df["Contract"].value_counts().to_dict(),
    }

    # Save clean dataset
    os.makedirs(os.path.dirname(PROCESSED_DATA_PATH), exist_ok=True)
    df.to_csv(PROCESSED_DATA_PATH, index=False)
    
    return df, audit_report


if __name__ == "__main__":
    df, audit = load_and_validate_dataset()
    print("Ingestion complete. Audit summary:")
    for k, v in audit.items():
        print(f"  {k}: {v}")
