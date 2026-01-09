# Import all models to register them with SQLModel.metadata
# Alembic uses this to detect tables for migrations
from auth.models import User  # noqa: F401
