from __future__ import annotations

import json
from dataclasses import replace
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from context_engine.app import create_app
from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.models import (
    ROLE_MEMBER,
    SOURCE_INDEX_STATE_CANCELLED,
    SOURCE_STATE_DELETING,
    Domain,
    SourceBlock,
    SourceDocument,
)
from context_engine.services.auth import create_user
from context_engine.services.domains import LocalDomainRuntimeController
from context_engine.services.evidence import map_retrieval_hits_to_evidence, parse_ce_block_marker
from context_engine.services.indexing import LocalLightRAGIndexClient, RawRetrievalHit, SourceIndexWorker, index_client_from_settings
from context_engine.services.sources import SourcePreparationWorker


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "evidence-test-credential"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "fatigue", *, start: bool = True) -> None:
    response = client.post(
        "/api/v1/admin/domains",
        json={"id": domain_id, "displayName": f"{domain_id.title()} Domain", "embeddingProfileId": "openai-embedding-default"},
    )
    assert response.status_code == 201
    if start:
        started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
        assert started.status_code == 200


def _upload(
    client: TestClient,
    domain_id: str = "fatigue",
    filename: str = "manual.md",
    content: bytes = b"# Evidence Manual\nThe startup sequence requires lockout and inspection.",
):
    return client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": (filename, content, "text/markdown")},
    )


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


def _prepare_source(settings: Settings, source_id: str) -> None:
    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_request_id
    finally:
        db.close()
        engine.dispose()


def _ready_source(settings: Settings, source_id: str) -> str:
    engine, db = _session(settings)
    client = index_client_from_settings(settings)
    try:
        assert SourceIndexWorker(settings, client).run_once(db) is True
        assert SourceIndexWorker(settings, client).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_request_id
        return source.index_request_id
    finally:
        db.close()
        engine.dispose()


def _prepare_and_index_source(settings: Settings, source_id: str) -> str:
    _prepare_source(settings, source_id)
    return _ready_source(settings, source_id)


def _setup_ready_domain(app, settings: Settings, domain_id: str = "fatigue", filename: str = "manual.md") -> tuple[str, str]:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, domain_id, start=True)
        uploaded = _upload(client, domain_id, filename=filename)
        assert uploaded.status_code == 201
        source_id = uploaded.json()["source"]["id"]
    request_id = _prepare_and_index_source(settings, source_id)
    return source_id, request_id


def _contains_forbidden_key(value: Any, forbidden_keys: set[str]) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            key_lower = str(key).lower()
            if key_lower in forbidden_keys:
                return key_lower
            found = _contains_forbidden_key(child, forbidden_keys)
            if found:
                return found
    if isinstance(value, list):
        for child in value:
            found = _contains_forbidden_key(child, forbidden_keys)
            if found:
                return found
    return None


def _assert_safe_evidence_payload(payload: dict[str, Any]) -> None:
    forbidden_keys = {
        "sourceblockid",
        "sourcedocumentid",
        "sourceid",
        "blockid",
        "rawscore",
        "rawhit",
        "remoteid",
        "path",
        "runtimeurl",
        "providerpayload",
        "prompt",
        "canonicalmarkdown",
        "indexrequestid",
        "indexgeneration",
    }
    assert _contains_forbidden_key(payload, forbidden_keys) is None
    for item in payload.get("evidence", []):
        assert set(item) == {"excerpt", "sourceLabel"}
        assert len(item["excerpt"]) <= 500
        assert len(item["sourceLabel"]) <= 255


def test_ce_block_parser_accepts_exactly_one_strict_marker() -> None:
    marker = parse_ce_block_marker("prefix [CE_BLOCK id=block-one order=12]\ntext")
    assert marker is not None
    assert marker.block_id == "block-one"
    assert marker.source_order == 12

    assert parse_ce_block_marker("no marker here") is None
    assert parse_ce_block_marker("[CE_BLOCK id=block-one order=0]") is None
    assert parse_ce_block_marker("[CE_BLOCK id=block-one]") is None
    assert parse_ce_block_marker("[CE_BLOCK id=block-one order=1] [CE_BLOCK id=block-two order=2]") is None


def test_app_boundary_retrieval_returns_raw_hit_with_usable_ce_block(app, settings: Settings) -> None:
    source_id, request_id = _setup_ready_domain(app, settings)
    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        domain = db.get(Domain, "fatigue")
        assert source is not None and domain is not None
        block_ids = {block.id for block in source.blocks}
        hits = LocalLightRAGIndexClient(settings).retrieve(domain, question="startup sequence")
    finally:
        db.close()
        engine.dispose()

    assert request_id
    assert hits
    markers = [parse_ce_block_marker(hit.text) for hit in hits]
    assert all(marker is not None for marker in markers)
    assert {marker.block_id for marker in markers if marker is not None}.issubset(block_ids)


def test_native_lightrag_app_boundary_upload_prepare_index_and_evidence(settings: Settings, migrated_db: str) -> None:
    pytest.importorskip("json_repair")
    pytest.importorskip("nano_vectordb")
    pytest.importorskip("numpy")
    pytest.importorskip("tiktoken")
    native_settings = replace(
        settings,
        domain_runtime_controller_kind="local",
        lightrag_client_kind="native",
    )
    native_app = create_app(native_settings)

    source_id, _ = _setup_ready_domain(native_app, native_settings, "native", "native.md")

    with TestClient(native_app) as client:
        _login_admin(client, native_settings)
        response = client.post("/api/v1/domains/native/evidence", json={"question": "What sequence is required?"})

    assert migrated_db
    assert source_id
    assert response.status_code == 200
    payload = response.json()
    assert payload["result"] == "evidence_found"
    assert payload["evidence"]
    _assert_safe_evidence_payload(payload)


def test_mapper_discards_foreign_unknown_malformed_and_ineligible_hits(app, settings: Settings) -> None:
    fatigue_source_id, _ = _setup_ready_domain(app, settings, "fatigue", "fatigue.md")
    sleep_source_id, _ = _setup_ready_domain(app, settings, "sleep", "sleep.md")

    engine, db = _session(settings)
    try:
        fatigue_domain = db.get(Domain, "fatigue")
        fatigue_source = db.get(SourceDocument, fatigue_source_id)
        sleep_source = db.get(SourceDocument, sleep_source_id)
        assert fatigue_domain is not None and fatigue_source is not None and sleep_source is not None
        fatigue_block = db.scalars(select(SourceBlock).where(SourceBlock.source_document_id == fatigue_source.id)).first()
        sleep_block = db.scalars(select(SourceBlock).where(SourceBlock.source_document_id == sleep_source.id)).first()
        assert fatigue_block is not None and sleep_block is not None

        hits = [
            RawRetrievalHit(text="no marker"),
            RawRetrievalHit(text="[CE_BLOCK id=missing-block order=1]\nUnknown"),
            RawRetrievalHit(text=f"[CE_BLOCK id={sleep_block.id} order={sleep_block.source_order}]\nForeign"),
            RawRetrievalHit(
                text=(
                    f"[CE_BLOCK id={fatigue_block.id} order={fatigue_block.source_order}]\nValid\n"
                    f"[CE_BLOCK id={sleep_block.id} order={sleep_block.source_order}]"
                )
            ),
            RawRetrievalHit(text=f"[CE_BLOCK id={fatigue_block.id} order={fatigue_block.source_order}]\nValid"),
        ]
        evidence = map_retrieval_hits_to_evidence(db, settings=settings, domain=fatigue_domain, hits=hits)
        assert [item.source_label for item in evidence] == ["fatigue.md"]

        fatigue_source.index_state = SOURCE_INDEX_STATE_CANCELLED
        db.commit()
        assert map_retrieval_hits_to_evidence(db, settings=settings, domain=fatigue_domain, hits=[hits[-1]]) == []

        fatigue_source.index_state = "ready"
        fatigue_source.state = SOURCE_STATE_DELETING
        db.commit()
        assert map_retrieval_hits_to_evidence(db, settings=settings, domain=fatigue_domain, hits=[hits[-1]]) == []
    finally:
        db.close()
        engine.dispose()


def test_evidence_endpoint_returns_safe_evidence_for_member_and_admin(app, settings: Settings) -> None:
    source_id, _ = _setup_ready_domain(app, settings)
    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        assert source is not None
        block_ids = {block.id for block in source.blocks}
        create_user(db, "member-evidence@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        admin_response = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What startup sequence is required?"})

    with TestClient(app) as client:
        login = client.post("/api/v1/auth/login", json={"username": "member-evidence@example.test", "password": "member-password"})
        assert login.status_code == 200
        member_response = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What startup sequence is required?"})

    for response in (admin_response, member_response):
        assert response.status_code == 200
        payload = response.json()
        assert payload["result"] == "evidence_found"
        assert payload["evidence"]
        _assert_safe_evidence_payload(payload)
        serialized = json.dumps(payload)
        assert source_id not in serialized
        for block_id in block_ids:
            assert block_id not in serialized


def test_evidence_endpoint_no_eligible_sources_returns_safe_409(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "empty", start=True)
        response = client.post("/api/v1/domains/empty/evidence", json={"question": "Anything indexed?"})

    assert response.status_code == 409
    assert response.json()["error"]["code"] == "domain_no_eligible_sources"
    assert "eligible sources" in response.json()["error"]["message"]


def test_evidence_endpoint_all_hits_discarded_returns_no_grounded_context(app, settings: Settings) -> None:
    _, request_id = _setup_ready_domain(app, settings)
    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        record_path = LocalLightRAGIndexClient(settings)._record_path(domain, request_id)
        record = json.loads(record_path.read_text(encoding="utf-8"))
        record["chunks"] = [{"blockId": "missing-block", "text": "[CE_BLOCK id=missing-block order=1]\nUnknown"}]
        record_path.write_text(json.dumps(record, sort_keys=True), encoding="utf-8")
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        response = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What startup sequence is required?"})

    assert response.status_code == 200
    assert response.json() == {"result": "no_grounded_context", "evidence": []}


def test_evidence_endpoint_validation_authz_and_runtime_errors_are_safe(app, settings: Settings) -> None:
    _setup_ready_domain(app, settings)

    with TestClient(app) as client:
        unauthenticated = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What?"})
        _login_admin(client, settings)
        validation = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What?", "topK": 5})

    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        LocalDomainRuntimeController(settings).stop(domain)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        unavailable = client.post("/api/v1/domains/fatigue/evidence", json={"question": "What?"})

    assert unauthenticated.status_code == 401
    assert unauthenticated.json()["error"]["code"] == "unauthenticated"
    assert validation.status_code == 422
    assert validation.json()["error"]["code"] == "validation_error"
    assert unavailable.status_code == 502
    body = unavailable.json()
    assert body["error"]["code"] == "domain_runtime_unavailable"
    serialized = json.dumps(body).lower()
    for forbidden in ("startup sequence", "traceback", "runtime-db", "container.json"):
        assert forbidden not in serialized
