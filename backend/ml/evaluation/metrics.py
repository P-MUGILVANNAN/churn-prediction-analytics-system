"""
Comprehensive Evaluation Metrics Suite for Customer Churn Classification.
Calculates Accuracy, Precision, Recall, F1-Score, ROC-AUC, PR-AUC, and Confusion Matrix.
"""
from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    confusion_matrix,
    roc_curve,
    precision_recall_curve,
    brier_score_loss
)


def compute_comprehensive_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Computes all standard research and business classification metrics.
    """
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # ROC curve points (sample 20 points for fast UI transmission)
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    idx_roc = np.linspace(0, len(fpr) - 1, min(25, len(fpr))).astype(int)
    roc_points = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in idx_roc]

    # PR curve points
    prec, rec, _ = precision_recall_curve(y_true, y_prob)
    idx_pr = np.linspace(0, len(prec) - 1, min(25, len(prec))).astype(int)
    pr_points = [{"recall": round(float(rec[i]), 4), "precision": round(float(prec[i]), 4)} for i in idx_pr]

    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
        "precision": round(float(precision_score(y_true, y_pred, zero_division=0)), 4),
        "recall": round(float(recall_score(y_true, y_pred, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_true, y_pred, zero_division=0)), 4),
        "roc_auc": round(float(roc_auc_score(y_true, y_prob)), 4),
        "pr_auc": round(float(average_precision_score(y_true, y_prob)), 4),
        "brier_score": round(float(brier_score_loss(y_true, y_prob)), 4),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp),
            "matrix": [[int(tn), int(fp)], [int(fn), int(tp)]]
        },
        "specificity": round(float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0, 4),
        "roc_curve": roc_points,
        "pr_curve": pr_points,
    }
