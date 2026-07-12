from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from context_engine.db import utc_now
from context_engine.models import (
    AUDIT_EVENT_USER_DISABLED,
    AUDIT_EVENT_USER_ENABLED,
    ROLE_ADMINISTRATOR,
    User,
)
from context_engine.services.audit import AuditContext, AuditService


class UserAdminError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


def set_user_disabled(
    db: Session,
    *,
    user_id: str,
    is_disabled: bool,
    requested_by_user: User,
    audit_context: AuditContext,
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise UserAdminError(404, "user_not_found", "User not found.")

    if is_disabled and user.id == requested_by_user.id:
        raise UserAdminError(409, "user_self_disable_forbidden", "Cannot disable the current administrator.")

    if is_disabled and user.role == ROLE_ADMINISTRATOR and not user.is_disabled:
        active_admins_after_disable = db.scalar(
            select(func.count())
            .select_from(User)
            .where(
                User.role == ROLE_ADMINISTRATOR,
                User.is_disabled.is_(False),
                User.id != user.id,
            )
        )
        if active_admins_after_disable == 0:
            raise UserAdminError(409, "last_admin_disable_forbidden", "At least one administrator must remain active.")

    if user.is_disabled != is_disabled:
        user.is_disabled = is_disabled
        user.updated_at = utc_now()
        AuditService(db).record(
            AUDIT_EVENT_USER_DISABLED if is_disabled else AUDIT_EVENT_USER_ENABLED,
            context=audit_context,
            target_kind="user",
            target_id=user.id,
        )
        db.commit()
        db.refresh(user)

    return user
