"""knowledge domains runtime

Revision ID: 20260630_0003
Revises: 20260630_0002
Create Date: 2026-06-30
"""
from alembic import op
import sqlalchemy as sa

revision = "20260630_0003"
down_revision = "20260630_0002"
branch_labels = None
depends_on = None


def _domain_slug_check() -> str:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        return "id ~ '^[a-z0-9][a-z0-9_-]{1,62}$'"
    return "length(id) between 2 and 63 and id = lower(id) and id glob '[a-z0-9]*' and id not glob '*[^a-z0-9_-]*'"


def upgrade() -> None:
    op.create_table(
        "domains",
        sa.Column("id", sa.String(length=64), nullable=False),
        sa.Column("display_name", sa.String(length=120), nullable=False),
        sa.Column("state", sa.String(length=16), server_default="stopped", nullable=False),
        sa.Column("embedding_profile_id", sa.String(length=36), nullable=False),
        sa.Column("runtime_instance_id", sa.String(length=36), nullable=False),
        sa.Column("control_generation", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(_domain_slug_check(), name="ck_domains_id_slug"),
        sa.CheckConstraint("state in ('stopped', 'running', 'deleting')", name="ck_domains_state"),
        sa.CheckConstraint("control_generation >= 1", name="ck_domains_control_generation_positive"),
        sa.ForeignKeyConstraint(["embedding_profile_id"], ["model_profiles.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_domains_embedding_profile_id", "domains", ["embedding_profile_id"], unique=False)

    op.create_table(
        "domain_operations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=False),
        sa.Column("operation_type", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("control_generation_at_start", sa.Integer(), nullable=False),
        sa.Column("requested_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("message", sa.String(length=500), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.String(length=500), nullable=True),
        sa.Column("lease_owner", sa.String(length=64), nullable=True),
        sa.Column("lease_expires_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("operation_type in ('create', 'start', 'stop', 'delete')", name="ck_domain_operations_type"),
        sa.CheckConstraint(
            "status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')",
            name="ck_domain_operations_status",
        ),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_domain_operations_domain_created", "domain_operations", ["domain_id", sa.text("created_at DESC")])
    op.create_index(
        "uq_domain_operations_one_active",
        "domain_operations",
        ["domain_id"],
        unique=True,
        sqlite_where=sa.text("status IN ('queued', 'running')"),
        postgresql_where=sa.text("status IN ('queued', 'running')"),
    )


def downgrade() -> None:
    op.drop_index("uq_domain_operations_one_active", table_name="domain_operations")
    op.drop_index("ix_domain_operations_domain_created", table_name="domain_operations")
    op.drop_table("domain_operations")
    op.drop_index("ix_domains_embedding_profile_id", table_name="domains")
    op.drop_table("domains")
