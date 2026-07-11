"""source documents preparation

Revision ID: 20260702_0004
Revises: 20260630_0003
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa

revision = "20260702_0004"
down_revision = "20260630_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "source_documents",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("content_type", sa.String(length=160), nullable=False),
        sa.Column("original_sha256", sa.String(length=64), nullable=False),
        sa.Column("original_size_bytes", sa.Integer(), nullable=False),
        sa.Column("state", sa.String(length=16), server_default="pending", nullable=False),
        sa.Column("parser_kind", sa.String(length=32), nullable=False),
        sa.Column("preparation_generation", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("state in ('pending', 'prepared', 'deleting')", name="ck_source_documents_state"),
        sa.CheckConstraint("parser_kind in ('docling', 'reducto')", name="ck_source_documents_parser_kind"),
        sa.CheckConstraint("original_size_bytes > 0", name="ck_source_documents_size_positive"),
        sa.CheckConstraint("preparation_generation >= 1", name="ck_source_documents_generation_positive"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_source_documents_domain_hash", "source_documents", ["domain_id", "original_sha256"], unique=True)
    op.create_index("ix_source_documents_domain_created", "source_documents", ["domain_id", sa.text("created_at DESC")])

    op.create_table(
        "source_preparation_operations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_document_id", sa.String(length=36), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=False),
        sa.Column("operation_type", sa.String(length=16), server_default="prepare", nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("preparation_generation_at_start", sa.Integer(), nullable=False),
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
        sa.CheckConstraint("operation_type in ('prepare')", name="ck_source_preparation_operations_type"),
        sa.CheckConstraint("status in ('queued', 'running', 'succeeded', 'failed', 'cancelled')", name="ck_source_preparation_operations_status"),
        sa.CheckConstraint("preparation_generation_at_start >= 1", name="ck_source_preparation_operations_generation_positive"),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["requested_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["source_document_id"], ["source_documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_source_preparation_operations_domain_created", "source_preparation_operations", ["domain_id", sa.text("created_at DESC")])
    op.create_index("ix_source_preparation_operations_source_created", "source_preparation_operations", ["source_document_id", sa.text("created_at DESC")])
    op.create_index(
        "uq_source_preparation_operations_one_active",
        "source_preparation_operations",
        ["source_document_id"],
        unique=True,
        sqlite_where=sa.text("status IN ('queued', 'running')"),
        postgresql_where=sa.text("status IN ('queued', 'running')"),
    )

    op.create_table(
        "source_blocks",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_document_id", sa.String(length=36), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=False),
        sa.Column("source_order", sa.Integer(), nullable=False),
        sa.Column("kind", sa.String(length=16), nullable=False),
        sa.Column("canonical_markdown", sa.Text(), nullable=False),
        sa.Column("heading_level", sa.Integer(), nullable=True),
        sa.Column("page_start", sa.Integer(), nullable=True),
        sa.Column("page_end", sa.Integer(), nullable=True),
        sa.Column("section_path", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("source_order >= 1", name="ck_source_blocks_order_positive"),
        sa.CheckConstraint("kind in ('text', 'table', 'figure')", name="ck_source_blocks_kind"),
        sa.CheckConstraint("heading_level is null or heading_level >= 1", name="ck_source_blocks_heading_positive"),
        sa.CheckConstraint("page_start is null or page_start >= 1", name="ck_source_blocks_page_start_positive"),
        sa.CheckConstraint("page_end is null or page_end >= 1", name="ck_source_blocks_page_end_positive"),
        sa.CheckConstraint("page_start is null or page_end is null or page_end >= page_start", name="ck_source_blocks_page_range"),
        sa.ForeignKeyConstraint(["domain_id"], ["domains.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_document_id"], ["source_documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_source_blocks_source_order", "source_blocks", ["source_document_id", "source_order"], unique=True)
    op.create_index("ix_source_blocks_domain_source", "source_blocks", ["domain_id", "source_document_id"])

    op.create_table(
        "source_images",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("source_document_id", sa.String(length=36), nullable=False),
        sa.Column("source_block_id", sa.String(length=36), nullable=False),
        sa.Column("content_hash", sa.String(length=64), nullable=False),
        sa.Column("mime_type", sa.String(length=80), nullable=False),
        sa.Column("alt_text", sa.String(length=500), nullable=True),
        sa.Column("page_number", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("page_number is null or page_number >= 1", name="ck_source_images_page_positive"),
        sa.ForeignKeyConstraint(["source_block_id"], ["source_blocks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["source_document_id"], ["source_documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_source_images_source_block", "source_images", ["source_document_id", "source_block_id"])


def downgrade() -> None:
    op.drop_index("ix_source_images_source_block", table_name="source_images")
    op.drop_table("source_images")
    op.drop_index("ix_source_blocks_domain_source", table_name="source_blocks")
    op.drop_index("uq_source_blocks_source_order", table_name="source_blocks")
    op.drop_table("source_blocks")
    op.drop_index("uq_source_preparation_operations_one_active", table_name="source_preparation_operations")
    op.drop_index("ix_source_preparation_operations_source_created", table_name="source_preparation_operations")
    op.drop_index("ix_source_preparation_operations_domain_created", table_name="source_preparation_operations")
    op.drop_table("source_preparation_operations")
    op.drop_index("ix_source_documents_domain_created", table_name="source_documents")
    op.drop_index("uq_source_documents_domain_hash", table_name="source_documents")
    op.drop_table("source_documents")
