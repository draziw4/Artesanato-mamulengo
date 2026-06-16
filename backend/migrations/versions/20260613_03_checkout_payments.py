"""checkout payments and order tracking

Revision ID: 20260613_03
Revises: 20260613_02
Create Date: 2026-06-13
"""
from alembic import op
import sqlalchemy as sa


revision = "20260613_03"
down_revision = "20260613_02"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "products", sa.Column("track_stock", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "orders", sa.Column("shipping_price", sa.Numeric(12, 2), nullable=False, server_default="0")
    )
    op.add_column(
        "orders", sa.Column("total", sa.Numeric(12, 2), nullable=False, server_default="0")
    )
    op.add_column(
        "orders", sa.Column("payment_status", sa.String(40), nullable=False, server_default="pending")
    )
    op.add_column(
        "orders", sa.Column("payment_provider", sa.String(40), nullable=False, server_default="")
    )
    op.add_column(
        "orders", sa.Column("payment_reference", sa.String(120), nullable=False, server_default="")
    )
    op.add_column(
        "orders", sa.Column("payment_url", sa.String(1000), nullable=False, server_default="")
    )
    op.add_column("orders", sa.Column("public_token", sa.String(64), nullable=True))
    op.add_column(
        "orders", sa.Column("stock_released", sa.Boolean(), nullable=False, server_default=sa.false())
    )
    op.add_column(
        "orders",
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.execute("UPDATE orders SET total = subtotal, public_token = md5(random()::text || id::text)")
    op.alter_column("orders", "public_token", nullable=False)
    op.create_index("ix_orders_payment_status", "orders", ["payment_status"])
    op.create_index("ix_orders_public_token", "orders", ["public_token"], unique=True)


def downgrade():
    op.drop_index("ix_orders_public_token", table_name="orders")
    op.drop_index("ix_orders_payment_status", table_name="orders")
    op.drop_column("orders", "updated_at")
    op.drop_column("orders", "stock_released")
    op.drop_column("orders", "public_token")
    op.drop_column("orders", "payment_url")
    op.drop_column("orders", "payment_reference")
    op.drop_column("orders", "payment_provider")
    op.drop_column("orders", "payment_status")
    op.drop_column("orders", "total")
    op.drop_column("orders", "shipping_price")
    op.drop_column("products", "track_stock")
