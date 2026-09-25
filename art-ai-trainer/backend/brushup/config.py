"""Environment configuration and paths anchored to the backend directory."""
import os
from pathlib import Path
from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "brushup-local-development-only")
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///test.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = str(BACKEND_DIR / "static" / "uploads")
    SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "false").lower() == "true"
    SESSION_COOKIE_HTTPONLY = True
    CORS_ORIGINS = [origin.strip() for origin in os.getenv(
        "CORS_ORIGINS", "http://localhost:3000,https://localhost:3000"
    ).split(",")]
    DIFFUSION_MODEL_ID = os.getenv("DIFFUSION_MODEL_ID", "runwayml/stable-diffusion-v1-5")
