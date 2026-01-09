from pydantic import PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_dsn: PostgresDsn
    secret_key: str
    access_token_hashing_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debug: bool = False


settings = Settings()
