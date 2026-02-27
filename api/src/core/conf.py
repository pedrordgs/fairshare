from functools import lru_cache

from pydantic import PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_dsn: PostgresDsn
    secret_key: str
    access_token_hashing_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debug: bool = False
    frontend_url: str = "http://localhost:5173"


@lru_cache
def get_settings() -> Settings:
    return Settings()
