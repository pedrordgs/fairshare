# Import all models to register them with SQLModel.metadata
# Alembic uses this to detect tables for migrations
from auth.models import User  # noqa: F401
from expenses.models import Expense  # noqa: F401
from groups.models import ExpenseGroup, ExpenseGroupMember  # noqa: F401
