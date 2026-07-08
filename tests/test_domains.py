from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    DOMAIN_OPERATION_DELETE,
    DOMAIN_OPERATION_STATUS_QUEUED,
    DOMAIN_STATE_RUNNING,
    DOMAIN_STATE_STOPPED,
    ROLE_MEMBER,
    Domain,
    DomainOperation,
)
from context_engine.services.auth import create_user
from context_engine.services.domains import (
    DockerDomainRuntimeController,
    DomainDeleteWorker,
    LocalDomainRuntimeController,
    controller_from_settings,
    update_domain_state_if_current,
)
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "domain-test-credential"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "fatigue") -> dict[str, Any]:
    response = client.post(
        "/api/v1/admin/domains",
        json={
            "id": domain_id,
            "displayName": "Fatigue Analysis",
            "embeddingProfileId": "openai-embedding-default",
        },
    )
    assert response.status_code == 201
    return response.json()["domain"]


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


def _contains(value: Any, needle: str) -> bool:
    if isinstance(value, dict):
        return any(needle in str(key).lower() or _contains(child, needle) for key, child in value.items())
    if isinstance(value, list):
        return any(_contains(child, needle) for child in value)
    if isinstance(value, str):
        return needle in value.lower()
    return False


def test_fresh_migration_creates_domain_tables_without_forbidden_columns(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        domain_columns = {column["name"] for column in inspector.get_columns("domains")}
        operation_columns = {column["name"] for column in inspector.get_columns("domain_operations")}
        operation_indexes = {index["name"] for index in inspector.get_indexes("domain_operations")}
    finally:
        engine.dispose()

    assert {"domains", "domain_operations", "alembic_version"}.issubset(tables)
    assert {
        "id",
        "display_name",
        "state",
        "embedding_profile_id",
        "runtime_instance_id",
        "control_generation",
        "created_at",
        "updated_at",
    }.issubset(domain_columns)
    assert not {
        "available",
        "health_status",
        "runtime_url",
        "host_port",
        "path",
        "db_name",
        "container_id",
        "provider_config",
        "meta",
        "error_message",
    }.intersection(domain_columns)
    assert {
        "operation_type",
        "status",
        "control_generation_at_start",
        "error_code",
        "error_message",
        "lease_owner",
        "lease_expires_at",
    }.issubset(operation_columns)
    assert "uq_domain_operations_one_active" in operation_indexes


def test_domain_create_validates_embedding_profile_and_returns_safe_dto(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        missing = client.post("/api/v1/admin/domains", json={"id": "fatigue"})
        assert missing.status_code == 422
        assert missing.json()["error"]["code"] == "validation_error"

        unready = client.post(
            "/api/v1/admin/domains",
            json={"id": "fatigue", "embeddingProfileId": "openai-embedding-default"},
        )
        assert unready.status_code == 400
        assert unready.json()["error"]["code"] == "embedding_profile_invalid"

        _configure_openai(client)
        domain = _create_domain(client)
        duplicate = client.post(
            "/api/v1/admin/domains",
            json={"id": "fatigue", "embeddingProfileId": "openai-embedding-default"},
        )
        operations = client.get("/api/v1/admin/domains/fatigue/operations")
        profile_patch = client.patch(
            "/api/v1/admin/runtime-settings/model-profiles/openai-embedding-default",
            json={"name": "Renamed"},
        )
        profile_delete = client.delete("/api/v1/admin/runtime-settings/model-profiles/openai-embedding-default")

    assert domain["id"] == "fatigue"
    assert domain["displayName"] == "Fatigue Analysis"
    assert domain["state"] == DOMAIN_STATE_STOPPED
    assert domain["embeddingProfileId"] == "openai-embedding-default"
    assert domain["available"] is False
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "domain_id_conflict"
    assert operations.status_code == 200
    assert operations.json()["operations"][0]["operationType"] == "create"
    assert operations.json()["operations"][0]["status"] == "succeeded"
    assert profile_patch.status_code == 409
    assert profile_patch.json()["error"]["code"] == "model_profile_in_use"
    assert profile_delete.status_code == 409
    assert profile_delete.json()["error"]["code"] == "model_profile_in_use"
    assert not _contains(domain, "runtimeinstance")
    assert not _contains(domain, "controlgeneration")
    assert not _contains(domain, "path")
    assert not _contains(domain, "url")
    assert not _contains(domain, "port")
    assert not _contains(domain, "container")
    assert not _contains(domain, "secret")


def test_domain_admin_routes_forbid_members_but_member_available_list_is_allowed(app, settings: Settings) -> None:
    with TestClient(app):
        pass

    engine, db = _session(settings)
    try:
        create_user(db, "member@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        login = client.post("/api/v1/auth/login", json={"username": "member@example.test", "password": "member-password"})
        assert login.status_code == 200
        forbidden = client.get("/api/v1/admin/domains")
        member_domains = client.get("/api/v1/domains")

    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "forbidden"
    assert member_domains.status_code == 200
    assert member_domains.json() == {"domains": []}


def test_start_creates_private_runtime_without_host_port_and_member_sees_available_only(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "fatigue")
        _create_domain(client, "sleep")
        started = client.post("/api/v1/admin/domains/fatigue/start")
        admin_list = client.get("/api/v1/admin/domains")
        member_list = client.get("/api/v1/domains")

    assert started.status_code == 200
    assert started.json()["domain"]["state"] == DOMAIN_STATE_RUNNING
    assert started.json()["domain"]["available"] is True
    assert {domain["id"]: domain["available"] for domain in admin_list.json()["domains"]} == {
        "fatigue": True,
        "sleep": False,
    }
    assert member_list.json() == {"domains": [{"id": "fatigue", "displayName": "Fatigue Analysis", "available": True}]}

    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        runtime_dir = LocalDomainRuntimeController(settings).runtime_dir(domain.id, domain.runtime_instance_id)
        container = json.loads((runtime_dir / "container.json").read_text(encoding="utf-8"))
        assert container["hostPorts"] == []
        active = DomainOperation(
            domain_id=domain.id,
            operation_type=DOMAIN_OPERATION_DELETE,
            status=DOMAIN_OPERATION_STATUS_QUEUED,
            control_generation_at_start=domain.control_generation,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(active)
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        unavailable_member_list = client.get("/api/v1/domains")
        unavailable_admin_list = client.get("/api/v1/admin/domains")

    assert unavailable_member_list.json() == {"domains": []}
    assert {domain["id"]: domain["available"] for domain in unavailable_admin_list.json()["domains"]}["fatigue"] is False


def test_domain_lifecycle_concurrency_returns_409_and_partial_index_blocks_second_active_op(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "fatigue")

    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        first = DomainOperation(
            domain_id=domain.id,
            operation_type=DOMAIN_OPERATION_DELETE,
            status=DOMAIN_OPERATION_STATUS_QUEUED,
            control_generation_at_start=domain.control_generation,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(first)
        db.commit()

        second = DomainOperation(
            domain_id=domain.id,
            operation_type=DOMAIN_OPERATION_DELETE,
            status=DOMAIN_OPERATION_STATUS_QUEUED,
            control_generation_at_start=domain.control_generation,
            created_at=utc_now(),
            updated_at=utc_now(),
        )
        db.add(second)
        with pytest.raises(IntegrityError):
            db.commit()
        db.rollback()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        blocked = client.post("/api/v1/admin/domains/fatigue/start")

    assert blocked.status_code == 409
    assert blocked.json()["error"]["code"] == "domain_operation_in_progress"


def test_delete_worker_removes_runtime_resources_and_slug_reuse_gets_fresh_fence(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "fatigue")
        assert client.post("/api/v1/admin/domains/fatigue/start").status_code == 200

    engine, db = _session(settings)
    try:
        old_domain = db.get(Domain, "fatigue")
        assert old_domain is not None
        old_runtime_instance_id = old_domain.runtime_instance_id
        old_generation = old_domain.control_generation
        old_runtime_dir = LocalDomainRuntimeController(settings).runtime_dir(old_domain.id, old_domain.runtime_instance_id)
        assert old_runtime_dir.exists()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        accepted = client.delete("/api/v1/admin/domains/fatigue")
        status = client.get("/api/v1/admin/domains/fatigue/status")
        member_list = client.get("/api/v1/domains")

    assert accepted.status_code == 202
    assert accepted.json()["operation"]["operationType"] == "delete"
    assert accepted.json()["operation"]["status"] == "queued"
    assert status.json()["domain"]["state"] == "deleting"
    assert status.json()["activeOperation"]["operationType"] == "delete"
    assert member_list.json() == {"domains": []}

    engine, db = _session(settings)
    try:
        assert DomainDeleteWorker(settings).run_once(db) is True
        assert db.get(Domain, "fatigue") is None
        assert not old_runtime_dir.exists()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        recreated = _create_domain(client, "fatigue")

    assert recreated["id"] == "fatigue"
    engine, db = _session(settings)
    try:
        new_domain = db.get(Domain, "fatigue")
        assert new_domain is not None
        assert new_domain.runtime_instance_id != old_runtime_instance_id
        assert new_domain.control_generation == 1
        rows = update_domain_state_if_current(
            db,
            domain_id="fatigue",
            runtime_instance_id=old_runtime_instance_id,
            control_generation=old_generation,
            state=DOMAIN_STATE_RUNNING,
        )
        assert rows == 0
        db.refresh(new_domain)
        assert new_domain.state == DOMAIN_STATE_STOPPED
    finally:
        db.close()
        engine.dispose()


def test_api_layer_has_no_docker_socket_dependency() -> None:
    api_source = "\n".join(path.read_text(encoding="utf-8").lower() for path in Path("context_engine/api").rglob("*.py"))
    assert "docker" not in api_source
    assert "subprocess" not in api_source
    assert LocalDomainRuntimeController.uses_docker_socket is False
    assert DockerDomainRuntimeController.uses_docker_socket is False


def test_production_runtime_controller_default_is_docker_boundary(tmp_path: Path) -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
    )

    assert isinstance(controller_from_settings(settings), DockerDomainRuntimeController)


def test_docker_controller_delegates_to_private_command_boundary(tmp_path: Path) -> None:
    command_script = tmp_path / "controller_command.py"
    command_script.write_text(
        "\n".join(
            [
                "import json",
                "import shutil",
                "import sys",
                "from pathlib import Path",
                "action = sys.argv[1]",
                "payload = json.loads(sys.stdin.read())",
                "runtime_dir = Path(payload['runtimeDir'])",
                "state_path = runtime_dir / 'state.json'",
                "if action in {'provision', 'start'}:",
                "    runtime_dir.mkdir(parents=True, exist_ok=True)",
                "    state_path.write_text(json.dumps({'healthy': action == 'start'}), encoding='utf-8')",
                "    print('{}')",
                "elif action == 'health':",
                "    print(state_path.read_text(encoding='utf-8') if state_path.exists() else json.dumps({'healthy': False}))",
                "elif action == 'stop':",
                "    runtime_dir.mkdir(parents=True, exist_ok=True)",
                "    state_path.write_text(json.dumps({'healthy': False}), encoding='utf-8')",
                "    print('{}')",
                "elif action == 'delete':",
                "    shutil.rmtree(runtime_dir, ignore_errors=True)",
                "    print('{}')",
                "else:",
                "    raise SystemExit(2)",
            ]
        ),
        encoding="utf-8",
    )
    settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
        domain_controller_command=f"{sys.executable} {command_script}",
    )
    controller = DockerDomainRuntimeController(settings)
    now = utc_now()
    domain = Domain(
        id="commanded",
        display_name="Commanded",
        state=DOMAIN_STATE_STOPPED,
        embedding_profile_id="openai-embedding-default",
        runtime_instance_id="11111111-1111-4111-8111-111111111111",
        control_generation=1,
        created_at=now,
        updated_at=now,
    )

    controller.provision(domain)
    assert controller.health(domain).healthy is False
    controller.start(domain)
    assert controller.health(domain).healthy is True
    controller.stop(domain)
    assert controller.health(domain).healthy is False
    runtime_dir = controller.runtime_dir(domain.id, domain.runtime_instance_id)
    assert runtime_dir.exists()
    controller.delete(domain)
    assert not runtime_dir.exists()
