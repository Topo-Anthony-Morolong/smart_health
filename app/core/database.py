from supabase import create_client, Client
from app.core.config import settings
from loguru import logger

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