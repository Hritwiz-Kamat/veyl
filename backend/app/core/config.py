"""
Application configuration loaded from environment variables / .env file.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


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


settings = Settings()

