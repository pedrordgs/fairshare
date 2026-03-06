"""Add on_behalf_of_user_id to expense

Revision ID: b5c2d3e4f5a6
Revises: a3f9e1b2c4d5
Create Date: 2026-03-04 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b5c2d3e4f5a6"
down_revision: Union[str, Sequence[str], None] = "a3f9e1b2c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("expense", sa.Column("on_behalf_of_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_expense_on_behalf_of_user_id", "expense", "user", ["on_behalf_of_user_id"], ["id"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("fk_expense_on_behalf_of_user_id", "expense", type_="foreignkey")
    op.drop_column("expense", "on_behalf_of_user_id")
