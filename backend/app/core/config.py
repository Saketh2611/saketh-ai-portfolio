"""
Centralized app configuration.

Everything reads from here — no module should call os.getenv() directly.
Pydantic-settings validates on import, so a missing required var fails at
startup with a clear error instead of a confusing runtime KeyError three
requests into a demo.
"""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # --- Database ---
    database_url: str = Field(..., description="Supabase Postgres connection string")

    # --- Supabase Storage ---
    supabase_url: str
    supabase_service_role_key: str
    supabase_storage_bucket: str = "portfolio-assets"

    # --- Groq ---
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    
    # --- Cohere ---
    cohere_api_key: str

    # --- Auth ---
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    admin_password: str

    # --- CORS ---
    cors_origins: str = "http://localhost:3000"

    # --- Embedding ---
    embedding_model: str = "BAAI/bge-m3"
    embedding_dim: int = 1024

    # --- Rate limiting ---
    chat_rate_limit_per_minute: int = 5

    # --- App ---
    environment: str = "development"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"


@lru_cache
def get_settings() -> Settings:
    """
    Cached settings singleton. lru_cache means the .env file is only
    read once per process, not on every request.
    """
    return Settings()
