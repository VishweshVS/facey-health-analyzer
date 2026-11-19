import os
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

load_dotenv()


def _default_allowed_origins() -> list[str]:
    origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
    frontend_url = os.getenv("FRONTEND_URL", "")
    for raw_origin in frontend_url.split(","):
        cleaned = raw_origin.strip().rstrip("/")
        if cleaned and cleaned not in origins:
            origins.append(cleaned)
    return origins


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI Vision Health & Feature Analyzer"
    API_V1_STR: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    ALLOWED_ORIGINS: list[str] = Field(default_factory=_default_allowed_origins)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()