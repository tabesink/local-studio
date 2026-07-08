from __future__ import annotations

import json
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect, select

from context_engine.api.dependencies import get_db
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.models import (
    AUDIT_EVENT_AUDIT_EVENTS_READ,
    AUDIT_EVENT_DIAGNOSTICS_READ,
    AUDIT_EVENT_DOMAIN_CREATED,
    AUDIT_EVENT_RUNTIME_PROVIDER_CONFIG_ROTATED,
    AUDIT_EVENT_SECURITY_ADMIN_ROUTE_DENIED,
    AUDIT_OUTCOME_FAILED,
    AUDIT_OUTCOME_SUCCEEDED,
    ROLE_MEMBER,
    SOURCE_PREP_STATUS_QUEUED,
    SOURCE_STATE_PENDING,
    AuditEvent,
    ConversationTurn,
    Domain,
    DomainOperation,
    ProviderConfig,
    SourceDocument,
    SourcePreparationOperation,
)
from context_engine.services.audit import AuditContext, AuditError
from context_engine.services.auth import create_user
from context_engine.services.domains import LocalDomainRuntimeController
from context_engine.services.runtime_config import SecretCrypto, rotate_provider_credential
from context_engine.services.structured_logging import JsonLogFormatter
from context_engine.services.tracing import SafeTracingWrapper, TraceMetadata, TracingPort
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "observability-secret"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "auditdom") -> dict[str, Any]:
    response = client.post(
        "/api/v1/admin/domains",
        json={"id": domain_id, "embeddingProfileId": "openai-embedding-default"},
        headers={"X-Request-ID": "browser-controlled"},
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
        return any(_contains(child, needle) for child in value.values())
    if isinstance(value, list):
        return any(_contains(child, needle) for child in value)
    if isinstance(value, str):
        return needle.lower() in value.lower()
    return False


def test_fresh_migration_adds_p8_observability_schema(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        audit_columns = {column["name"] for column in inspector.get_columns("audit_events")}
        domain_operation_columns = {column["name"] for column in inspector.get_columns("domain_operations")}
        source_operation_columns = {column["name"] for column in inspector.get_columns("source_preparation_operations")}
        turn_columns = {column["name"] for column in inspector.get_columns("conversation_turns")}
        audit_indexes = {index["name"] for index in inspector.get_indexes("audit_events")}
    finally:
        engine.dispose()

    assert "audit_events" in tables
    assert {
        "id",
        "event_name",
        "actor_kind",
        "actor_user_id",
        "target_kind",
        "target_id",
        "request_id",
        "trace_id",
        "outcome",
        "safe_error_code",
        "metadata_json",
        "created_at",
    }.issubset(audit_columns)
    assert "request_id" in domain_operation_columns
    assert "request_id" in source_operation_columns
    assert "trace_id" in turn_columns
    assert {"ix_audit_events_request_id", "ix_audit_events_trace_id", "ix_audit_events_target_created"}.issubset(audit_indexes)


def test_admin_audit_route_self_audits_and_hides_self_reads_by_default(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        rotate = client.put(
            "/api/v1/admin/runtime-settings/providers/openai",
            json={"credential": "sk-audit-route-secret"},
        )
        assert rotate.status_code == 200

        default = client.get("/api/v1/admin/audit-events")
        include_self = client.get("/api/v1/admin/audit-events", params={"includeSelfReads": "true"})
        filtered = client.get(
            "/api/v1/admin/audit-events",
            params={"eventName": AUDIT_EVENT_RUNTIME_PROVIDER_CONFIG_ROTATED},
        )
        bad_filter = client.get("/api/v1/admin/audit-events", params={"eventName": "not.real"})

    default_names = [event["eventName"] for event in default.json()["auditEvents"]]
    include_names = [event["eventName"] for event in include_self.json()["auditEvents"]]
    assert default.status_code == 200
    assert AUDIT_EVENT_RUNTIME_PROVIDER_CONFIG_ROTATED in default_names
    assert AUDIT_EVENT_AUDIT_EVENTS_READ not in default_names
    assert AUDIT_EVENT_AUDIT_EVENTS_READ in include_names
    assert filtered.json()["auditEvents"][0]["eventName"] == AUDIT_EVENT_RUNTIME_PROVIDER_CONFIG_ROTATED
    assert bad_filter.status_code == 422
    for payload in (default.json(), include_self.json(), filtered.json()):
        assert not _contains(payload, "sk-audit-route-secret")
        assert not _contains(payload, "credential")


def test_admin_denial_is_audited_for_authenticated_members(app, settings: Settings) -> None:
    engine, db = _session(settings)
    try:
        create_user(db, "member-observe@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        member_login = client.post(
            "/api/v1/auth/login",
            json={"username": "member-observe@example.test", "password": "member-password"},
        )
        assert member_login.status_code == 200
        denied = client.get("/api/v1/admin/audit-events")
        assert denied.status_code == 403

    engine, db = _session(settings)
    try:
        event = db.scalar(select(AuditEvent).where(AuditEvent.event_name == AUDIT_EVENT_SECURITY_ADMIN_ROUTE_DENIED))
        assert event is not None
        assert event.outcome == "denied"
        assert event.safe_error_code == "forbidden"
        assert event.request_id
    finally:
        db.close()
        engine.dispose()


def test_request_id_propagates_to_operations_and_audit_without_trusting_header(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        created = client.post(
            "/api/v1/admin/domains",
            json={"id": "reqdom", "embeddingProfileId": "openai-embedding-default"},
            headers={"X-Request-ID": "browser-controlled"},
        )
        assert created.status_code == 201
        response_request_id = created.headers["X-Request-ID"]
        uploaded = client.post(
            "/api/v1/admin/domains/reqdom/sources",
            files={"file": ("manual.md", b"# Manual\nUse safe metadata.", "text/markdown")},
        )
        assert uploaded.status_code == 201
        source_operation_id = uploaded.json()["operation"]["id"]

    engine, db = _session(settings)
    try:
        domain_operation = db.scalar(
            select(DomainOperation).where(
                DomainOperation.domain_id == "reqdom",
                DomainOperation.operation_type == "create",
            )
        )
        source_operation = db.get(SourcePreparationOperation, source_operation_id)
        audit_event = db.scalar(select(AuditEvent).where(AuditEvent.event_name == AUDIT_EVENT_DOMAIN_CREATED))
        assert domain_operation is not None
        assert source_operation is not None
        assert audit_event is not None
        assert domain_operation.request_id == response_request_id
        assert domain_operation.request_id != "browser-controlled"
        assert source_operation.request_id
        assert audit_event.request_id == response_request_id
    finally:
        db.close()
        engine.dispose()


def test_lightrag_diagnostics_tail_is_bounded_redacted_and_audited(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "diagdom")
        started = client.post("/api/v1/admin/domains/diagdom/start")
        assert started.status_code == 200

    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "diagdom")
        assert domain is not None
        log_dir = LocalDomainRuntimeController(settings).runtime_dir(domain.id, domain.runtime_instance_id) / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        (log_dir / "lightrag.log").write_text(
            "\n".join(
                [
                    "safe lifecycle ready",
                    "provider payload sk-diagnostic-secret",
                    "runtime url https://runtime.invalid/private",
                    "finished without private data",
                ]
            ),
            encoding="utf-8",
        )
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        response = client.get("/api/v1/admin/domains/diagdom/diagnostics/lightrag", params={"tail": 3})

    assert response.status_code == 200
    diagnostics = response.json()["diagnostics"]
    assert diagnostics["domainId"] == "diagdom"
    assert diagnostics["kind"] == "lightrag"
    assert diagnostics["lineCount"] == 3
    assert diagnostics["truncated"] is True
    assert diagnostics["lines"][0]["message"] == "[redacted diagnostic line]"
    assert diagnostics["lines"][1]["message"] == "[redacted diagnostic line]"
    assert diagnostics["lines"][2]["message"] == "finished without private data"
    serialized = json.dumps(response.json()).lower()
    assert "sk-diagnostic-secret" not in serialized
    assert "runtime.invalid" not in serialized
    assert "provider payload" not in serialized

    engine, db = _session(settings)
    try:
        event = db.scalar(
            select(AuditEvent)
            .where(AuditEvent.event_name == AUDIT_EVENT_DIAGNOSTICS_READ)
            .order_by(AuditEvent.created_at.desc())
        )
        assert event is not None
        assert event.outcome == AUDIT_OUTCOME_SUCCEEDED
        assert event.target_kind == "domain"
        assert event.target_id == "diagdom"
        metadata = json.loads(event.metadata_json or "{}")
        assert metadata["diagnosticKind"] == "lightrag"
        assert metadata["lineCount"] == 3
        assert metadata["truncated"] is True
    finally:
        db.close()
        engine.dispose()


def test_lightrag_diagnostics_unavailable_is_safe_and_audited(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "diagmissing")
        started = client.post("/api/v1/admin/domains/diagmissing/start")
        assert started.status_code == 200
        response = client.get("/api/v1/admin/domains/diagmissing/diagnostics/lightrag")

    assert response.status_code == 502
    assert response.json()["error"]["code"] == "diagnostics_unavailable"
    serialized = json.dumps(response.json()).lower()
    assert "lightrag.log" not in serialized
    assert "runtime-db" not in serialized
    assert "container.json" not in serialized

    engine, db = _session(settings)
    try:
        event = db.scalar(
            select(AuditEvent)
            .where(AuditEvent.event_name == AUDIT_EVENT_DIAGNOSTICS_READ)
            .order_by(AuditEvent.created_at.desc())
        )
        assert event is not None
        assert event.outcome == AUDIT_OUTCOME_FAILED
        assert event.safe_error_code == "diagnostics_unavailable"
    finally:
        db.close()
        engine.dispose()


def test_db_unavailable_ready_probe_fails_safely(app) -> None:
    class BrokenDb:
        def execute(self, *_args, **_kwargs):
            raise RuntimeError("raw db path C:\\private\\context-engine.sqlite3")

    def broken_db():
        yield BrokenDb()

    app.dependency_overrides[get_db] = broken_db
    try:
        with TestClient(app) as client:
            response = client.get("/health/ready")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 503
    assert response.json()["error"]["code"] == "service_unavailable"
    assert "requestId" in response.json()["error"]
    serialized = json.dumps(response.json()).lower()
    assert "private" not in serialized
    assert "context-engine.sqlite3" not in serialized


def test_worker_unavailable_keeps_source_operation_queued_without_partial_success(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "workerdown")
        uploaded = client.post(
            "/api/v1/admin/domains/workerdown/sources",
            files={"file": ("manual.md", b"# Manual\nQueued until a worker runs.", "text/markdown")},
        )
        operations = client.get(f"/api/v1/admin/domains/workerdown/sources/{uploaded.json()['source']['id']}/operations")

    assert uploaded.status_code == 201
    assert uploaded.json()["source"]["state"] == SOURCE_STATE_PENDING
    assert uploaded.json()["operation"]["status"] == SOURCE_PREP_STATUS_QUEUED
    assert operations.status_code == 200
    assert operations.json()["operations"][0]["status"] == SOURCE_PREP_STATUS_QUEUED

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, uploaded.json()["source"]["id"])
        operation = db.get(SourcePreparationOperation, uploaded.json()["operation"]["id"])
        assert source is not None
        assert operation is not None
        assert source.state == SOURCE_STATE_PENDING
        assert operation.status == SOURCE_PREP_STATUS_QUEUED
        assert operation.started_at is None
        assert operation.finished_at is None
    finally:
        db.close()
        engine.dispose()


def test_chat_trace_id_is_private_and_reused_on_replay(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation = client.post("/api/v1/conversations", json={"title": "Trace"})
        assert conversation.status_code == 201
        conversation_id = conversation.json()["conversation"]["id"]
        body = {"clientRequestId": "trace-0001", "message": "Hello"}
        first = client.post(f"/api/v1/conversations/{conversation_id}/turns:stream", json=body)
        replay = client.post(f"/api/v1/conversations/{conversation_id}/turns:stream", json=body)
        detail = client.get(f"/api/v1/conversations/{conversation_id}")

    assert first.status_code == 200
    assert replay.status_code == 200
    assert "traceId" not in first.text
    assert "traceId" not in replay.text
    assert "traceId" not in json.dumps(detail.json())

    engine, db = _session(settings)
    try:
        turn = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "trace-0001"))
        assert turn is not None
        assert turn.trace_id
        trace_id = turn.trace_id
        db.expire_all()
        replayed = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "trace-0001"))
        assert replayed is not None
        assert replayed.trace_id == trace_id
    finally:
        db.close()
        engine.dispose()


def test_audit_write_failure_rolls_back_runtime_mutation(app, settings: Settings, monkeypatch: pytest.MonkeyPatch) -> None:
    with TestClient(app):
        pass

    class FailingAuditService:
        def __init__(self, db) -> None:
            self._db = db

        def record(self, *args, **kwargs):
            self._db.rollback()
            raise AuditError()

    import context_engine.services.runtime_config as runtime_config

    monkeypatch.setattr(runtime_config, "AuditService", FailingAuditService)
    engine, db = _session(settings)
    try:
        provider = db.get(ProviderConfig, "openai")
        assert provider is not None
        assert provider.credential_ciphertext is None
        with pytest.raises(AuditError):
            rotate_provider_credential(
                db,
                "openai",
                "sk-rollback-secret",
                SecretCrypto.from_settings(settings),
                audit_context=AuditContext(request_id="rollback-test"),
            )
        db.expire_all()
        provider = db.get(ProviderConfig, "openai")
        assert provider is not None
        assert provider.credential_ciphertext is None
    finally:
        db.close()
        engine.dispose()


def test_json_log_formatter_and_tracing_wrapper_keep_safe_metadata_only() -> None:
    record = logging.LogRecord("context_engine.test", logging.INFO, "", 1, "raw prompt secret", (), None)
    record.event = "chat.turn_persisted"
    record.request_id = "req-safe"
    record.trace_id = "trace-safe"
    record.http_route = "/api/v1/conversations/{conversation_id}/turns:stream"
    record.safe_error_code = "provider_failure"
    formatted = JsonLogFormatter().format(record)
    payload = json.loads(formatted)
    assert payload["event"] == "chat.turn_persisted"
    assert payload["request_id"] == "req-safe"
    assert payload["trace_id"] == "trace-safe"
    assert "raw prompt secret" not in formatted

    class FailingTracingPort(TracingPort):
        def record_turn(self, metadata: TraceMetadata) -> None:
            raise RuntimeError("raw provider outage")

    SafeTracingWrapper(FailingTracingPort()).record_turn(TraceMetadata({"trace_id": "trace-safe"}))


def test_expected_load_smoke_for_ten_authenticated_direct_turns(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)

    def run_turn(index: int) -> int:
        with TestClient(app) as client:
            login = client.post(
                "/api/v1/auth/login",
                json={"username": settings.admin_username, "password": settings.admin_password},
            )
            if login.status_code != 200:
                return login.status_code
            conversation = client.post("/api/v1/conversations", json={"title": f"Load {index}"})
            if conversation.status_code != 201:
                return conversation.status_code
            response = client.post(
                f"/api/v1/conversations/{conversation.json()['conversation']['id']}/turns:stream",
                json={"clientRequestId": f"load-{index:04d}", "message": "Hello"},
            )
            return response.status_code

    with ThreadPoolExecutor(max_workers=10) as executor:
        statuses = list(executor.map(run_turn, range(10)))

    assert statuses == [200] * 10
