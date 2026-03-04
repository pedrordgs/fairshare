"""Add is_admin to expensegroupmember

Revision ID: a3f9e1b2c4d5
Revises: 51f0c9b8d4c2
Create Date: 2026-03-04 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "a3f9e1b2c4d5"
down_revision: Union[str, Sequence[str], None] = "51f0c9b8d4c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("expensegroupmember", sa.Column("is_admin", sa.Boolean(), nullable=True))
    op.execute("UPDATE expensegroupmember SET is_admin = FALSE")
    op.execute(
        """
        UPDATE expensegroupmember
        SET is_admin = TRUE
        WHERE user_id IN (
            SELECT eg.created_by
            FROM expensegroup eg
            WHERE eg.id = expensegroupmember.group_id
        )
        """
    )
    op.alter_column("expensegroupmember", "is_admin", nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("expensegroupmember", "is_admin")
