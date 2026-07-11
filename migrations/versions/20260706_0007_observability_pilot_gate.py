"""observability pilot gate

Revision ID: 20260706_0007
Revises: 20260706_0006
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa

revision = "20260706_0007"
down_revision = "20260706_0006"
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
    "'audit_events.read', "
    "'diagnostics.read', "
    "'security.admin_route_denied'"
)


def upgrade() -> None:
    op.add_column("domain_operations", sa.Column("request_id", sa.String(length=80), nullable=True))
    op.create_index("ix_domain_operations_request_id", "domain_operations", ["request_id"], unique=False)
    op.add_column("source_preparation_operations", sa.Column("request_id", sa.String(length=80), nullable=True))
    op.create_index(
        "ix_source_preparation_operations_request_id",
        "source_preparation_operations",
        ["request_id"],
        unique=False,
    )
    op.add_column("conversation_turns", sa.Column("trace_id", sa.String(length=80), nullable=True))
    op.create_index("ix_conversation_turns_trace_id", "conversation_turns", ["trace_id"], unique=False)

    op.create_table(
        "audit_events",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("event_name", sa.String(length=80), nullable=False),
        sa.Column("actor_kind", sa.String(length=32), nullable=False),
        sa.Column("actor_user_id", sa.String(length=36), nullable=True),
        sa.Column("target_kind", sa.String(length=40), nullable=True),
        sa.Column("target_id", sa.String(length=128), nullable=True),
        sa.Column("request_id", sa.String(length=80), nullable=True),
        sa.Column("trace_id", sa.String(length=80), nullable=True),
        sa.Column("outcome", sa.String(length=16), nullable=False),
        sa.Column("safe_error_code", sa.String(length=64), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.CheckConstraint(f"event_name in ({_AUDIT_EVENT_NAMES})", name="ck_audit_events_event_name"),
        sa.CheckConstraint(
            "actor_kind in ('public', 'member', 'administrator', 'worker', 'system')",
            name="ck_audit_events_actor_kind",
        ),
        sa.CheckConstraint("outcome in ('succeeded', 'failed', 'denied')", name="ck_audit_events_outcome"),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_events_created_at", "audit_events", [sa.text("created_at DESC")])
    op.create_index("ix_audit_events_event_created", "audit_events", ["event_name", sa.text("created_at DESC")])
    op.create_index("ix_audit_events_actor_created", "audit_events", ["actor_user_id", sa.text("created_at DESC")])
    op.create_index(
        "ix_audit_events_target_created",
        "audit_events",
        ["target_kind", "target_id", sa.text("created_at DESC")],
    )
    op.create_index("ix_audit_events_request_id", "audit_events", ["request_id"])
    op.create_index("ix_audit_events_trace_id", "audit_events", ["trace_id"])


def downgrade() -> None:
    raise RuntimeError(
        "Downgrading past 20260706_0007 would irreversibly drop audit_events and "
        "request_id/trace_id correlation data. Restore from a database backup instead."
    )
    op.drop_index("ix_audit_events_trace_id", table_name="audit_events")
    op.drop_index("ix_audit_events_request_id", table_name="audit_events")
    op.drop_index("ix_audit_events_target_created", table_name="audit_events")
    op.drop_index("ix_audit_events_actor_created", table_name="audit_events")
    op.drop_index("ix_audit_events_event_created", table_name="audit_events")
    op.drop_index("ix_audit_events_created_at", table_name="audit_events")
    op.drop_table("audit_events")
    op.drop_index("ix_conversation_turns_trace_id", table_name="conversation_turns")
    op.drop_column("conversation_turns", "trace_id")
    op.drop_index("ix_source_preparation_operations_request_id", table_name="source_preparation_operations")
    op.drop_column("source_preparation_operations", "request_id")
    op.drop_index("ix_domain_operations_request_id", table_name="domain_operations")
    op.drop_column("domain_operations", "request_id")
