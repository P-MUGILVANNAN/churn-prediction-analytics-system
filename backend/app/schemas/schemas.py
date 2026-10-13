"""
Pydantic Schemas for API Requests, Responses, and Payload Validation.
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class CustomerInputSchema(BaseModel):
    customerID: Optional[str] = "NEW-CUST"
    gender: str = "Male"
    SeniorCitizen: int = 0
    Partner: str = "No"
    Dependents: str = "No"
    tenure: int = 12
    PhoneService: str = "Yes"
    MultipleLines: str = "No"
    InternetService: str = "Fiber optic"
    OnlineSecurity: str = "No"
    OnlineBackup: str = "No"
    DeviceProtection: str = "No"
    TechSupport: str = "No"
    StreamingTV: str = "No"
    StreamingMovies: str = "No"
    Contract: str = "Month-to-month"
    PaperlessBilling: str = "Yes"
    PaymentMethod: str = "Electronic check"
    MonthlyCharges: float = 75.0
    TotalCharges: Optional[float] = None


class CustomerItemResponse(BaseModel):
    id: int
    customer_id: str
    gender: Optional[str]
    senior_citizen: Optional[int]
    partner: Optional[str]
    dependents: Optional[str]
    tenure: int
    contract: str
    internet_service: str
    payment_method: str
    monthly_charges: float
    total_charges: float
    actual_churn: Optional[str]
    predicted_churn_prob: Optional[float]
    risk_tier: Optional[str]
    segment_code: Optional[str]


class PaginatedCustomersResponse(BaseModel):
    items: List[CustomerItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class DashboardSummaryResponse(BaseModel):
    total_customers: int
    predicted_churners: int
    churn_rate: float
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    estimated_revenue_at_risk: float
    total_mrr: float
    mrr_risk_percentage: float
    contract_distribution: List[Dict[str, Any]]
    tenure_distribution: List[Dict[str, Any]]
    monthly_charges_bands: List[Dict[str, Any]]
    churn_by_internet: List[Dict[str, Any]]


class SinglePredictionResponse(BaseModel):
    customer_id: str
    churn_probability: float
    predicted_churn: bool
    risk_tier: str
    monthly_charges: float
    monthly_revenue_at_risk: float
    model_version: str
    prediction_timestamp: str
    explanation: Dict[str, Any]
    retention: Dict[str, Any]


class CampaignCreate(BaseModel):
    campaign_name: str
    target_segment: str
    budget: float = 1000.0
    offer_details: str
    channel: str = "Email & Phone Outreach"


class CampaignResponse(BaseModel):
    id: int
    campaign_name: str
    target_segment: str
    budget: float
    offer_details: Optional[str]
    channel: str
    status: str
    activity_count: int = 0
    retained_count: int = 0
    churned_count: int = 0
    created_at: str


class RecommendationUpdate(BaseModel):
    status: str
