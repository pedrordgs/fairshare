from collections.abc import Generator

from sqlmodel import Session

from db.dependencies import get_database_session


class TestGetDatabaseSession:
    def test_yields_generator(self) -> None:
        result = get_database_session()
        assert isinstance(result, Generator)

    def test_yields_valid_session(self) -> None:
        session_generator = get_database_session()
        session = next(session_generator)
        assert isinstance(session, Session)
        try:
            next(session_generator)
        except StopIteration:
            pass
