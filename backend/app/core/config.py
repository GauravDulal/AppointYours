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

    # AI
    OPENAI_API_KEY: Optional[str] = None

    # Meta Webhooks
    META_VERIFY_TOKEN: Optional[str] = None
    META_APP_SECRET: Optional[str] = None

    # Sentry
    SENTRY_DSN: Optional[str] = None

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
            if not self.OPENAI_API_KEY:
                logger.warning("OPENAI_API_KEY is not set — AI agent will use rule-based fallback.")
            if not self.SENTRY_DSN:
                logger.warning("SENTRY_DSN is not set — error tracking disabled.")
        return self

    @property
    def allowed_origins_list(self) -> List[str]:
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
