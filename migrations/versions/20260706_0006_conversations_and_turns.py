"""conversations and turns

Revision ID: 20260706_0006
Revises: 20260702_0005
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa

revision = "20260706_0006"
down_revision = "20260702_0005"
branch_labels = None
depends_on = None

_TURN_ROUTES = "('direct_llm', 'domain_rag')"
_TURN_STATUSES = "('running', 'completed', 'failed', 'redacted')"
_TURN_STOP_REASONS = (
    "('direct_llm', 'grounded', 'no_grounded_context', 'evidence_only', "
    "'turn_budget_exhausted', 'provider_failure', 'citation_validation_failed', "
    "'cancelled', 'redacted')"
)


def upgrade() -> None:
    op.create_table(
        "conversations",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("owner_user_id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["owner_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_conversations_owner_updated", "conversations", ["owner_user_id", sa.text("updated_at DESC")])

    op.create_table(
        "conversation_turns",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("conversation_id", sa.String(length=36), nullable=False),
        sa.Column("client_request_id", sa.String(length=80), nullable=False),
        sa.Column("domain_id", sa.String(length=64), nullable=True),
        sa.Column("route", sa.String(length=16), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("stop_reason", sa.String(length=32), nullable=True),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("assistant_answer", sa.Text(), nullable=True),
        sa.Column("safe_error_code", sa.String(length=64), nullable=True),
        sa.Column("safe_error_message", sa.String(length=500), nullable=True),
        sa.Column("plan_step_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("retrieval_operation_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("repair_attempt_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("completed_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(f"route in {_TURN_ROUTES}", name="ck_conversation_turns_route"),
        sa.CheckConstraint(f"status in {_TURN_STATUSES}", name="ck_conversation_turns_status"),
        sa.CheckConstraint(
            f"stop_reason is null or stop_reason in {_TURN_STOP_REASONS}",
            name="ck_conversation_turns_stop_reason",
        ),
        sa.CheckConstraint("plan_step_count >= 0", name="ck_conversation_turns_plan_step_count_nonnegative"),
        sa.CheckConstraint(
            "retrieval_operation_count >= 0",
            name="ck_conversation_turns_retrieval_operation_count_nonnegative",
        ),
        sa.CheckConstraint("repair_attempt_count >= 0", name="ck_conversation_turns_repair_attempt_count_nonnegative"),
        sa.CheckConstraint(
            "(route = 'domain_rag' and domain_id is not null) or (route = 'direct_llm' and domain_id is null)",
            name="ck_conversation_turns_route_domain",
        ),
        sa.ForeignKeyConstraint(["conversation_id"], ["conversations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("conversation_id", "client_request_id", name="uq_conversation_turns_client_request"),
    )
    op.create_index("ix_conversation_turns_conversation_created", "conversation_turns", ["conversation_id", sa.text("created_at DESC")])
    op.create_index("ix_conversation_turns_domain_id", "conversation_turns", ["domain_id"], unique=False)
    op.create_index(
        "uq_conversation_turns_one_running",
        "conversation_turns",
        ["conversation_id"],
        unique=True,
        sqlite_where=sa.text("status = 'running'"),
        postgresql_where=sa.text("status = 'running'"),
    )

    op.create_table(
        "conversation_turn_evidence_refs",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("turn_id", sa.String(length=36), nullable=False),
        sa.Column("evidence_order", sa.Integer(), nullable=False),
        sa.Column("source_document_id", sa.String(length=36), nullable=False),
        sa.Column("source_block_id", sa.String(length=36), nullable=False),
        sa.Column("citation_label", sa.String(length=16), nullable=True),
        sa.Column("source_label", sa.String(length=255), nullable=True),
        sa.Column("excerpt", sa.Text(), nullable=True),
        sa.Column("redacted_at", sa.DateTime(timezone=False), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint("evidence_order >= 1", name="ck_conversation_turn_evidence_refs_order_positive"),
        sa.CheckConstraint(
            "(redacted_at is null) or (citation_label is null and source_label is null and excerpt is null)",
            name="ck_conversation_turn_evidence_refs_redacted_fields",
        ),
        sa.ForeignKeyConstraint(["turn_id"], ["conversation_turns.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("turn_id", "evidence_order", name="uq_conversation_turn_evidence_refs_order"),
    )
    op.create_index(
        "uq_conversation_turn_evidence_refs_citation_label",
        "conversation_turn_evidence_refs",
        ["turn_id", "citation_label"],
        unique=True,
        sqlite_where=sa.text("redacted_at IS NULL"),
        postgresql_where=sa.text("redacted_at IS NULL"),
    )
    op.create_index(
        "ix_conversation_turn_evidence_refs_source_document",
        "conversation_turn_evidence_refs",
        ["source_document_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_conversation_turn_evidence_refs_source_document", table_name="conversation_turn_evidence_refs")
    op.drop_index("uq_conversation_turn_evidence_refs_citation_label", table_name="conversation_turn_evidence_refs")
    op.drop_table("conversation_turn_evidence_refs")
    op.drop_index("uq_conversation_turns_one_running", table_name="conversation_turns")
    op.drop_index("ix_conversation_turns_domain_id", table_name="conversation_turns")
    op.drop_index("ix_conversation_turns_conversation_created", table_name="conversation_turns")
    op.drop_table("conversation_turns")
    op.drop_index("ix_conversations_owner_updated", table_name="conversations")
    op.drop_table("conversations")
