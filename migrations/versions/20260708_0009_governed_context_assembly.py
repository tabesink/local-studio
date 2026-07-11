"""governed context assembly

Revision ID: 20260708_0009
Revises: 20260707_0008
Create Date: 2026-07-08
"""
from alembic import op
import sqlalchemy as sa

revision = "20260708_0009"
down_revision = "20260707_0008"
branch_labels = None
depends_on = None

_EMPTY_COMPOSER_REF_FINGERPRINT = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
_COMPOSER_REF_KINDS = "('source', 'evidence', 'wiki', 'template')"
_PROMPT_TEMPLATE_STATES = "('approved', 'disabled')"


def upgrade() -> None:
    op.add_column(
        "conversation_turns",
        sa.Column(
            "composer_ref_fingerprint",
            sa.String(length=64),
            server_default=sa.text(f"'{_EMPTY_COMPOSER_REF_FINGERPRINT}'"),
            nullable=False,
        ),
    )
    op.create_table(
        "prompt_templates",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=True),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("state", sa.String(length=16), server_default=sa.text("'approved'"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_prompt_templates_name_not_blank"),
        sa.CheckConstraint("length(body) > 0 and length(body) <= 2000", name="ck_prompt_templates_body_size"),
        sa.CheckConstraint(f"state in {_PROMPT_TEMPLATE_STATES}", name="ck_prompt_templates_state"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_prompt_templates_name", "prompt_templates", ["name"], unique=True)

    op.create_table(
        "composer_ref_tokens",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("owner_user_id", sa.String(length=36), nullable=False),
        sa.Column("ref_kind", sa.String(length=16), nullable=False),
        sa.Column("target_id", sa.String(length=64), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=True),
        sa.Column("safe_label", sa.String(length=255), nullable=True),
        sa.Column("safe_description", sa.String(length=500), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(f"ref_kind in {_COMPOSER_REF_KINDS}", name="ck_composer_ref_tokens_kind"),
        sa.CheckConstraint("length(token_hash) = 64", name="ck_composer_ref_tokens_hash_size"),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_composer_ref_tokens_hash", "composer_ref_tokens", ["token_hash"], unique=True)
    op.create_index(
        "ix_composer_ref_tokens_owner_expires",
        "composer_ref_tokens",
        ["owner_user_id", "expires_at"],
    )
    op.create_index("ix_composer_ref_tokens_target", "composer_ref_tokens", ["ref_kind", "target_id"])

    op.create_table(
        "conversation_turn_composer_refs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("turn_id", sa.String(length=36), nullable=False),
        sa.Column("ref_order", sa.Integer(), nullable=False),
        sa.Column("ref_kind", sa.String(length=16), nullable=False),
        sa.Column("safe_label", sa.String(length=255), nullable=True),
        sa.Column("safe_description", sa.String(length=500), nullable=True),
        sa.Column("domain_id", sa.String(length=64), nullable=True),
        sa.Column("source_document_id", sa.String(length=36), nullable=True),
        sa.Column("source_block_id", sa.String(length=36), nullable=True),
        sa.Column("evidence_ref_id", sa.String(length=36), nullable=True),
        sa.Column("wiki_page_id", sa.String(length=36), nullable=True),
        sa.Column("wiki_revision_id", sa.String(length=36), nullable=True),
        sa.Column("prompt_template_id", sa.String(length=36), nullable=True),
        sa.Column("redacted_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("ref_order >= 1", name="ck_conversation_turn_composer_refs_order_positive"),
        sa.CheckConstraint(f"ref_kind in {_COMPOSER_REF_KINDS}", name="ck_conversation_turn_composer_refs_kind"),
        sa.CheckConstraint(
            "(redacted_at IS NULL) OR (safe_label IS NULL AND safe_description IS NULL)",
            name="ck_conversation_turn_composer_refs_redacted_fields",
        ),
        sa.CheckConstraint(
            "(ref_kind = 'source' AND source_document_id IS NOT NULL AND evidence_ref_id IS NULL "
            "AND wiki_page_id IS NULL AND wiki_revision_id IS NULL AND prompt_template_id IS NULL) OR "
            "(ref_kind = 'evidence' AND evidence_ref_id IS NOT NULL AND source_document_id IS NULL "
            "AND source_block_id IS NULL AND wiki_page_id IS NULL AND wiki_revision_id IS NULL "
            "AND prompt_template_id IS NULL) OR "
            "(ref_kind = 'wiki' AND wiki_page_id IS NOT NULL AND wiki_revision_id IS NOT NULL "
            "AND source_document_id IS NULL AND source_block_id IS NULL AND evidence_ref_id IS NULL "
            "AND prompt_template_id IS NULL) OR "
            "(ref_kind = 'template' AND prompt_template_id IS NOT NULL AND source_document_id IS NULL "
            "AND source_block_id IS NULL AND evidence_ref_id IS NULL AND wiki_page_id IS NULL "
            "AND wiki_revision_id IS NULL)",
            name="ck_conversation_turn_composer_refs_kind_target",
        ),
        sa.ForeignKeyConstraint(["turn_id"], ["conversation_turns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_conversation_turn_composer_refs_order",
        "conversation_turn_composer_refs",
        ["turn_id", "ref_order"],
        unique=True,
    )
    op.create_index(
        "ix_conversation_turn_composer_refs_turn_kind",
        "conversation_turn_composer_refs",
        ["turn_id", "ref_kind"],
    )
    op.create_index(
        "ix_conversation_turn_composer_refs_source_document",
        "conversation_turn_composer_refs",
        ["source_document_id"],
    )
    op.create_index(
        "ix_conversation_turn_composer_refs_evidence_ref",
        "conversation_turn_composer_refs",
        ["evidence_ref_id"],
    )
    op.create_index(
        "ix_conversation_turn_composer_refs_wiki_page",
        "conversation_turn_composer_refs",
        ["wiki_page_id"],
    )
    op.create_index(
        "ix_conversation_turn_composer_refs_template",
        "conversation_turn_composer_refs",
        ["prompt_template_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_conversation_turn_composer_refs_template", table_name="conversation_turn_composer_refs")
    op.drop_index("ix_conversation_turn_composer_refs_wiki_page", table_name="conversation_turn_composer_refs")
    op.drop_index("ix_conversation_turn_composer_refs_evidence_ref", table_name="conversation_turn_composer_refs")
    op.drop_index("ix_conversation_turn_composer_refs_source_document", table_name="conversation_turn_composer_refs")
    op.drop_index("ix_conversation_turn_composer_refs_turn_kind", table_name="conversation_turn_composer_refs")
    op.drop_index("uq_conversation_turn_composer_refs_order", table_name="conversation_turn_composer_refs")
    op.drop_table("conversation_turn_composer_refs")
    op.drop_index("ix_composer_ref_tokens_target", table_name="composer_ref_tokens")
    op.drop_index("ix_composer_ref_tokens_owner_expires", table_name="composer_ref_tokens")
    op.drop_index("uq_composer_ref_tokens_hash", table_name="composer_ref_tokens")
    op.drop_table("composer_ref_tokens")
    op.drop_index("uq_prompt_templates_name", table_name="prompt_templates")
    op.drop_table("prompt_templates")
    with op.batch_alter_table("conversation_turns") as batch_op:
        batch_op.drop_column("composer_ref_fingerprint")
