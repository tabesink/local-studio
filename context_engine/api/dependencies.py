from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from collections.abc import Generator

from fastapi import Depends, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from context_engine.api.errors import ApiError
from context_engine.config import Settings
from context_engine.db import session_scope, utc_now
from context_engine.models import AuthSession, ROLE_ADMINISTRATOR, User
from context_engine.security import hash_session_token


@dataclass(frozen=True)
class CurrentSession:
    user: User
    auth_session: AuthSession


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_db(request: Request) -> Generator[Session, None, None]:
    yield from session_scope(request.app.state.session_factory)


def _unauthenticated() -> ApiError:
    return ApiError(401, "unauthenticated", "Authentication required.")


def require_current_session(
    request: Request,
    settings: Settings = Depends(get_settings),
    db: Session = Depends(get_db),
) -> CurrentSession:
    token = request.cookies.get(settings.session_cookie_name)
    if not token:
        raise _unauthenticated()

    token_hash = hash_session_token(token)
    auth_session = db.scalar(select(AuthSession).where(AuthSession.token_hash == token_hash))
    now = utc_now()
    if auth_session is None or auth_session.revoked_at is not None or auth_session.expires_at <= now:
        raise _unauthenticated()

    user = db.get(User, auth_session.user_id)
    if user is None or user.is_disabled:
        raise _unauthenticated()

    auth_session.last_used_at = now
    db.commit()
    return CurrentSession(user=user, auth_session=auth_session)


def require_current_user(current: CurrentSession = Depends(require_current_session)) -> User:
    return current.user


def require_admin(current: CurrentSession = Depends(require_current_session)) -> User:
    if current.user.role != ROLE_ADMINISTRATOR:
        raise ApiError(403, "forbidden", "Forbidden.")
    return current.user
