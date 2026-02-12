from collections.abc import Generator
from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine
from sqlalchemy.engine import Engine

from core.conf import get_settings


@lru_cache
def get_engine() -> Engine:
    settings = get_settings()
    return create_engine(str(settings.database_dsn), echo=settings.debug)


def get_database_session() -> Generator[Session, None, None]:
    with Session(get_engine()) as session:
        yield session


DbSession = Annotated[Session, Depends(get_database_session)]
