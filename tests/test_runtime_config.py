from __future__ import annotations

from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import func, inspect, select, text

from context_engine.app import create_app
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.models import ProviderConfig, ROLE_MEMBER
from context_engine.services.auth import create_user
from context_engine.services.runtime_config import (
    DEFAULT_SYNTHESIS_PROFILE_ID,
    MODEL_CATALOG,
    SecretCrypto,
    TrustedRuntimeResolver,
)
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _contains(value: Any, needle: str) -> bool:
    if isinstance(value, dict):
        return any(needle in str(key).lower() or _contains(child, needle) for key, child in value.items())
    if isinstance(value, list):
        return any(_contains(child, needle) for child in value)
    if isinstance(value, str):
        return needle in value.lower()
    return False


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


def test_encryption_key_required_and_validated_outside_test() -> None:
    with pytest.raises(RuntimeError, match="CONFIG_ENCRYPTION_KEY is required"):
        create_app(Settings(database_url="sqlite:///:memory:", session_cookie_secure=False, testing=False))

    with pytest.raises(RuntimeError, match="valid Fernet key"):
        create_app(
            Settings(
                database_url="sqlite:///:memory:",
                session_cookie_secure=False,
                config_encryption_key="not-a-fernet-key",
                testing=False,
            )
        )


def test_fresh_migration_creates_runtime_config_tables(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        tables = set(inspect(engine).get_table_names())
    finally:
        engine.dispose()
    assert {"provider_configs", "model_profiles", "runtime_settings", "alembic_version"}.issubset(tables)


def test_startup_seeds_provider_rows_catalog_and_safe_get(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        response = client.get("/api/v1/admin/runtime-settings")

    assert response.status_code == 200
    body = response.json()
    providers = {provider["providerKind"]: provider["isConfigured"] for provider in body["providers"]}
    assert providers == {"bedrock": False, "ollama": True, "openai": False, "reducto": False}

    profiles = {profile["id"]: profile for profile in body["modelProfiles"]}
    assert len(profiles) == len(MODEL_CATALOG)
    assert profiles["openai-embedding-default"] == {
        "id": "openai-embedding-default",
        "name": "OpenAI Default Embedding",
        "profileKind": "embedding",
        "providerKind": "openai",
        "modelName": "text-embedding-3-small",
        "vectorDimensions": 1536,
        "isDefault": True,
    }
    assert profiles[DEFAULT_SYNTHESIS_PROFILE_ID]["isDefault"] is True
    assert body["runtimeSettings"] == {"activeSynthesisProfileId": None, "activeParserKind": "docling"}
    assert not _contains(body, "ciphertext")
    assert not _contains(body, "credential")
    assert not _contains(body, "secret")


def test_runtime_settings_forbid_members(app, settings: Settings) -> None:
    engine, db = _session(settings)
    try:
        create_user(db, "member@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "member@example.test", "password": "member-password"},
        )
        assert login.status_code == 200
        response = client.get("/api/v1/admin/runtime-settings")

    assert response.status_code == 403
    assert response.json()["error"]["code"] == "forbidden"


def test_provider_credential_rotation_updates_same_row_sets_default_and_stays_private(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        first = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "sk-first-secret"})
        assert first.status_code == 200
        assert first.json() == {"provider": {"providerKind": "openai", "isConfigured": True}}
        active_default = client.get("/api/v1/admin/runtime-settings")
        assert active_default.json()["runtimeSettings"]["activeSynthesisProfileId"] == DEFAULT_SYNTHESIS_PROFILE_ID

    engine, db = _session(settings)
    try:
        count = db.scalar(select(func.count()).select_from(ProviderConfig).where(ProviderConfig.provider_kind == "openai"))
        provider = db.get(ProviderConfig, "openai")
        assert count == 1
        assert provider is not None
        first_ciphertext = provider.credential_ciphertext
        assert first_ciphertext
        assert "sk-first-secret" not in first_ciphertext
        assert SecretCrypto.from_settings(settings).decrypt_secret(first_ciphertext) == "sk-first-secret"
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        second = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "sk-second-secret"})
        assert second.status_code == 200
        safe_get = client.get("/api/v1/admin/runtime-settings")

    assert not _contains(second.json(), "sk-second-secret")
    assert not _contains(safe_get.json(), "sk-second-secret")
    assert not _contains(safe_get.json(), "ciphertext")
    assert not _contains(safe_get.json(), "credential")

    engine, db = _session(settings)
    try:
        provider = db.get(ProviderConfig, "openai")
        assert provider is not None
        assert provider.credential_ciphertext != first_ciphertext
        assert SecretCrypto.from_settings(settings).decrypt_secret(provider.credential_ciphertext or "") == "sk-second-secret"
    finally:
        db.close()
        engine.dispose()


def test_model_profile_catalog_and_active_synthesis_validation(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        embedding_without_dimensions = client.post(
            "/api/v1/admin/runtime-settings/model-profiles",
            json={
                "name": "Broken embedding",
                "profileKind": "embedding",
                "providerKind": "openai",
                "modelName": "text-embedding-3-large",
            },
        )
        assert embedding_without_dimensions.status_code == 422
        assert embedding_without_dimensions.json()["error"]["code"] == "vector_dimensions_required"

        uncataloged_model = client.post(
            "/api/v1/admin/runtime-settings/model-profiles",
            json={
                "name": "Typo synthesis",
                "profileKind": "synthesis",
                "providerKind": "openai",
                "modelName": "gpt-4.1-typo",
            },
        )
        assert uncataloged_model.status_code == 422
        assert uncataloged_model.json()["error"]["code"] == "model_profile_not_in_catalog"

        reducto_model = client.post(
            "/api/v1/admin/runtime-settings/model-profiles",
            json={
                "name": "Reducto synthesis",
                "profileKind": "synthesis",
                "providerKind": "reducto",
                "modelName": "not-a-model-provider",
            },
        )
        assert reducto_model.status_code == 422
        assert reducto_model.json()["error"]["code"] == "invalid_model_provider"

        rejected_active = client.patch(
            "/api/v1/admin/runtime-settings",
            json={"activeSynthesisProfileId": "bedrock-claude-sonnet-4-5"},
        )
        assert rejected_active.status_code == 409
        assert rejected_active.json()["error"]["code"] == "provider_not_ready"

        credential = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "sk-synthesis-secret"})
        assert credential.status_code == 200
        profile = client.post(
            "/api/v1/admin/runtime-settings/model-profiles",
            json={
                "name": "OpenAI synthesis copy",
                "profileKind": "synthesis",
                "providerKind": "openai",
                "modelName": "gpt-4.1",
            },
        )
        assert profile.status_code == 201
        profile_id = profile.json()["modelProfile"]["id"]
        assert profile.json()["modelProfile"]["isDefault"] is False
        active = client.patch("/api/v1/admin/runtime-settings", json={"activeSynthesisProfileId": profile_id})
        assert active.status_code == 200
        assert active.json()["runtimeSettings"]["activeSynthesisProfileId"] == profile_id
        delete_active = client.delete(f"/api/v1/admin/runtime-settings/model-profiles/{profile_id}")
        assert delete_active.status_code == 409


def test_reducto_parser_requires_reducto_credential(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        blocked = client.patch("/api/v1/admin/runtime-settings", json={"activeParserKind": "reducto"})
        assert blocked.status_code == 409
        assert blocked.json()["error"]["code"] == "provider_not_ready"

        rotated = client.put("/api/v1/admin/runtime-settings/providers/reducto", json={"credential": "reducto-secret"})
        assert rotated.status_code == 200
        allowed = client.patch("/api/v1/admin/runtime-settings", json={"activeParserKind": "reducto"})
        assert allowed.status_code == 200
        assert allowed.json()["runtimeSettings"]["activeParserKind"] == "reducto"


def test_embedding_profile_in_use_blocks_patch_and_delete(app, settings: Settings) -> None:
    with TestClient(app):
        pass

    engine, db = _session(settings)
    try:
        db.execute(
            text(
                """
                INSERT INTO domains (
                    id, display_name, state, embedding_profile_id, runtime_instance_id, control_generation
                )
                VALUES (:id, :display_name, :state, :profile_id, :runtime_instance_id, :control_generation)
                """
            ),
            {
                "id": "fatigue",
                "display_name": "Fatigue Analysis",
                "state": "stopped",
                "profile_id": "openai-embedding-default",
                "runtime_instance_id": "00000000-0000-0000-0000-000000000001",
                "control_generation": 1,
            },
        )
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        patched = client.patch("/api/v1/admin/runtime-settings/model-profiles/openai-embedding-default", json={"name": "Renamed"})
        deleted = client.delete("/api/v1/admin/runtime-settings/model-profiles/openai-embedding-default")

    assert patched.status_code == 409
    assert patched.json()["error"]["code"] == "model_profile_in_use"
    assert deleted.status_code == 409
    assert deleted.json()["error"]["code"] == "model_profile_in_use"


def test_trusted_runtime_resolver_decrypts_private_config_without_network_calls(app, settings: Settings, monkeypatch) -> None:
    def fail_network(*args, **kwargs):
        raise AssertionError("provider network call attempted")

    monkeypatch.setattr("socket.create_connection", fail_network)

    with TestClient(app) as client:
        _login_admin(client, settings)
        assert client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "sk-private"}).status_code == 200
        assert client.put("/api/v1/admin/runtime-settings/providers/reducto", json={"credential": "reducto-private"}).status_code == 200
        settings_update = client.patch("/api/v1/admin/runtime-settings", json={"activeParserKind": "reducto"})
        assert settings_update.status_code == 200

    engine, db = _session(settings)
    try:
        resolved = TrustedRuntimeResolver(db, SecretCrypto.from_settings(settings)).resolve()
        assert resolved.synthesis.profile_id == DEFAULT_SYNTHESIS_PROFILE_ID
        assert resolved.synthesis.model_name == "gpt-4.1-mini"
        assert resolved.synthesis.credential == "sk-private"
        assert resolved.parser.parser_kind == "reducto"
        assert resolved.parser.credential == "reducto-private"

        embedding = TrustedRuntimeResolver(db, SecretCrypto.from_settings(settings)).resolve_embedding_profile("openai-embedding-default")
        assert embedding.model_name == "text-embedding-3-small"
        assert embedding.vector_dimensions == 1536
        assert embedding.credential == "sk-private"
    finally:
        db.close()
        engine.dispose()
