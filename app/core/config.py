from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    DATABASE_URL: str = ""  # postgresql://postgres.[ref]:[pw]@aws-0-region.pooler.supabase.com:5432/postgres
    APP_NAME: str = "Smart Health – Chronic Care Platform"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()