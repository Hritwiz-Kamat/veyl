"""
Application configuration loaded from environment variables / .env file.
"""
import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Base directory for the repository
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_VERSION: str = "0.1.0"

    # CORS — restrict to the Vite dev-server origin
    CORS_ORIGIN: str = "http://localhost:5173"

    # Backend bind address
    BACKEND_HOST: str = "0.0.0.0"
    BACKEND_PORT: int = 8000

    # In-memory session TTL (seconds)
    SESSION_TTL_SECONDS: int = 900

    # Storage paths for uploads and sanitized artifacts
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", str(BASE_DIR / "runtime_data" / "uploads"))
    SANITIZED_DIR: str = os.getenv("SANITIZED_DIR", str(BASE_DIR / "runtime_data" / "sanitized"))

    # File limits (10MB max upload)
    MAX_UPLOAD_BYTES: int = 10 * 1024 * 1024


settings = Settings()
