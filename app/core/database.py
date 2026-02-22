from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from supabase import create_client, Client
from app.core.config import settings
from loguru import logger
from typing import Generator

# ---------------------------------------------------------------------------
# Supabase client  (for auth, storage, realtime, edge-functions, etc.)
# ---------------------------------------------------------------------------
_supabase: Client | None = None


def get_supabase() -> Client:
    """Return the shared Supabase client, or raise if not configured."""
    global _supabase
    if _supabase is None:
        if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
            raise RuntimeError(
                "Supabase credentials not set. "
                "Add SUPABASE_URL and SUPABASE_ANON_KEY to your .env file."
            )
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        logger.info("Supabase client initialised.")
    return _supabase


# ---------------------------------------------------------------------------
# SQLAlchemy engine & session  (for ORM queries via Alembic migrations)
# ---------------------------------------------------------------------------
_engine = None
_SessionLocal = None


def _init_engine():
    """Lazily create the SQLAlchemy engine so we don't crash when DATABASE_URL is empty."""
    global _engine, _SessionLocal
    if _engine is None:
        if not settings.DATABASE_URL:
            raise RuntimeError(
                "DATABASE_URL not set. "
                "Add it to your .env file (Supabase → Settings → Database → URI)."
            )
        _engine = create_engine(
            settings.DATABASE_URL,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
        logger.info("SQLAlchemy engine initialised.")


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency — yields a SQLAlchemy session, then closes it."""
    _init_engine()
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_engine():
    """Return the raw engine (used by Alembic env.py)."""
    _init_engine()
    return _engine