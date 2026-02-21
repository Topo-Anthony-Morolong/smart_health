from pydantic_settings import BaseSettings
class Settings(BaseSettings):
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    APP_NAME: str = "Smart Health – Chronic Care Platform"
    DEBUG: bool = True

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()