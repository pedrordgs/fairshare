"""Add expense_group_join_request table

Revision ID: 51f0c9b8d4c2
Revises: 2f2b9b2a3f3b
Create Date: 2026-02-13 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "51f0c9b8d4c2"
down_revision: Union[str, Sequence[str], None] = "2f2b9b2a3f3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "expensegroupjoinrequest",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolved_by", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["group_id"], ["expensegroup.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["resolved_by"], ["user.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_expensegroupjoinrequest_group_id", "expensegroupjoinrequest", ["group_id"])
    op.create_index("ix_expensegroupjoinrequest_user_id", "expensegroupjoinrequest", ["user_id"])
    op.create_index("ix_expensegroupjoinrequest_status", "expensegroupjoinrequest", ["status"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_expensegroupjoinrequest_status", table_name="expensegroupjoinrequest")
    op.drop_index("ix_expensegroupjoinrequest_user_id", table_name="expensegroupjoinrequest")
    op.drop_index("ix_expensegroupjoinrequest_group_id", table_name="expensegroupjoinrequest")
    op.drop_table("expensegroupjoinrequest")
