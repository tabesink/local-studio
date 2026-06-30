from __future__ import annotations

from datetime import timedelta
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect, select

from context_engine.app import create_app
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import AuthSession, ROLE_ADMINISTRATOR, ROLE_MEMBER, User
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


def test_health_and_error_envelope_include_request_id(app) -> None:
    with TestClient(app) as client:
        live = client.get("/health/live", headers={"X-Request-ID": "req-test-1"})
        assert live.status_code == 200
        assert live.headers["X-Request-ID"] == "req-test-1"

        error = client.get("/api/v1/auth/me", headers={"X-Request-ID": "req-test-2"})
        assert error.status_code == 401
        assert error.headers["X-Request-ID"] == "req-test-2"
        assert error.json() == {
            "error": {
                "code": "unauthenticated",
                "message": "Authentication required.",
                "requestId": "req-test-2",
            }
        }


def test_openapi_snapshot_matches() -> None:
    import json
    from pathlib import Path

    app = create_app(Settings(database_url="sqlite:///:memory:", session_cookie_secure=False, testing=True))
    current = json.dumps(app.openapi(), indent=2, sort_keys=True) + "\n"
    expected = Path("tests/snapshots/f002_openapi.json").read_text()
    assert current == expected
