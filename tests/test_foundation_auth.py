from __future__ import annotations

import uuid
from datetime import timedelta
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect, select

from context_engine.app import create_app
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    AUDIT_EVENT_USER_DISABLED,
    AUDIT_EVENT_USER_ENABLED,
    AuthSession,
    AuditEvent,
    ROLE_ADMINISTRATOR,
    ROLE_MEMBER,
    User,
)
from context_engine.security import hash_session_token, verify_password
from context_engine.services.auth import create_user
from tests.conftest import run_migrations


def _contains_key(value: Any, needle: str) -> bool:
    if isinstance(value, dict):
        return any(key == needle or _contains_key(child, needle) for key, child in value.items())
    if isinstance(value, list):
        return any(_contains_key(child, needle) for child in value)
    return False


def test_fresh_migration_creates_users_and_sessions(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False))
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
    assert {"users", "auth_sessions", "alembic_version"}.issubset(tables)


def test_startup_seeds_admin_and_rotates_password(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    first_settings = Settings(
        database_url=sqlite_url,
        admin_username="admin@example.test",
        admin_password="first-password",
        session_cookie_secure=False,
        testing=True,
    )
    with TestClient(create_app(first_settings)):
        pass

    engine = create_db_engine(first_settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        admin = db.scalar(select(User).where(User.username == "admin@example.test"))
        assert admin is not None
        assert admin.role == ROLE_ADMINISTRATOR
        assert admin.password_hash.startswith("$argon2id$")
        assert verify_password(admin.password_hash, "first-password")
    finally:
        db.close()
        engine.dispose()

    second_settings = Settings(
        database_url=sqlite_url,
        admin_username="admin@example.test",
        admin_password="second-password",
        session_cookie_secure=False,
        testing=True,
    )
    with TestClient(create_app(second_settings)):
        pass

    engine = create_db_engine(second_settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        admin = db.scalar(select(User).where(User.username == "admin@example.test"))
        assert admin is not None
        assert not verify_password(admin.password_hash, "first-password")
        assert verify_password(admin.password_hash, "second-password")
    finally:
        db.close()
        engine.dispose()


def test_login_sets_http_only_cookie_and_never_returns_token(app, settings: Settings) -> None:
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert response.status_code == 200
        body = response.json()
        assert not _contains_key(body, "token")
        assert not _contains_key(body, "password")
        assert "expiresAt" in body["session"]

        set_cookie = response.headers["set-cookie"]
        assert "ce_session=" in set_cookie
        assert "HttpOnly" in set_cookie
        assert "SameSite=lax" in set_cookie
        cookie_value = client.cookies.get(settings.session_cookie_name)
        assert cookie_value

        me = client.get("/api/v1/auth/me")
        assert me.status_code == 200
        assert me.json()["user"]["role"] == ROLE_ADMINISTRATOR

    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        session = db.scalar(select(AuthSession))
        assert session is not None
        assert session.token_hash == hash_session_token(cookie_value)
        assert cookie_value not in session.token_hash
    finally:
        db.close()
        engine.dispose()


def test_settings_reject_unsafe_or_invalid_samesite(settings: Settings) -> None:
    import dataclasses

    import pytest

    with pytest.raises(ValueError, match="requires session_cookie_secure"):
        dataclasses.replace(settings, session_cookie_samesite="none", session_cookie_secure=False)
    with pytest.raises(ValueError, match="must be one of"):
        dataclasses.replace(settings, session_cookie_samesite="bogus")
    allowed = dataclasses.replace(settings, session_cookie_samesite="None", session_cookie_secure=True)
    assert allowed.session_cookie_samesite == "none"


def test_logout_revokes_session_and_clears_cookie(app, settings: Settings) -> None:
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert login.status_code == 200
        token = client.cookies.get(settings.session_cookie_name)
        assert token

        logout = client.post("/api/v1/auth/logout")
        assert logout.status_code == 200
        assert "Max-Age=0" in logout.headers["set-cookie"]
        assert client.get("/api/v1/auth/me").status_code == 401

    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        auth_session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(token)))
        assert auth_session is not None
        assert auth_session.revoked_at is not None
    finally:
        db.close()
        engine.dispose()


def test_revoked_expired_and_disabled_sessions_return_safe_401(app, settings: Settings) -> None:
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert login.status_code == 200
        token = client.cookies.get(settings.session_cookie_name)
        assert token

        engine = create_db_engine(settings)
        factory = create_session_factory(engine)
        db = factory()
        try:
            auth_session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(token)))
            assert auth_session is not None
            auth_session.revoked_at = utc_now()
            db.commit()
        finally:
            db.close()
            engine.dispose()

        revoked = client.get("/api/v1/auth/me")
        assert revoked.status_code == 401
        assert revoked.json()["error"]["code"] == "unauthenticated"
        assert "requestId" in revoked.json()["error"]

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        token = client.cookies.get(settings.session_cookie_name)
        assert token

        engine = create_db_engine(settings)
        factory = create_session_factory(engine)
        db = factory()
        try:
            auth_session = db.scalar(select(AuthSession).where(AuthSession.token_hash == hash_session_token(token)))
            assert auth_session is not None
            auth_session.expires_at = utc_now() - timedelta(seconds=1)
            db.commit()
        finally:
            db.close()
            engine.dispose()

        expired = client.get("/api/v1/auth/me")
        assert expired.status_code == 401
        assert expired.json()["error"]["message"] == "Authentication required."

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert login.status_code == 200

        engine = create_db_engine(settings)
        factory = create_session_factory(engine)
        db = factory()
        try:
            user = db.scalar(select(User).where(User.username == settings.admin_username))
            assert user is not None
            user.is_disabled = True
            db.commit()
        finally:
            db.close()
            engine.dispose()

        disabled = client.get("/api/v1/auth/me")
        assert disabled.status_code == 401
        serialized = str(disabled.json()).lower()
        assert "password" not in serialized
        assert "token" not in serialized
        assert "hash" not in serialized


def test_admin_route_forbids_members_and_allows_administrators(app, settings: Settings) -> None:
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        create_user(db, "member@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        member_login = client.post(
            "/api/v1/auth/login",
            json={"username": "member@example.test", "password": "member-password"},
        )
        assert member_login.status_code == 200
        forbidden = client.get("/api/v1/admin/users")
        assert forbidden.status_code == 403
        assert forbidden.json()["error"]["code"] == "forbidden"
        forbidden_patch = client.patch("/api/v1/admin/users/not-the-member", json={"isDisabled": True})
        assert forbidden_patch.status_code == 403
        assert forbidden_patch.json()["error"]["code"] == "forbidden"

    with TestClient(app) as client:
        admin_login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert admin_login.status_code == 200
        allowed = client.get("/api/v1/admin/users")
        assert allowed.status_code == 200
        body = allowed.json()
        assert {user["username"] for user in body["users"]} >= {"admin@example.test", "member@example.test"}
        assert not _contains_key(body, "password")
        assert not _contains_key(body, "token")
        assert not _contains_key(body, "password_hash")


def test_admin_can_disable_and_enable_member_user(app, settings: Settings) -> None:
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        member = create_user(db, "toggle-member@example.test", "member-password", role=ROLE_MEMBER)
        member_id = member.id
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as member_client:
        member_login = member_client.post(
            "/api/v1/auth/login",
            json={"username": "toggle-member@example.test", "password": "member-password"},
        )
        assert member_login.status_code == 200

        with TestClient(app) as admin_client:
            admin_login = admin_client.post(
                "/api/v1/auth/login",
                json={"username": settings.admin_username, "password": settings.admin_password},
            )
            assert admin_login.status_code == 200
            disabled = admin_client.patch(f"/api/v1/admin/users/{member_id}", json={"isDisabled": True})
            assert disabled.status_code == 200
            disabled_body = disabled.json()
            assert disabled_body["user"]["isDisabled"] is True
            assert disabled_body["user"]["id"] == member_id
            assert not _contains_key(disabled_body, "password")
            assert not _contains_key(disabled_body, "token")

            disabled_me = member_client.get("/api/v1/auth/me")
            assert disabled_me.status_code == 401
            disabled_login = member_client.post(
                "/api/v1/auth/login",
                json={"username": "toggle-member@example.test", "password": "member-password"},
            )
            assert disabled_login.status_code == 401

            enabled = admin_client.patch(f"/api/v1/admin/users/{member_id}", json={"isDisabled": False})
            assert enabled.status_code == 200
            assert enabled.json()["user"]["isDisabled"] is False

    with TestClient(app) as client:
        reenabled_login = client.post(
            "/api/v1/auth/login",
            json={"username": "toggle-member@example.test", "password": "member-password"},
        )
        assert reenabled_login.status_code == 200

    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    try:
        events = list(
            db.scalars(
                select(AuditEvent).where(
                    AuditEvent.target_kind == "user",
                    AuditEvent.target_id == member_id,
                ).order_by(AuditEvent.created_at, AuditEvent.id)
            )
        )
        assert [event.event_name for event in events] == [AUDIT_EVENT_USER_DISABLED, AUDIT_EVENT_USER_ENABLED]
        assert all(event.actor_kind == ROLE_ADMINISTRATOR for event in events)
        assert all(event.metadata_json is None for event in events)
    finally:
        db.close()
        engine.dispose()


def test_admin_cannot_disable_current_user(app, settings: Settings) -> None:
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert login.status_code == 200
        admin_user_id = login.json()["user"]["id"]

        blocked = client.patch(f"/api/v1/admin/users/{admin_user_id}", json={"isDisabled": True})
        assert blocked.status_code == 409
        assert blocked.json()["error"]["code"] == "user_self_disable_forbidden"

        still_active = client.get("/api/v1/auth/me")
        assert still_active.status_code == 200


def test_health_and_error_envelope_include_request_id(app) -> None:
    with TestClient(app) as client:
        live = client.get("/health/live", headers={"X-Request-ID": "req-test-1"})
        assert live.status_code == 200
        assert live.headers["X-Request-ID"] != "req-test-1"
        uuid.UUID(live.headers["X-Request-ID"])

        error = client.get("/api/v1/auth/me", headers={"X-Request-ID": "req-test-2"})
        assert error.status_code == 401
        assert error.headers["X-Request-ID"] != "req-test-2"
        uuid.UUID(error.headers["X-Request-ID"])
        assert error.json() == {
            "error": {
                "code": "unauthenticated",
                "message": "Authentication required.",
                "requestId": error.headers["X-Request-ID"],
            }
        }


def test_openapi_snapshot_matches() -> None:
    import json
    from pathlib import Path

    app = create_app(Settings(database_url="sqlite:///:memory:", session_cookie_secure=False, testing=True))
    current = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    expected = Path("tests/snapshots/f008_openapi.json").read_text()
    assert current == expected
