from typing import List, Optional
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import secrets
import logging

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    PROJECT_NAME: str = "DentalFlow Social Booker"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"  # development | staging | production

    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/dentalflow"

    # Database pool settings
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30

    # Auth
    SECRET_KEY: str = "yoursecretkeyhere"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # CORS — comma-separated allowed origins in production
    ALLOWED_ORIGINS: str = "*"

    # Email
    SMTP_SERVER: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    CLINIC_EMAIL: str = "notifications@dentist.com"

    # AI — Gemini (free) or OpenAI (paid)
    GEMINI_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None  # Fallback if Gemini not set

    # Meta Platform — Facebook + Instagram
    META_VERIFY_TOKEN: Optional[str] = None
    META_APP_SECRET: Optional[str] = None
    META_PAGE_ACCESS_TOKEN: Optional[str] = None
    META_APP_ID: Optional[str] = None

    # WhatsApp Cloud API
    WHATSAPP_PHONE_NUMBER_ID: Optional[str] = None
    WHATSAPP_ACCESS_TOKEN: Optional[str] = None

    # Sentry
    SENTRY_DSN: Optional[str] = None

    # Simulator
    SIMULATOR_ENABLED: bool = True  # Disable in production

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=".env",
        extra="ignore",
    )

    @field_validator("SECRET_KEY")
    @classmethod
    def secret_key_must_be_strong(cls, v: str) -> str:
        if v in ("yoursecretkeyhere", "changeme", "secret", ""):
            logger.warning(
                "SECRET_KEY is using an insecure default. "
                "Set a strong random value in production via the SECRET_KEY environment variable."
            )
        return v

    @model_validator(mode="after")
    def warn_production_gaps(self) -> "Settings":
        if self.ENVIRONMENT == "production":
            if not self.GEMINI_API_KEY and not self.OPENAI_API_KEY:
                logger.warning("No AI API key set — agent will use rule-based fallback.")
            if not self.SENTRY_DSN:
                logger.warning("SENTRY_DSN is not set — error tracking disabled.")
            if not self.META_PAGE_ACCESS_TOKEN:
                logger.warning("META_PAGE_ACCESS_TOKEN not set — cannot reply to social messages.")
        return self

    @property
    def allowed_origins_list(self) -> List[str]:
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
