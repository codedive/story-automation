"""Application settings loaded from environment variables / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    AI_PROVIDER: str = "openai"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"
    DATABASE_URL: str = "sqlite:///./story_factory.db"
    DUPLICATE_THRESHOLD: float = 72.0
    MAX_REGENERATION_ATTEMPTS: int = 3
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"
    GOOGLE_CLIENT_ID: str = ""
    ALLOWED_GOOGLE_EMAIL: str = ""
    JWT_SECRET_KEY: str = ""
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
