from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Supabase connection pooler (pgBouncer) requires NullPool or specific settings.
# For Render free tier + Supabase free tier, keep connections minimal.
engine_kwargs = {
    "pool_pre_ping": True,  # Detect broken connections (important for Render cold starts)
}

# Use connection pooling locally, but NullPool for serverless/free-tier deployments
if settings.ENVIRONMENT == "production":
    # Production: smaller pool for free-tier hosts
    engine_kwargs["pool_size"] = 3
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["pool_timeout"] = 10
    engine_kwargs["pool_recycle"] = 300  # Recycle connections every 5 min (Supabase compatibility)
else:
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT

engine = create_engine(settings.DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)