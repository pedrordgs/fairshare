from fastapi import Depends
from typing import Annotated
from collections.abc import Generator

from sqlmodel import Session, create_engine

from core.conf import settings

engine = create_engine(str(settings.database_dsn), echo=settings.debug)


def get_database_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


DbSession = Annotated[Session, Depends(get_database_session)]
