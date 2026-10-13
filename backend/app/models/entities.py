"""
SQLAlchemy ORM Database Models for Customer Churn Analytics System.
"""
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime,
    ForeignKey, Text
)
from sqlalchemy.orm import relationship
from backend.app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(256), nullable=False)
    role = Column(String(32), default="analyst")
    created_at = Column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(32), unique=True, index=True, nullable=False)
    gender = Column(String(16))
    senior_citizen = Column(Integer, default=0)
    partner = Column(String(8), default="No")
    dependents = Column(String(8), default="No")
    tenure = Column(Integer, default=0)
    phone_service = Column(String(8), default="Yes")
    multiple_lines = Column(String(32), default="No")
    internet_service = Column(String(32), default="Fiber optic")
    online_security = Column(String(32), default="No")
    online_backup = Column(String(32), default="No")
    device_protection = Column(String(32), default="No")
    tech_support = Column(String(32), default="No")
    streaming_tv = Column(String(32), default="No")
    streaming_movies = Column(String(32), default="No")
    contract = Column(String(32), default="Month-to-month")
    paperless_billing = Column(String(8), default="Yes")
    payment_method = Column(String(64), default="Electronic check")
    monthly_charges = Column(Float, default=0.0)
    total_charges = Column(Float, default=0.0)
    actual_churn = Column(String(8), default="No")  # 'Yes', 'No', or None
    
    # Inferred prediction fields
    predicted_churn_prob = Column(Float, nullable=True)
    risk_tier = Column(String(16), default="Low")  # 'Low', 'Medium', 'High'
    segment_code = Column(String(32), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)


class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(256), nullable=False)
    record_count = Column(Integer, default=0)
    feature_count = Column(Integer, default=0)
    missing_values_handled = Column(Integer, default=0)
    status = Column(String(32), default="Success")
    summary_json = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=datetime.utcnow)


class ModelExperiment(Base):
    __tablename__ = "model_experiments"

    id = Column(Integer, primary_key=True, index=True)
    experiment_name = Column(String(128), nullable=False)
    model_type = Column(String(64), nullable=False)
    hyperparameters_json = Column(Text, nullable=True)
    resampling_strategy = Column(String(64), default="None")
    accuracy = Column(Float, default=0.0)
    precision = Column(Float, default=0.0)
    recall = Column(Float, default=0.0)
    f1_score = Column(Float, default=0.0)
    roc_auc = Column(Float, default=0.0)
    pr_auc = Column(Float, default=0.0)
    confusion_matrix_json = Column(Text, nullable=True)
    cv_scores_mean = Column(Float, default=0.0)
    cv_scores_std = Column(Float, default=0.0)
    is_selected_champion = Column(Boolean, default=False)
    selection_rationale = Column(Text, nullable=True)
    artifact_path = Column(String(256), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(32), index=True, nullable=False)
    model_version = Column(String(64), default="Proposed_HybridEnsemble")
    churn_probability = Column(Float, nullable=False)
    predicted_churn = Column(Boolean, default=False)
    risk_tier = Column(String(16), default="Low")
    top_factors_json = Column(Text, nullable=True)
    recommendation_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CustomerSegment(Base):
    __tablename__ = "customer_segments"

    id = Column(Integer, primary_key=True, index=True)
    cluster_id = Column(Integer, default=0)
    segment_code = Column(String(32), index=True, nullable=False)
    segment_name = Column(String(128), nullable=False)
    customer_count = Column(Integer, default=0)
    avg_churn_prob = Column(Float, default=0.0)
    avg_monthly_charges = Column(Float, default=0.0)
    avg_tenure = Column(Float, default=0.0)
    revenue_at_risk_monthly = Column(Float, default=0.0)
    recommended_action = Column(Text, nullable=True)
    business_priority = Column(String(32), default="Medium")
    color = Column(String(16), default="#3B82F6")


class RetentionRecommendation(Base):
    __tablename__ = "retention_recommendations"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(32), index=True, nullable=False)
    risk_tier = Column(String(16), default="Medium")
    priority = Column(String(16), default="Medium")
    primary_recommendation = Column(Text, nullable=False)
    rationale = Column(Text, nullable=True)
    suggested_follow_up_date = Column(String(32), nullable=True)
    status = Column(String(32), default="Pending")  # 'Pending', 'In Progress', 'Actioned', 'Dismissed'
    created_at = Column(DateTime, default=datetime.utcnow)


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    campaign_name = Column(String(128), nullable=False)
    target_segment = Column(String(64), nullable=False)
    budget = Column(Float, default=1000.0)
    offer_details = Column(Text, nullable=True)
    channel = Column(String(32), default="Email & Phone Outreach")
    status = Column(String(32), default="Active")  # 'Draft', 'Active', 'Completed', 'Paused'
    created_at = Column(DateTime, default=datetime.utcnow)

    activities = relationship("CampaignActivity", back_populates="campaign", cascade="all, delete-orphan")


class CampaignActivity(Base):
    __tablename__ = "campaign_activities"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    customer_id = Column(String(32), index=True, nullable=False)
    outreach_channel = Column(String(32), default="Email")
    status = Column(String(32), default="Pending")  # 'Pending', 'Contacted', 'Offer Sent', 'Retained', 'Churned', 'Closed'
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow)

    campaign = relationship("Campaign", back_populates="activities")
