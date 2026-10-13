# System Architecture, Database Schema & Implementation Plan

**Project Title**: Customer Churn Prediction and Retention Analytics System Using Explainable Machine Learning  
**Target Domains**: Final-Year Academic Capstone, IEEE Conference/Journal Submission, Enterprise SaaS Analytics

---

## 1. System Architecture Overview

The application follows an enterprise-grade multi-tier architecture designed for reproducible machine learning research and interactive decision-support operations.

```mermaid
graph TB
    subgraph Frontend ["Frontend Tier (React + Vite + TailwindCSS + Recharts)"]
        UI_AUTH[Auth & Session]
        UI_DASH[Executive Dashboard]
        UI_CUSTOMERS[Customer Explorer & CSV Upload]
        UI_EDA[Exploratory Data Analysis]
        UI_TRAIN[Model Training & Experiments]
        UI_PREDICT[Interactive & Batch Prediction]
        UI_XAI[Explainable AI (SHAP)]
        UI_SEG[Customer Segmentation]
        UI_REC[Retention Recommendations]
        UI_CAMP[Campaign Management]
        UI_REV[Revenue-at-Risk Analytics]
        UI_REP[Research & Reports Export]
    end

    subgraph Backend ["Backend API Tier (FastAPI + Pydantic v2)"]
        API_ROUTER[API Router & Auth Middleware]
        SVC_DATA[Data Pipeline Service]
        SVC_ML[ML Training & Evaluation Service]
        SVC_XAI[SHAP Explainability Engine]
        SVC_PRED[Inference & Scoring Service]
        SVC_SEG[Clustering & Segmentation Service]
        SVC_REC[Rule-Based Retention Engine]
        SVC_CAMP[Campaign & ROI Service]
        SVC_REP[Executive Report Generator]
    end

    subgraph ML_Core ["Machine Learning & Research Core (Scikit-Learn, XGBoost, LightGBM, SHAP)"]
        INGEST[Ingestion & Data Quality Validator]
        PREPROC[Leakage-Free Preprocessor (Pipeline)]
        MODELS[6 Benchmark Models + Tuned Hybrid Ensemble]
        XAI_ENGINE[TreeExplainer & LinearExplainer]
        CLUST[K-Means & Value-Risk Profiling]
    end

    subgraph Storage ["Storage & Persistence Tier"]
        DB[(Relational DB: PostgreSQL / SQLite)]
        MODEL_STORE[Serialized Model Store (.joblib)]
        DATA_STORE[Raw & Processed Data (.csv)]
    end

    UI_AUTH --> API_ROUTER
    UI_DASH --> API_ROUTER
    UI_CUSTOMERS --> API_ROUTER
    UI_EDA --> API_ROUTER
    UI_TRAIN --> API_ROUTER
    UI_PREDICT --> API_ROUTER
    UI_XAI --> API_ROUTER
    UI_SEG --> API_ROUTER
    UI_REC --> API_ROUTER
    UI_CAMP --> API_ROUTER
    UI_REV --> API_ROUTER
    UI_REP --> API_ROUTER

    API_ROUTER --> SVC_DATA
    API_ROUTER --> SVC_ML
    API_ROUTER --> SVC_XAI
    API_ROUTER --> SVC_PRED
    API_ROUTER --> SVC_SEG
    API_ROUTER --> SVC_REC
    API_ROUTER --> SVC_CAMP
    API_ROUTER --> SVC_REP

    SVC_DATA --> INGEST
    SVC_ML --> PREPROC
    SVC_ML --> MODELS
    SVC_XAI --> XAI_ENGINE
    SVC_PRED --> MODELS
    SVC_SEG --> CLUST

    SVC_DATA --> DB
    SVC_ML --> MODEL_STORE
    SVC_PRED --> DB
    SVC_CAMP --> DB
    SVC_REC --> DB
    INGEST --> DATA_STORE
```

---

## 2. Relational Database Schema Design

The persistence layer supports both PostgreSQL and SQLite (with automatic fallback for local zero-configuration execution) managed through SQLAlchemy ORM.

### 2.1 Table Specifications

1. **`users`**:
   - `id`: Integer, Primary Key, Autoincrement
   - `username`: String(64), Unique, Indexed
   - `email`: String(128), Unique, Indexed
   - `hashed_password`: String(256)
   - `role`: String(32) (e.g., `'admin'`, `'analyst'`, `'viewer'`)
   - `created_at`: DateTime, Default UTC

2. **`customers`**:
   - `id`: Integer, Primary Key, Autoincrement
   - `customer_id`: String(32), Unique, Indexed (e.g. `'7590-VHVEG'`)
   - `gender`: String(16)
   - `senior_citizen`: Integer (0 or 1)
   - `partner`: String(8) ('Yes'/'No')
   - `dependents`: String(8) ('Yes'/'No')
   - `tenure`: Integer (months)
   - `phone_service`: String(8)
   - `multiple_lines`: String(32)
   - `internet_service`: String(32)
   - `online_security`: String(32)
   - `online_backup`: String(32)
   - `device_protection`: String(32)
   - `tech_support`: String(32)
   - `streaming_tv`: String(32)
   - `streaming_movies`: String(32)
   - `contract`: String(32)
   - `paperless_billing`: String(8)
   - `payment_method`: String(64)
   - `monthly_charges`: Float
   - `total_charges`: Float
   - `actual_churn`: String(8) ('Yes'/'No'/Null)
   - `is_synthetic`: Boolean, Default False
   - `created_at`: DateTime

3. **`dataset_imports`**:
   - `id`: Integer, Primary Key
   - `filename`: String(256)
   - `record_count`: Integer
   - `feature_count`: Integer
   - `missing_values_handled`: Integer
   - `status`: String(32) ('Success', 'Failed')
   - `summary_json`: Text / JSON
   - `imported_at`: DateTime

4. **`model_experiments`**:
   - `id`: Integer, Primary Key
   - `experiment_name`: String(128)
   - `model_type`: String(64) ('LogisticRegression', 'RandomForest', 'GradientBoosting', 'XGBoost', 'LightGBM', 'HybridEnsemble')
   - `hyperparameters_json`: Text / JSON
   - `resampling_strategy`: String(64) ('None', 'SMOTE', 'ClassWeight')
   - `accuracy`: Float
   - `precision`: Float
   - `recall`: Float
   - `f1_score`: Float
   - `roc_auc`: Float
   - `pr_auc`: Float
   - `confusion_matrix_json`: Text / JSON
   - `cv_scores_mean`: Float
   - `cv_scores_std`: Float
   - `is_selected_champion`: Boolean, Default False
   - `selection_rationale`: Text
   - `artifact_path`: String(256)
   - `created_at`: DateTime

5. **`prediction_records`**:
   - `id`: Integer, Primary Key
   - `customer_id`: String(32), Indexed
   - `model_experiment_id`: Integer, Foreign Key -> `model_experiments.id`
   - `churn_probability`: Float (0.0 to 1.0)
   - `predicted_churn`: Boolean
   - `risk_tier`: String(16) ('Low', 'Medium', 'High')
   - `top_risk_factors_json`: Text / JSON
   - `shap_values_json`: Text / JSON
   - `created_at`: DateTime

6. **`customer_segments`**:
   - `id`: Integer, Primary Key
   - `segment_code`: String(32) ('HIGH_RISK_HIGH_VALUE', 'HIGH_RISK_NEW', 'LOYAL_HIGH_VALUE', 'LOW_RISK_STEADY', 'UPSELL_CANDIDATE')
   - `segment_name`: String(128)
   - `customer_count`: Integer
   - `avg_churn_prob`: Float
   - `avg_monthly_charges`: Float
   - `avg_tenure`: Float
   - `total_revenue_at_risk`: Float
   - `strategy_summary`: Text

7. **`retention_recommendations`**:
   - `id`: Integer, Primary Key
   - `customer_id`: String(32), Indexed
   - `risk_tier`: String(16)
   - `identified_factors_json`: Text / JSON
   - `recommended_action`: Text
   - `business_priority`: String(16) ('Urgent', 'High', 'Medium', 'Low')
   - `explanation`: Text
   - `suggested_follow_up_date`: Date
   - `status`: String(32) ('Pending', 'In Progress', 'Actioned', 'Dismissed')
   - `created_at`: DateTime

8. **`campaigns`**:
   - `id`: Integer, Primary Key
   - `campaign_name`: String(128)
   - `target_segment`: String(64)
   - `budget`: Float
   - `offer_details`: Text
   - `status`: String(32) ('Draft', 'Active', 'Completed', 'Paused')
   - `created_at`: DateTime

9. **`campaign_activities`**:
   - `id`: Integer, Primary Key
   - `campaign_id`: Integer, Foreign Key -> `campaigns.id`
   - `customer_id`: String(32), Indexed
   - `outreach_channel`: String(32) ('Email', 'Phone Support', 'In-App Offer', 'Account Manager')
   - `status`: String(32) ('Pending', 'Contacted', 'Offer Sent', 'Retained', 'Churned', 'Closed')
   - `contact_date`: DateTime
   - `outcome_notes`: Text

---

## 3. REST API Contract

Base URL: `/api`

### 3.1 Authentication & System Health
- `POST /api/auth/login`: Authenticate demo/admin credentials; returns JWT token.
- `GET /api/health`: Health status, active database dialect, and ML runtime checks.

### 3.2 Dashboard & Revenue Analytics
- `GET /api/dashboard/summary`: Executive metrics (Total customers, predicted churn rate, estimated revenue at risk, risk breakdown, contract distribution).
- `GET /api/analytics/revenue-risk`: High-risk ARR/MRR exposure grouped by contract, tenure segment, and internet tier.

### 3.3 Customer Data Explorer & Ingestion
- `GET /api/customers`: Paginated, searchable customer records with filtering (tenure, contract, actual/predicted churn, risk tier).
- `GET /api/customers/{customer_id}`: Detailed 360-degree customer profile with historical billing, subscriptions, model risk score, and SHAP breakdown.
- `POST /api/datasets/upload`: Ingest new CSV dataset with data validation, schema checks, and automatic ingestion summary.
- `GET /api/datasets/export`: Export filtered customer and prediction records as CSV.

### 3.4 Exploratory Data Analysis (EDA)
- `GET /api/analytics/eda`: Pre-calculated distributions, churn rates across features, feature associations, numerical box plot stats, and data quality reports.

### 3.5 Model Training & Research Benchmarking
- `POST /api/models/train`: Train 6 benchmark models (Logistic Regression, Decision Tree, Random Forest, SVM, Gradient Boosting, XGBoost/LightGBM) + Tuned Hybrid Ensemble with cross-validation and imbalance handling.
- `GET /api/models/experiments`: List all recorded experiments with metrics (Accuracy, Precision, Recall, F1, ROC-AUC, PR-AUC, confusion matrices).
- `GET /api/models/champion`: Details of the active champion model pipeline and selection rationale.
- `POST /api/models/champion/{experiment_id}`: Promote an experiment as the active production champion.

### 3.6 Predictions & Explainable AI (SHAP)
- `POST /api/predictions/single`: Predict churn probability, risk category, and rule-based recommendation for individual customer inputs.
- `POST /api/predictions/batch`: Batch score uploaded CSV or database records.
- `GET /api/explanations/global`: Global feature importance (mean |SHAP| values) and summary plot dataset.
- `POST /api/explanations/local`: Individual customer SHAP waterfall/force feature contribution analysis.

### 3.7 Customer Segmentation & Retention Strategy
- `GET /api/segments`: K-Means / behavioral clusters summary with metrics and revenue-at-risk.
- `GET /api/retention/recommendations`: Transparent decision-support recommendations mapped to risk tiers.
- `PATCH /api/retention/recommendations/{recommendation_id}`: Update recommendation follow-up status.

### 3.8 Campaign Management
- `GET /api/campaigns`: List active and historical retention campaigns with ROI and conversion stats.
- `POST /api/campaigns`: Create a new retention campaign targeted at specific segments.
- `GET /api/campaigns/{campaign_id}/activities`: Customer outreach tracker.
- `PATCH /api/campaigns/activities/{activity_id}`: Update customer contact outcome (`Contacted`, `Offer Sent`, `Retained`, `Churned`).

### 3.9 Reports & Research Deliverables
- `GET /api/reports/summary`: Full data science synthesis report for PDF/print generation.
- `GET /api/research/paper-data`: Research methodology, hypotheses, statistical significance tests, ablation study results, and IEEE citations.

---

## 4. Machine Learning & Explainable AI Architecture

### 4.1 Data Preprocessing Pipeline (Leakage-Free)
1. Numerical Features: `tenure`, `MonthlyCharges`, `TotalCharges` (coerced from string, median imputed for blank tenure=0 cases), scaled via `StandardScaler`.
2. Categorical Features: Binary encoding for (`Partner`, `Dependents`, `PhoneService`, `PaperlessBilling`), One-Hot Encoding for multi-class variables (`InternetService`, `Contract`, `PaymentMethod`, etc.) with `handle_unknown='ignore'`.
3. Strict Pipeline Encapsulation: All scalers and encoders are fitted **strictly on training splits** using `ColumnTransformer` inside `imblearn.pipeline.Pipeline` or `sklearn.pipeline.Pipeline`.
4. Resampling: Tested with `SMOTE` (Synthetic Minority Over-sampling Technique) on training splits vs. `class_weight='balanced'` to prevent data leakage into validation/test splits.

### 4.2 Benchmark Model Suite
1. **Baseline**: Logistic Regression (L2 regularization, balanced weights)
2. **Decision Tree**: CART with max_depth pruning
3. **Random Forest**: Ensemble of 150 bagged decision trees
4. **Support Vector Machine**: RBF kernel SVM with calibrated probability output
5. **Gradient Boosting**: HistGradientBoosting / GradientBoostingClassifier
6. **XGBoost / LightGBM**: Optimized gradient boosted trees
7. **Proposed Research Hybrid Ensemble**: Soft-voting meta-classifier combining XGBoost, Random Forest, and Calibrated Logistic Regression.

### 4.3 Evaluation & Business Alignment
- Primary metric: **ROC-AUC & Recall on Churn=Yes** (Business goal: Maximize churn detection while maintaining actionable precision to minimize costly retention outreach on false positives).
- Secondary metrics: PR-AUC, F1-Score, Brier Score (probability calibration), and Estimated Saved MRR.

### 4.4 Explainability Integration (SHAP)
- `shap.TreeExplainer` for XGBoost / Random Forest models.
- Fast exact calculation of feature Shapley values.
- Global feature rankings and local force/waterfall values converted to readable percentage contributions for the UI.

---

## 5. Incremental Implementation Phases

- **Phase 1**: Requirements Analysis & System Architecture Scaffolding *(Completed)*
- **Phase 2**: Dataset Acquisition, Exploration & Preprocessing Pipeline
- **Phase 3**: Baseline Model Suite Development, Training & Cross-Validation
- **Phase 4**: Proposed Model, SHAP Explainability & Segmentation Engine
- **Phase 5**: FastAPI Backend, Relational Database Models & REST Endpoints
- **Phase 6**: React + Vite + TailwindCSS Frontend & Interactive Dashboard
- **Phase 7**: Retention Recommendation Engine & Campaign Management
- **Phase 8**: Automated Testing (Pytest + API Integration Tests)
- **Phase 9**: Docker Setup, Environment Config & Deployment Documentation
- **Phase 10**: IEEE Research Paper Package & Academic Presentation Deliverables
