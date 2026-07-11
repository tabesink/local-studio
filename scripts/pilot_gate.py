from __future__ import annotations

import json
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from context_engine.app import create_app  # noqa: E402
from context_engine.config import Settings  # noqa: E402
from context_engine.db import create_db_engine, create_session_factory  # noqa: E402
from context_engine.models import Domain, SourceDocument  # noqa: E402
from context_engine.services.domains import DomainDeleteWorker, LocalDomainRuntimeController  # noqa: E402
from context_engine.services.indexing import LocalLightRAGIndexClient, SourceIndexWorker  # noqa: E402
from context_engine.services.sources import SourcePreparationWorker  # noqa: E402


@dataclass(frozen=True)
class GateContext:
    settings: Settings
    app: Any
    tmp_dir: Path


def _run_migrations(database_url: str) -> None:
    cfg = Config(str(ROOT / "alembic.ini"))
    cfg.set_main_option("sqlalchemy.url", database_url)
    command.upgrade(cfg, "head")


def new_gate_context(tmp_dir: Path) -> GateContext:
    database_url = f"sqlite:///{tmp_dir / 'context-engine.sqlite3'}"
    settings = Settings(
        database_url=database_url,
        admin_username="pilot-admin@example.test",
        admin_password="correct horse battery staple",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_dir / "domain-runtimes"),
        domain_runtime_controller_kind="local",
        lightrag_client_kind="local",
        source_storage_root=str(tmp_dir / "source-storage"),
        testing=True,
    )
    _run_migrations(database_url)
    return GateContext(settings=settings, app=create_app(settings), tmp_dir=tmp_dir)


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    return engine, factory()


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    _assert_status(response, 200, "admin_login")


def _configure_provider(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "pilot-secret"})
    _assert_status(response, 200, "provider_config")


def _assert_status(response, expected: int, step: str) -> None:
    if response.status_code != expected:
        raise RuntimeError(f"{step} failed with {response.status_code}: {response.text}")


def _assert_no_private_targets(payload: Any) -> None:
    serialized = json.dumps(payload, sort_keys=True).lower()
    forbidden = (
        "runtime-db",
        "container.json",
        "lightrag.sqlite3",
        "pilot-secret",
        "storagepath",
        "runtimeurl",
        "traceback",
        "provider payload",
    )
    leaked = [needle for needle in forbidden if needle in serialized]
    if leaked:
        raise RuntimeError(f"private target leaked: {leaked[0]}")


def _create_started_domain(client: TestClient, domain_id: str) -> dict[str, Any]:
    created = client.post(
        "/api/v1/admin/domains",
        json={"id": domain_id, "embeddingProfileId": "openai-embedding-default"},
    )
    _assert_status(created, 201, "domain_create")
    started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
    _assert_status(started, 200, "domain_start")
    _assert_no_private_targets(started.json())
    return started.json()["domain"]


def _upload_source(client: TestClient, domain_id: str) -> dict[str, Any]:
    uploaded = client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": ("manual.md", b"# Pilot Manual\nUse lockout and inspection before startup.", "text/markdown")},
    )
    _assert_status(uploaded, 201, "source_upload")
    _assert_no_private_targets(uploaded.json())
    return uploaded.json()


def _run_source_workers(settings: Settings, source_id: str) -> dict[str, str]:
    engine, db = _session(settings)
    try:
        if SourcePreparationWorker(settings).run_once(db) is not True:
            raise RuntimeError("source preparation worker did not claim queued work")
        client = LocalLightRAGIndexClient(settings)
        if SourceIndexWorker(settings, client).run_once(db) is not True:
            raise RuntimeError("source index worker did not submit work")
        if SourceIndexWorker(settings, client).run_once(db) is not True:
            raise RuntimeError("source index worker did not mark ready")
        source = db.get(SourceDocument, source_id)
        if source is None or source.index_state != "ready" or not source.index_request_id:
            raise RuntimeError("source did not reach ready index state")
        return {"sourceId": source.id, "indexState": source.index_state, "indexRequestId": source.index_request_id}
    finally:
        db.close()
        engine.dispose()


def _retrieve_evidence(client: TestClient, domain_id: str) -> dict[str, Any]:
    response = client.post(f"/api/v1/domains/{domain_id}/evidence", json={"question": "What does startup require?"})
    _assert_status(response, 200, "evidence_retrieve")
    body = response.json()
    if body["result"] != "evidence_found" or not body["evidence"]:
        raise RuntimeError("evidence retrieval did not return mapped evidence")
    _assert_no_private_targets(body)
    return {"result": body["result"], "evidenceCount": len(body["evidence"])}


def _sse_events(response) -> list[tuple[str, dict[str, Any]]]:
    events: list[tuple[str, dict[str, Any]]] = []
    for block in response.text.strip().split("\n\n"):
        if not block:
            continue
        event_name = ""
        data = ""
        for line in block.splitlines():
            if line.startswith("event: "):
                event_name = line.removeprefix("event: ")
            elif line.startswith("data: "):
                data = line.removeprefix("data: ")
        events.append((event_name, json.loads(data)))
    return events


def _run_domain_chat(client: TestClient, domain_id: str) -> dict[str, Any]:
    conversation = client.post("/api/v1/conversations", json={"title": "Pilot"})
    _assert_status(conversation, 201, "conversation_create")
    conversation_id = conversation.json()["conversation"]["id"]
    turn = client.post(
        f"/api/v1/conversations/{conversation_id}/turns:stream",
        json={
            "clientRequestId": "pilot-turn-0001",
            "message": "What does startup require?",
            "domainId": domain_id,
        },
    )
    _assert_status(turn, 200, "domain_chat")
    _assert_no_private_targets(turn.text)
    events = _sse_events(turn)
    if events[-1][1]["stopReason"] != "grounded":
        raise RuntimeError("domain chat did not complete as grounded")
    return {"conversationId": conversation_id, "turnId": events[-1][1]["turnId"], "stopReason": events[-1][1]["stopReason"]}


def _write_diagnostics_log(settings: Settings, domain_id: str) -> None:
    engine, db = _session(settings)
    try:
        domain = db.get(Domain, domain_id)
        if domain is None:
            raise RuntimeError("domain missing for diagnostics")
        log_dir = LocalDomainRuntimeController(settings).runtime_dir(domain.id, domain.runtime_instance_id) / "logs"
        log_dir.mkdir(parents=True, exist_ok=True)
        (log_dir / "lightrag.log").write_text(
            "safe runtime ready\nprovider payload sk-pilot-redacted\nsafe index ready\n",
            encoding="utf-8",
        )
    finally:
        db.close()
        engine.dispose()


def _read_diagnostics(client: TestClient, domain_id: str) -> dict[str, Any]:
    response = client.get(f"/api/v1/admin/domains/{domain_id}/diagnostics/lightrag", params={"tail": 3})
    _assert_status(response, 200, "diagnostics_read")
    body = response.json()
    _assert_no_private_targets(body)
    serialized = json.dumps(body).lower()
    if "sk-pilot-redacted" in serialized or "provider payload" in serialized:
        raise RuntimeError("diagnostics redaction failed")
    return {"lineCount": body["diagnostics"]["lineCount"], "truncated": body["diagnostics"]["truncated"]}


def _delete_source_and_verify_redaction(client: TestClient, domain_id: str, source_id: str, conversation_id: str) -> dict[str, Any]:
    deleted = client.delete(f"/api/v1/admin/domains/{domain_id}/sources/{source_id}")
    _assert_status(deleted, 204, "source_delete")
    detail = client.get(f"/api/v1/conversations/{conversation_id}")
    _assert_status(detail, 200, "conversation_detail_after_redaction")
    turn = detail.json()["turns"][0]
    if turn["status"] != "redacted" or turn["assistantAnswer"] is not None or turn["evidence"] != []:
        raise RuntimeError("source delete did not redact derived chat content")
    return {"turnStatus": turn["status"], "stopReason": turn["stopReason"]}


def _delete_domain(settings: Settings, client: TestClient, domain_id: str) -> dict[str, str]:
    accepted = client.delete(f"/api/v1/admin/domains/{domain_id}")
    _assert_status(accepted, 202, "domain_delete_accept")
    operation_id = accepted.json()["operation"]["id"]
    engine, db = _session(settings)
    try:
        if DomainDeleteWorker(settings).run_once(db) is not True:
            raise RuntimeError("domain delete worker did not claim queued work")
        if db.get(Domain, domain_id) is not None:
            raise RuntimeError("domain was not hard-deleted")
    finally:
        db.close()
        engine.dispose()
    return {"operationId": operation_id, "status": "deleted"}


def run_compose_replacement_smoke(tmp_dir: Path) -> dict[str, Any]:
    context = new_gate_context(tmp_dir)
    with TestClient(context.app) as client:
        live = client.get("/health/live")
        ready = client.get("/health/ready")
        _assert_status(live, 200, "health_live")
        _assert_status(ready, 200, "health_ready")
        _login_admin(client, context.settings)
        _configure_provider(client)
        domain = _create_started_domain(client, "smoke")
        uploaded = _upload_source(client, "smoke")
        operation = uploaded["operation"]
        if operation["status"] != "queued":
            raise RuntimeError("worker-unavailable phase did not leave source operation queued")
        worker = _run_source_workers(context.settings, uploaded["source"]["id"])
        evidence = _retrieve_evidence(client, "smoke")
        _write_diagnostics_log(context.settings, "smoke")
        diagnostics = _read_diagnostics(client, "smoke")
    return {
        "gate": "p8-local-compose-replacement",
        "status": "passed",
        "health": {"live": live.json()["status"], "ready": ready.json()["status"]},
        "domain": {"id": domain["id"], "available": domain["available"]},
        "workerUnavailable": {"sourceOperationStatus": operation["status"]},
        "worker": worker,
        "evidence": evidence,
        "diagnostics": diagnostics,
    }


def run_pilot_flow(tmp_dir: Path) -> dict[str, Any]:
    context = new_gate_context(tmp_dir)
    with TestClient(context.app) as client:
        _login_admin(client, context.settings)
        _configure_provider(client)
        domain = _create_started_domain(client, "pilot")
        uploaded = _upload_source(client, "pilot")
        worker = _run_source_workers(context.settings, uploaded["source"]["id"])
        evidence = _retrieve_evidence(client, "pilot")
        chat = _run_domain_chat(client, "pilot")
        redaction = _delete_source_and_verify_redaction(client, "pilot", uploaded["source"]["id"], chat["conversationId"])
        domain_delete = _delete_domain(context.settings, client, "pilot")
    return {
        "gate": "p8-pilot-flow",
        "status": "passed",
        "domain": {"id": domain["id"]},
        "source": {"id": worker["sourceId"], "indexState": worker["indexState"]},
        "evidence": evidence,
        "chat": {"turnId": chat["turnId"], "stopReason": chat["stopReason"]},
        "redaction": redaction,
        "domainDelete": domain_delete,
    }


def run_with_tempdir(fn) -> int:
    with tempfile.TemporaryDirectory(prefix="ce-p8-gate-") as tmp:
        result = fn(Path(tmp))
    print(json.dumps(result, indent=2, sort_keys=True))
    return 0
