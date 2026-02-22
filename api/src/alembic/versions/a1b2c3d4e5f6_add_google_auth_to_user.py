"""Add google_id to user table and make hashed_password nullable

Revision ID: a1b2c3d4e5f6
Revises: 51f0c9b8d4c2
Create Date: 2026-02-22 00:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "51f0c9b8d4c2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("user", "hashed_password", existing_type=sqlmodel.sql.sqltypes.AutoString(), nullable=True)
    op.add_column("user", sa.Column("google_id", sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.create_unique_constraint("uq_user_google_id", "user", ["google_id"])


def downgrade() -> None:
    op.drop_constraint("uq_user_google_id", "user", type_="unique")
    op.drop_column("user", "google_id")
    op.alter_column("user", "hashed_password", existing_type=sqlmodel.sql.sqltypes.AutoString(), nullable=False)
