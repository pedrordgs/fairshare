"""Replace on_behalf_of_user_id with creditor_id on expense table.

Revision ID: c7d8e9f0a1b2
Revises: b5c2d3e4f5a6
Create Date: 2026-03-11 00:00:00.000000

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "c7d8e9f0a1b2"
down_revision: Union[str, Sequence[str], None] = "b5c2d3e4f5a6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add creditor_id as nullable first so we can backfill
    op.add_column("expense", sa.Column("creditor_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_expense_creditor_id_user", "expense", "user", ["creditor_id"], ["id"])

    # Backfill: creditor is the person who created the expense
    op.execute("UPDATE expense SET creditor_id = created_by")

    # Make creditor_id NOT NULL now that all rows are populated
    op.alter_column("expense", "creditor_id", nullable=False)

    # Drop the old column
    op.drop_column("expense", "on_behalf_of_user_id")


def downgrade() -> None:
    op.add_column("expense", sa.Column("on_behalf_of_user_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_expense_on_behalf_of_user_id_user", "expense", "user", ["on_behalf_of_user_id"], ["id"])
    op.drop_constraint("fk_expense_creditor_id_user", "expense", type_="foreignkey")
    op.drop_column("expense", "creditor_id")
