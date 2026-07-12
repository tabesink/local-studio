"""admin user status audit events

Revision ID: 20260711_0010
Revises: 20260708_0009
Create Date: 2026-07-11
"""
from alembic import op

revision = "20260711_0010"
down_revision = "20260708_0009"
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
    "'security.admin_route_denied', "
    "'user.disabled', "
    "'user.enabled'"
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


def downgrade() -> None:
    _replace_audit_event_constraint(_OLD_AUDIT_EVENT_NAMES)
