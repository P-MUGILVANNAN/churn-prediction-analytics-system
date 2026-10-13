"""
Application Configuration and Environment Settings.
Supports MySQL as the primary database with configurable environment overrides.
All sensitive values are securely read from the environment or .env file.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import BaseModel

# Load .env file from project root
ROOT_DIR = Path(__file__).resolve().parent.parent.parent.parent
env_path = ROOT_DIR / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseModel):
    PROJECT_NAME: str = "Customer Churn Prediction and Retention Analytics System"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-academic-research-key-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    # MySQL Database Configuration
    MYSQL_USER: str = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD: str = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_HOST: str = os.getenv("MYSQL_HOST", "127.0.0.1")
    MYSQL_PORT: int = int(os.getenv("MYSQL_PORT", "3306"))
    MYSQL_DB: str = os.getenv("MYSQL_DB", "churn_db")

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
    )

    # Demo Authentication Defaults
    DEMO_USER: str = os.getenv("DEMO_USER", "analyst@telecom.ai")
    DEMO_PASS: str = os.getenv("DEMO_PASS", "churn2026")

    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]


settings = Settings()
