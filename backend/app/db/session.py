from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Clean the DATABASE_URL (strip whitespace/newlines that env var editors may add)
db_url = settings.DATABASE_URL.strip()

# Supabase requires SSL from external hosts
connect_args = {}
if "supabase" in db_url:
    connect_args["sslmode"] = "require"

engine_kwargs = {
    "pool_pre_ping": True,  # Detect broken connections (important for Render cold starts)
    "connect_args": connect_args,
}

# Use connection pooling locally, but smaller pool for free-tier deployments
if settings.ENVIRONMENT == "production":
    engine_kwargs["pool_size"] = 3
    engine_kwargs["max_overflow"] = 5
    engine_kwargs["pool_timeout"] = 10
    engine_kwargs["pool_recycle"] = 300
else:
    engine_kwargs["pool_size"] = settings.DB_POOL_SIZE
    engine_kwargs["max_overflow"] = settings.DB_MAX_OVERFLOW
    engine_kwargs["pool_timeout"] = settings.DB_POOL_TIMEOUT

engine = create_engine(db_url, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)