"""wiki curation workspace

Revision ID: 20260707_0008
Revises: 20260706_0007
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa

revision = "20260707_0008"
down_revision = "20260706_0007"
branch_labels = None
depends_on = None

_AUDIT_EVENT_NAMES = (
    "'runtime_settings.provider_config_rotated', "
    "'runtime_settings.model_profile_created', "
    "'runtime_settings.model_profile_updated', "
    "'runtime_settings.model_profile_deleted', "
    "'runtime_settings.defaults_updated', "
    "'domain.created', "
    "'domain.started', "
    "'domain.stopped', "
    "'domain.delete_queued', "
    "'domain.delete_succeeded', "
    "'domain.delete_failed', "
    "'source.uploaded', "
    "'source.preparation_retried', "
    "'source.preparation_cancelled', "
    "'source.deleted', "
    "'source.index_retry_queued', "
    "'source.index_cancelled', "
    "'chat.turn_redacted', "
    "'wiki.contribution_created', "
    "'wiki.contribution_updated', "
    "'wiki.contribution_submitted', "
    "'wiki.contribution_published', "
    "'wiki.contribution_rejected', "
    "'wiki.contribution_blocked', "
    "'wiki.page_invalidated', "
    "'audit_events.read', "
    "'diagnostics.read', "
    "'security.admin_route_denied'"
)
_OLD_AUDIT_EVENT_NAMES = (
    "'runtime_settings.provider_config_rotated', "
    "'runtime_settings.model_profile_created', "
    "'runtime_settings.model_profile_updated', "
    "'runtime_settings.model_profile_deleted', "
    "'runtime_settings.defaults_updated', "
    "'domain.created', "
    "'domain.started', "
    "'domain.stopped', "
    "'domain.delete_queued', "
    "'domain.delete_succeeded', "
    "'domain.delete_failed', "
    "'source.uploaded', "
    "'source.preparation_retried', "
    "'source.preparation_cancelled', "
    "'source.deleted', "
    "'source.index_retry_queued', "
    "'source.index_cancelled', "
    "'chat.turn_redacted', "
    "'audit_events.read', "
    "'diagnostics.read', "
    "'security.admin_route_denied'"
)
_WIKI_PAGE_STATES = "('published', 'needs_review', 'archived')"
_WIKI_CONTRIBUTION_STATES = "('draft', 'submitted', 'published', 'rejected', 'blocked')"
_WIKI_CONTRIBUTION_EVIDENCE_REF_STATES = "('active', 'invalidated')"


def _replace_audit_event_constraint(event_names: str) -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table("audit_events", recreate="always") as batch_op:
            batch_op.drop_constraint("ck_audit_events_event_name", type_="check")
            batch_op.create_check_constraint("ck_audit_events_event_name", f"event_name in ({event_names})")
        return
    op.drop_constraint("ck_audit_events_event_name", "audit_events", type_="check")
    op.create_check_constraint("ck_audit_events_event_name", "audit_events", f"event_name in ({event_names})")


def upgrade() -> None:
    _replace_audit_event_constraint(_AUDIT_EVENT_NAMES)
    op.create_table(
        "wiki_pages",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("current_revision_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(f"state in {_WIKI_PAGE_STATES}", name="ck_wiki_pages_state"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wiki_pages_state_title", "wiki_pages", ["state", "title"])

    op.create_table(
        "wiki_contributions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("target_wiki_page_id", sa.String(length=36), nullable=True),
        sa.Column("created_by_user_id", sa.String(length=36), nullable=False),
        sa.Column("reviewed_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("reviewer_note", sa.String(length=500), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(f"state in {_WIKI_CONTRIBUTION_STATES}", name="ck_wiki_contributions_state"),
        sa.ForeignKeyConstraint(["created_by_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewed_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["target_wiki_page_id"], ["wiki_pages.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_wiki_contributions_created_by_state", "wiki_contributions", ["created_by_user_id", "state"])
    op.create_index("ix_wiki_contributions_state_updated", "wiki_contributions", ["state", sa.text("updated_at DESC")])
    op.create_index("ix_wiki_contributions_target_page", "wiki_contributions", ["target_wiki_page_id"])

    op.create_table(
        "wiki_revisions",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("wiki_page_id", sa.String(length=36), nullable=False),
        sa.Column("revision_number", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("published_from_contribution_id", sa.String(length=36), nullable=False),
        sa.Column("published_by_user_id", sa.String(length=36), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("revision_number >= 1", name="ck_wiki_revisions_revision_number_positive"),
        sa.ForeignKeyConstraint(["published_by_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["published_from_contribution_id"], ["wiki_contributions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["wiki_page_id"], ["wiki_pages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("uq_wiki_revisions_page_revision", "wiki_revisions", ["wiki_page_id", "revision_number"], unique=True)
    op.create_index(
        "uq_wiki_revisions_published_contribution",
        "wiki_revisions",
        ["published_from_contribution_id"],
        unique=True,
    )

    if op.get_bind().dialect.name != "sqlite":
        op.create_foreign_key(
            "fk_wiki_pages_current_revision_id_wiki_revisions",
            "wiki_pages",
            "wiki_revisions",
            ["current_revision_id"],
            ["id"],
            ondelete="SET NULL",
        )

    op.create_table(
        "wiki_contribution_evidence_refs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("wiki_contribution_id", sa.String(length=36), nullable=False),
        sa.Column("conversation_turn_evidence_ref_id", sa.String(length=36), nullable=False),
        sa.Column("ref_order", sa.Integer(), nullable=False),
        sa.Column("citation_label", sa.String(length=16), nullable=True),
        sa.Column("source_label", sa.String(length=255), nullable=True),
        sa.Column("state", sa.String(length=16), nullable=False),
        sa.Column("invalidated_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("ref_order >= 1", name="ck_wiki_contribution_evidence_refs_order_positive"),
        sa.CheckConstraint(
            f"state in {_WIKI_CONTRIBUTION_EVIDENCE_REF_STATES}",
            name="ck_wiki_contribution_evidence_refs_state",
        ),
        sa.ForeignKeyConstraint(["conversation_turn_evidence_ref_id"], ["conversation_turn_evidence_refs.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["wiki_contribution_id"], ["wiki_contributions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "uq_wiki_contribution_evidence_refs_order",
        "wiki_contribution_evidence_refs",
        ["wiki_contribution_id", "ref_order"],
        unique=True,
    )
    op.create_index(
        "uq_wiki_contribution_evidence_refs_conversation_ref",
        "wiki_contribution_evidence_refs",
        ["wiki_contribution_id", "conversation_turn_evidence_ref_id"],
        unique=True,
    )
    op.create_index(
        "ix_wiki_contribution_evidence_refs_conversation_ref",
        "wiki_contribution_evidence_refs",
        ["conversation_turn_evidence_ref_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_wiki_contribution_evidence_refs_conversation_ref", table_name="wiki_contribution_evidence_refs")
    op.drop_index("uq_wiki_contribution_evidence_refs_conversation_ref", table_name="wiki_contribution_evidence_refs")
    op.drop_index("uq_wiki_contribution_evidence_refs_order", table_name="wiki_contribution_evidence_refs")
    op.drop_table("wiki_contribution_evidence_refs")
    if op.get_bind().dialect.name != "sqlite":
        op.drop_constraint("fk_wiki_pages_current_revision_id_wiki_revisions", "wiki_pages", type_="foreignkey")
    op.drop_index("uq_wiki_revisions_published_contribution", table_name="wiki_revisions")
    op.drop_index("uq_wiki_revisions_page_revision", table_name="wiki_revisions")
    op.drop_table("wiki_revisions")
    op.drop_index("ix_wiki_contributions_target_page", table_name="wiki_contributions")
    op.drop_index("ix_wiki_contributions_state_updated", table_name="wiki_contributions")
    op.drop_index("ix_wiki_contributions_created_by_state", table_name="wiki_contributions")
    op.drop_table("wiki_contributions")
    op.drop_index("ix_wiki_pages_state_title", table_name="wiki_pages")
    op.drop_table("wiki_pages")
    _replace_audit_event_constraint(_OLD_AUDIT_EVENT_NAMES)
