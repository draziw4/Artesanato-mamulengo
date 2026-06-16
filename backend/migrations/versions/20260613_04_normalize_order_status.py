"""normalize legacy order statuses

Revision ID: 20260613_04
Revises: 20260613_03
Create Date: 2026-06-13
"""
from alembic import op


revision = "20260613_04"
down_revision = "20260613_03"
branch_labels = None
depends_on = None


def upgrade():
    op.execute(
        """
        UPDATE orders
        SET status = CASE status
            WHEN 'confirmado' THEN 'confirmed'
            WHEN 'aguardando_pagamento' THEN 'awaiting_payment'
            ELSE status
        END
        """
    )


def downgrade():
    op.execute(
        """
        UPDATE orders
        SET status = CASE status
            WHEN 'confirmed' THEN 'confirmado'
            WHEN 'awaiting_payment' THEN 'aguardando_pagamento'
            ELSE status
        END
        """
    )
