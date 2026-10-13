"""
Main FastAPI Application Entrypoint.
Initializes database tables, triggers automatic initial seeding,
configures CORS middleware, and registers all modular API routers.
"""
import os
import sys

# Ensure root path is accessible
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.app.core.config import settings
from backend.app.db.database import engine, Base, SessionLocal
from backend.app.services.data_service import seed_database_if_empty

# Import Routers
from backend.app.api.auth import router as auth_router
from backend.app.api.dashboard import router as dashboard_router
from backend.app.api.customers import router as customers_router
from backend.app.api.analytics import router as analytics_router
from backend.app.api.models import router as models_router
from backend.app.api.predictions import router as predictions_router
from backend.app.api.explanations import router as explanations_router
from backend.app.api.segments import router as segments_router
from backend.app.api.retention import router as retention_router
from backend.app.api.campaigns import router as campaigns_router
from backend.app.api.reports import router as reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    Base.metadata.create_all(bind=engine)
    # Automatically seed database from clean processed data if empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Explainable Machine Learning System for Customer Churn Prediction & Retention Analytics",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(customers_router, prefix=settings.API_V1_STR)
app.include_router(analytics_router, prefix=settings.API_V1_STR)
app.include_router(models_router, prefix=settings.API_V1_STR)
app.include_router(predictions_router, prefix=settings.API_V1_STR)
app.include_router(explanations_router, prefix=settings.API_V1_STR)
app.include_router(segments_router, prefix=settings.API_V1_STR)
app.include_router(retention_router, prefix=settings.API_V1_STR)
app.include_router(campaigns_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "database": engine.name,
        "api_version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
