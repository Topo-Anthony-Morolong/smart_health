"""add patient profile columns

Revision ID: a1b2c3d4e5f6
Revises: 3715d295441b
Create Date: 2026-02-22 04:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3715d295441b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add condition, doctor_name, phone, notes, date_of_birth to patients table."""
    op.add_column('patients', sa.Column('condition',    sa.String(length=255), nullable=True))
    op.add_column('patients', sa.Column('doctor_name',  sa.String(length=255), nullable=True))
    op.add_column('patients', sa.Column('phone',        sa.String(length=50),  nullable=True))
    op.add_column('patients', sa.Column('notes',        sa.Text(),             nullable=True))
    op.add_column('patients', sa.Column('date_of_birth', sa.Date(),            nullable=True))


def downgrade() -> None:
    """Remove the added columns."""
    op.drop_column('patients', 'date_of_birth')
    op.drop_column('patients', 'notes')
    op.drop_column('patients', 'phone')
    op.drop_column('patients', 'doctor_name')
    op.drop_column('patients', 'condition')
