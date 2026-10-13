# Customer Churn Prediction and Retention Analytics System Using Explainable Machine Learning

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/downloads/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.138-009688.svg)](https://fastapi.tiangolo.com/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC.svg)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An enterprise-grade, end-to-end Data Science and Machine Learning web application designed for final-year university capstones, IEEE research publications, and corporate churn retention operations.

---

## 🌟 System Architecture & Capabilities

```mermaid
graph TB
    subgraph Frontend ["Frontend (React + Vite + TailwindCSS + Recharts)"]
        UI_DASH[Executive Dashboard]
        UI_CUST[Customer 360 Explorer & CSV Upload]
        UI_EDA[Exploratory Analytics & Provenance]
        UI_BENCH[Model Benchmarking (7 Models)]
        UI_PRED[Real-Time & Batch Churn Scorer]
        UI_XAI[Explainable AI (SHAP Waterfall)]
        UI_SEG[Customer Segmentation (5 Cohorts)]
        UI_REC[Prescriptive Retention Engine]
        UI_CAMP[Campaign Tracker & Saved MRR ROI]
        UI_REV[Revenue-at-Risk Financials]
        UI_REP[Printable Briefing & IEEE Paper]
    end

    subgraph Backend ["Backend API Tier (FastAPI + Pydantic v2)"]
        ROUTER[FastAPI REST Endpoints]
        SVC_DATA[Data Pipeline Service]
        SVC_ML[Training & 5-Fold CV Service]
        SVC_XAI[SHAP TreeExplainer Engine]
        SVC_PRED[Inference & Scoring Service]
        SVC_SEG[K-Means Clustering Engine]
    end

    subgraph Storage ["Persistence Tier"]
        DB[(PostgreSQL / SQLite)]
        MODEL_STORE[Serialized Model Store (.joblib)]
        DATA_STORE[Raw & Cleaned Datasets (.csv)]
    end

    Frontend --> ROUTER
    ROUTER --> SVC_DATA
    ROUTER --> SVC_ML
    ROUTER --> SVC_XAI
    ROUTER --> SVC_PRED
    ROUTER --> SVC_SEG
    SVC_DATA --> DB
    SVC_ML --> MODEL_STORE
    SVC_DATA --> DATA_STORE
```

---

## 🔬 Empirical Model Benchmark Results

Evaluated on the authentic held-out test partition ($N = 1,409$ accounts) under leakage-free stratified 5-fold cross-validation:

| Model Architecture | ROC-AUC | PR-AUC | Recall | Precision | F1-Score | Accuracy | 5-Fold CV ROC |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Logistic Regression | 0.8421 | 0.6508 | 0.5615 | 0.6583 | 0.6061 | 0.8062 | $0.8447 \pm 0.012$ |
| Decision Tree (CART) | 0.8276 | 0.6094 | 0.5668 | 0.6347 | 0.5989 | 0.7984 | $0.8265 \pm 0.015$ |
| Random Forest (120 Trees) | 0.8439 | 0.6517 | 0.5000 | 0.6505 | 0.5658 | 0.7963 | $0.8471 \pm 0.010$ |
| Support Vector Machine (RBF) | 0.7928 | 0.5756 | 0.4492 | 0.6614 | 0.5350 | 0.7928 | $0.8012 \pm 0.014$ |
| Gradient Boosting (GBDT) | 0.8444 | 0.6534 | 0.5241 | 0.6735 | 0.5895 | 0.8062 | $0.8488 \pm 0.011$ |
| XGBoost (Tuned) | 0.8447 | 0.6542 | 0.5321 | 0.6698 | 0.5931 | 0.8062 | $0.8492 \pm 0.009$ |
| **Proposed Soft-Voting Hybrid** | **0.8467** | **0.6558** | **0.5348** | **0.6579** | **0.5900** | **0.8027** | **$0.8512 \pm 0.008$** |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Python 3.10+
- Node.js v18+ and npm
- (Optional) Docker & Docker Compose

### 2. Backend Setup
```bash
# 1. Install Python dependencies
pip install -r backend/requirements.txt

# 2. Ingest raw dataset & run benchmark training
python backend/ml/data/ingestion.py
python backend/ml/training/trainer.py
python backend/ml/segmentation/segmenter.py

# 3. Apply MySQL migrations
alembic upgrade head

# 4. Start the FastAPI server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`
Database: **MySQL (churn_db on port 3306)**

### 3. Frontend Setup
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Launch Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

### 4. Running Automated Tests
```bash
python -m pytest backend/tests/test_all_modules.py -v
```

---

## 🐳 Docker Deployment
To launch the complete multi-tier stack (PostgreSQL + FastAPI + React Nginx):
```bash
docker-compose up --build
```
- Frontend Web App: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`

---

## 🔑 Authentication
- **Default Analyst Account**: `analyst@telecom.ai`
- **Default Password**: `churn2026`
*(A 1-click demo button is built directly into the login screen).*

---

## 📁 Repository Structure
```
Customer_Churn_Analytics/
├── backend/
│   ├── app/
│   │   ├── api/             # REST Endpoints (Auth, Dashboard, Customers, Models, XAI...)
│   │   ├── core/            # App Configuration & Security
│   │   ├── db/              # SQLAlchemy Database Engine & Sessions
│   │   ├── models/          # Relational ORM Entities
│   │   ├── schemas/         # Pydantic v2 Request/Response Models
│   │   └── services/        # Business Logic & Orchestration
│   ├── ml/
│   │   ├── data/            # Ingestion, Validation & Provenance
│   │   ├── preprocessing/   # Leakage-Free ColumnTransformer
│   │   ├── training/        # 7-Model Benchmark Suite & CV Trainer
│   │   ├── evaluation/      # Classification Metrics, ROC, PR Curves
│   │   ├── explainability/  # SHAP TreeExplainer & Local Waterfall
│   │   ├── prediction/      # Real-time Inference & Prescriptive Rules
│   │   └── segmentation/    # K-Means 5-Cohort Risk-Value Clustering
│   ├── tests/               # Pytest Automated Test Suite
│   └── requirements.txt     # Python Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable Sidebar, Navbar, Badges, Cards
│   │   ├── pages/           # 11 Modular Pages (Dashboard, EDA, XAI, Models...)
│   │   ├── services/        # API Client
│   │   └── App.jsx          # React Router & State Wrapper
│   ├── vite.config.js
│   └── package.json
├── data/
│   ├── raw/                 # IBM Telco Customer Churn Raw CSV
│   └── processed/           # Cleaned, Validated CSV
├── models/                  # Serialized .joblib Pipelines & Caches
├── research/
│   └── IEEE_RESEARCH_PAPER_PACKAGE.md # Full Manuscript Package
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .env.example
└── README.md
```

---

## 📄 Academic Deliverables
The complete research documentation package formatted for IEEE conferences or journals is located in:
👉 [`research/IEEE_RESEARCH_PAPER_PACKAGE.md`](file:///d:/PROJECTS/Customer_Churn_Analytics/research/IEEE_RESEARCH_PAPER_PACKAGE.md)
It includes: Abstract, Mathematical Formulations, Literature Review, Empirical Tables, Ablation Analysis, and Verified IEEE References.
