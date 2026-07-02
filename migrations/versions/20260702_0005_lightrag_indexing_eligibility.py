"""lightrag indexing eligibility

Revision ID: 20260702_0005
Revises: 20260702_0004
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa

revision = "20260702_0005"
down_revision = "20260702_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("source_documents") as batch_op:
        batch_op.add_column(sa.Column("index_state", sa.String(length=16), server_default="not_requested", nullable=False))
        batch_op.add_column(sa.Column("index_generation", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("index_request_id", sa.String(length=96), nullable=True))
        batch_op.add_column(sa.Column("index_content_hash", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("index_remote_document_id", sa.String(length=128), nullable=True))
        batch_op.add_column(sa.Column("index_error_code", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("index_error_message", sa.String(length=500), nullable=True))
        batch_op.add_column(sa.Column("index_lease_owner", sa.String(length=64), nullable=True))
        batch_op.add_column(sa.Column("index_lease_expires_at", sa.DateTime(timezone=False), nullable=True))
        batch_op.add_column(sa.Column("index_accepted_at", sa.DateTime(timezone=False), nullable=True))
        batch_op.add_column(sa.Column("index_ready_at", sa.DateTime(timezone=False), nullable=True))
        batch_op.add_column(sa.Column("index_updated_at", sa.DateTime(timezone=False), nullable=True))
        batch_op.create_check_constraint(
            "ck_source_documents_index_state",
            "index_state in ('not_requested', 'queued', 'submitting', 'accepted', 'ready', 'failed', 'cancelling', 'cancelled')",
        )
        batch_op.create_check_constraint("ck_source_documents_index_generation_nonnegative", "index_generation >= 0")

    op.create_index("ix_source_documents_domain_index_state", "source_documents", ["domain_id", "index_state"])


def downgrade() -> None:
    op.drop_index("ix_source_documents_domain_index_state", table_name="source_documents")
    with op.batch_alter_table("source_documents") as batch_op:
        batch_op.drop_constraint("ck_source_documents_index_generation_nonnegative", type_="check")
        batch_op.drop_constraint("ck_source_documents_index_state", type_="check")
        batch_op.drop_column("index_updated_at")
        batch_op.drop_column("index_ready_at")
        batch_op.drop_column("index_accepted_at")
        batch_op.drop_column("index_lease_expires_at")
        batch_op.drop_column("index_lease_owner")
        batch_op.drop_column("index_error_message")
        batch_op.drop_column("index_error_code")
        batch_op.drop_column("index_remote_document_id")
        batch_op.drop_column("index_content_hash")
        batch_op.drop_column("index_request_id")
        batch_op.drop_column("index_generation")
        batch_op.drop_column("index_state")
