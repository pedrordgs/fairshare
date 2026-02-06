from sqlmodel import SQLModel


class PaginatedResponse[T](SQLModel):
    items: list[T]
    total: int
    offset: int
    limit: int
