"""Add invite_code to expense_group

Revision ID: 9a4c7f2f0a3d
Revises: 36f78f4adf92
Create Date: 2026-02-10 00:00:00.000000

"""

from typing import Sequence, Union

import secrets

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9a4c7f2f0a3d"
down_revision: Union[str, Sequence[str], None] = "36f78f4adf92"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("expensegroup", sa.Column("invite_code", sa.String(), nullable=True))

    connection = op.get_bind()
    expense_groups = connection.execute(sa.text("SELECT id FROM expensegroup")).fetchall()
    existing_codes: set[str] = set()
    alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
    code_length = 10

    for (group_id,) in expense_groups:
        while True:
            code = "".join(secrets.choice(alphabet) for _ in range(code_length))
            if code not in existing_codes:
                existing_codes.add(code)
                break
        connection.execute(
            sa.text("UPDATE expensegroup SET invite_code = :code WHERE id = :id"), {"code": code, "id": group_id}
        )

    op.alter_column("expensegroup", "invite_code", nullable=False)
    op.create_unique_constraint("uq_expensegroup_invite_code", "expensegroup", ["invite_code"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("uq_expensegroup_invite_code", "expensegroup", type_="unique")
    op.drop_column("expensegroup", "invite_code")
