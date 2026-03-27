from functools import lru_cache

from pydantic import AliasChoices, Field, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_dsn: PostgresDsn = Field(validation_alias=AliasChoices("DATABASE_DSN", "POSTGRES_URL"))
    secret_key: str
    access_token_hashing_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debug: bool = False
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    frontend_url: str = "http://localhost:5173"

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
