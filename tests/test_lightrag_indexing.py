from __future__ import annotations

import asyncio
import hashlib
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import inspect

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    DOMAIN_OPERATION_DELETE,
    DOMAIN_OPERATION_STATUS_QUEUED,
    DOMAIN_STATE_RUNNING,
    DOMAIN_STATE_STOPPED,
    PARSER_DOCLING,
    ROLE_MEMBER,
    SOURCE_INDEX_STATE_ACCEPTED,
    SOURCE_INDEX_STATE_CANCELLED,
    SOURCE_INDEX_STATE_FAILED,
    SOURCE_INDEX_STATE_QUEUED,
    SOURCE_INDEX_STATE_READY,
    SOURCE_STATE_PENDING,
    SOURCE_STATE_PREPARED,
    Domain,
    DomainOperation,
    SourceBlock,
    SourceDocument,
)
from context_engine.services.auth import create_user
from context_engine.services.domains import DomainDeleteWorker, LocalDomainRuntimeController
from context_engine.services.lightrag_runtime import (
    PINNED_LIGHTRAG_VERSION,
    assert_vendored_lightrag_loaded,
    ensure_vendored_lightrag_import_path,
    purge_loaded_lightrag_modules,
)
from context_engine.services.indexing import (
    LightRAGClient,
    LocalLightRAGIndexClient,
    SourceIndexError,
    SourceIndexWorker,
    compute_index_request_id,
    index_client_from_settings,
    mark_index_ready_if_current,
    render_lightrag_input,
    source_is_query_eligible,
)
from context_engine.services.sources import SourcePreparationWorker, storage_from_settings
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "index-test-credential"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "fatigue", *, start: bool = False) -> None:
    response = client.post(
        "/api/v1/admin/domains",
        json={"id": domain_id, "embeddingProfileId": "openai-embedding-default"},
    )
    assert response.status_code == 201
    if start:
        started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
        assert started.status_code == 200


def _upload(client: TestClient, domain_id: str = "fatigue", content: bytes = b"# Index Manual\nFollow the safe procedure."):
    return client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": ("manual.md", content, "text/markdown")},
    )


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


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


def _contains_forbidden_value(value: Any, needle: str) -> bool:
    if isinstance(value, dict):
        return any(_contains_forbidden_value(child, needle) for child in value.values())
    if isinstance(value, list):
        return any(_contains_forbidden_value(child, needle) for child in value)
    if isinstance(value, str):
        return needle in value.lower()
    return False


def _assert_safe_source_payload(payload: Any) -> None:
    forbidden_keys = {
        "indexgeneration",
        "indexrequestid",
        "indexcontenthash",
        "indexremotedocumentid",
        "indexleaseowner",
        "indexleaseexpiresat",
        "canonicalmarkdown",
        "rawtext",
        "sourcetext",
        "providerpayload",
        "runtimeurl",
        "storagepath",
        "path",
        "url",
        "secret",
        "credential",
        "ciphertext",
        "stack",
        "traceback",
    }
    found = _contains_forbidden_key(payload, forbidden_keys)
    assert found is None, found
    for needle in {"secret", "credential", "ciphertext", "traceback"}:
        assert not _contains_forbidden_value(payload, needle), needle


def _prepare_uploaded_source(settings: Settings, source_id: str) -> None:
    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.state == SOURCE_STATE_PREPARED
        assert source.index_state == SOURCE_INDEX_STATE_QUEUED
        assert source.index_generation == 1
        assert source.index_request_id
        assert source.index_content_hash
    finally:
        db.close()
        engine.dispose()


def _ready_indexed_source(settings: Settings, source_id: str) -> str:
    client = LocalLightRAGIndexClient(settings)
    engine, db = _session(settings)
    try:
        assert SourceIndexWorker(settings, client).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_state == SOURCE_INDEX_STATE_ACCEPTED
        request_id = source.index_request_id
        assert request_id
        assert SourceIndexWorker(settings, client).run_once(db) is True
        db.refresh(source)
        assert source.index_state == SOURCE_INDEX_STATE_READY
        assert source.index_ready_at is not None
        return request_id
    finally:
        db.close()
        engine.dispose()


def test_fresh_migration_adds_source_index_fields_without_history_tables(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        columns = {column["name"] for column in inspector.get_columns("source_documents")}
        indexes = {index["name"] for index in inspector.get_indexes("source_documents")}
    finally:
        engine.dispose()

    assert {
        "index_state",
        "index_generation",
        "index_request_id",
        "index_content_hash",
        "index_remote_document_id",
        "index_error_code",
        "index_error_message",
        "index_lease_owner",
        "index_lease_expires_at",
        "index_accepted_at",
        "index_ready_at",
        "index_updated_at",
    }.issubset(columns)
    assert "ix_source_documents_domain_index_state" in indexes
    assert not {"source_index_operations", "source_index_history", "index_jobs"}.intersection(tables)
    assert not {"rendered_text", "canonical_markdown", "provider_payload", "runtime_url", "storage_path"}.intersection(columns)


def test_production_lightrag_client_default_is_native(tmp_path: Path) -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
    )
    test_settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "test-domain-runtimes"),
        domain_runtime_controller_kind="local",
        lightrag_client_kind="local",
        testing=True,
    )

    assert isinstance(index_client_from_settings(settings), LightRAGClient)
    assert isinstance(index_client_from_settings(test_settings), LocalLightRAGIndexClient)


def test_native_lightrag_client_uses_global_lifecycle_guard(monkeypatch, tmp_path: Path) -> None:
    settings = Settings(
        database_url="sqlite:///:memory:",
        session_cookie_secure=False,
        domain_runtime_root=str(tmp_path / "domain-runtimes"),
    )
    clients = (LightRAGClient(settings), LightRAGClient(settings))
    now = utc_now()
    domains = (
        Domain(
            id="guard-a",
            display_name="Guard A",
            state=DOMAIN_STATE_RUNNING,
            embedding_profile_id="openai-embedding-default",
            runtime_instance_id="runtime-a",
            control_generation=1,
            created_at=now,
            updated_at=now,
        ),
        Domain(
            id="guard-b",
            display_name="Guard B",
            state=DOMAIN_STATE_RUNNING,
            embedding_profile_id="openai-embedding-default",
            runtime_instance_id="runtime-b",
            control_generation=1,
            created_at=now,
            updated_at=now,
        ),
    )
    rendered = "[CE_BLOCK id=block-one order=1]\nLifecycle guard proof."
    content_hash = hashlib.sha256(rendered.encode("utf-8")).hexdigest()
    state_lock = threading.Lock()
    active = 0
    max_active = 0
    entered_domains: list[str] = []

    class FakeRag:
        async def ainsert(self, rendered_text, *, ids: str, file_paths: str, track_id: str):
            assert rendered_text == rendered
            assert ids == track_id
            assert file_paths.endswith(".ce-source")
            await asyncio.sleep(0.02)
            return track_id

    async def fake_new_rag(self, domain: Domain):
        nonlocal active, max_active
        with state_lock:
            active += 1
            max_active = max(max_active, active)
            entered_domains.append(domain.id)
        await asyncio.sleep(0.02)
        return FakeRag(), {}

    async def fake_close_rag(self, rag, runtime) -> None:
        nonlocal active
        await asyncio.sleep(0.02)
        with state_lock:
            active -= 1

    monkeypatch.setattr(LightRAGClient, "_new_rag", fake_new_rag)
    monkeypatch.setattr(LightRAGClient, "_close_rag", fake_close_rag)

    def submit(index: int) -> str:
        return clients[index].submit(
            domains[index],
            request_id=f"guard-request-{index}",
            content_hash=content_hash,
            rendered_text=rendered,
        ).remote_document_id

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(submit, index) for index in range(2)]
        results = [future.result(timeout=5) for future in futures]

    assert len(results) == 2
    assert max_active == 1
    assert set(entered_domains) == {"guard-a", "guard-b"}


def test_render_lightrag_input_is_deterministic_and_rejects_invalid_sources(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "render")

    engine, db_session = _session(settings)
    try:
        now = utc_now()
        source = SourceDocument(
            id="source-render",
            domain_id="render",
            original_filename="manual.md",
            content_type="text/markdown",
            original_sha256="a" * 64,
            original_size_bytes=128,
            state=SOURCE_STATE_PREPARED,
            parser_kind=PARSER_DOCLING,
            preparation_generation=1,
            created_at=now,
            updated_at=now,
        )
        db_session.add(source)
        db_session.add_all(
            [
                SourceBlock(
                    id="block-one",
                    source_document_id=source.id,
                    domain_id="render",
                    source_order=1,
                    kind="text",
                    canonical_markdown="First line\r\nSecond line",
                    created_at=now,
                ),
                SourceBlock(
                    id="block-two",
                    source_document_id=source.id,
                    domain_id="render",
                    source_order=2,
                    kind="table",
                    canonical_markdown="| A | B |",
                    created_at=now,
                ),
            ]
        )
        db_session.commit()

        rendered = render_lightrag_input(db_session, source)
        expected = (
            f"[CE_SOURCE schema=1 source_id={source.id} sha256={'a' * 64}]\n\n"
            "[CE_BLOCK id=block-one order=1]\nFirst line\nSecond line\n\n"
            "[CE_BLOCK id=block-two order=2]\n| A | B |"
        )
        assert rendered.text == expected
        assert rendered.content_hash == hashlib.sha256(expected.encode("utf-8")).hexdigest()
        assert rendered.block_ids == ("block-one", "block-two")
        assert rendered.text.count("[CE_BLOCK") == 2

        source.state = SOURCE_STATE_PENDING
        db_session.commit()
        with pytest.raises(SourceIndexError):
            render_lightrag_input(db_session, source)

        source.state = SOURCE_STATE_PREPARED
        db_session.query(SourceBlock).delete()
        db_session.commit()
        with pytest.raises(SourceIndexError):
            render_lightrag_input(db_session, source)
    finally:
        db_session.close()
        engine.dispose()


def test_publish_queues_index_and_worker_marks_accepted_then_ready(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        assert uploaded.status_code == 201
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)

    local_client = LocalLightRAGIndexClient(settings)
    engine, db = _session(settings)
    try:
        assert SourceIndexWorker(settings, local_client).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_state == SOURCE_INDEX_STATE_ACCEPTED
        assert source.index_accepted_at is not None
        assert source.index_remote_document_id is not None
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        assert set(local_client.preserved_block_ids(domain, request_id=source.index_request_id)) == {block.id for block in source.blocks}

        assert SourceIndexWorker(settings, local_client).run_once(db) is True
        db.refresh(source)
        assert source.index_state == SOURCE_INDEX_STATE_READY
        assert source.index_ready_at is not None
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        detail = client.get(f"/api/v1/admin/domains/fatigue/sources/{source_id}")

    assert detail.status_code == 200
    source_payload = detail.json()["source"]
    assert source_payload["indexState"] == SOURCE_INDEX_STATE_READY
    assert source_payload["indexErrorCode"] is None
    assert source_payload["indexReadyAt"] is not None
    _assert_safe_source_payload(source_payload)


def test_index_worker_native_failure_sets_safe_index_error(app, settings: Settings) -> None:
    class FailingClient:
        def submit(self, domain, *, request_id: str, content_hash: str, rendered_text: str):
            raise SourceIndexError(502, "source_index_unavailable", "Source index runtime unavailable.")

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    engine, db = _session(settings)
    try:
        assert SourceIndexWorker(settings, FailingClient()).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_state == SOURCE_INDEX_STATE_FAILED
        assert source.index_error_code == "source_index_unavailable"
        assert source.index_error_message == "Source index runtime unavailable."
    finally:
        db.close()
        engine.dispose()


def test_retry_and_cancel_use_generation_fences_and_safe_routes(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    old_request_id = _ready_indexed_source(settings, source_id)

    with TestClient(app) as client:
        _login_admin(client, settings)
        retry = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/index/retry")

    assert retry.status_code == 202
    retry_payload = retry.json()["source"]
    assert retry_payload["indexState"] == SOURCE_INDEX_STATE_QUEUED
    _assert_safe_source_payload(retry_payload)

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        domain = db.get(Domain, "fatigue")
        assert source is not None and domain is not None
        assert source.index_generation == 2
        assert source.index_request_id != old_request_id
        queued_generation = source.index_generation
        queued_request_id = source.index_request_id
        assert queued_request_id
        assert LocalLightRAGIndexClient(settings).is_absent(domain, request_id=old_request_id)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        cancelled = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/index/cancel")

    assert cancelled.status_code == 200
    assert cancelled.json()["source"]["indexState"] == SOURCE_INDEX_STATE_CANCELLED
    _assert_safe_source_payload(cancelled.json())

    engine, db = _session(settings)
    try:
        assert mark_index_ready_if_current(db, source_id=source_id, generation=queued_generation, request_id=queued_request_id) is False
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_state == SOURCE_INDEX_STATE_CANCELLED
    finally:
        db.close()
        engine.dispose()


def test_source_delete_clears_remote_index_before_local_row_removal(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    request_id = _ready_indexed_source(settings, source_id)

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        domain = db.get(Domain, "fatigue")
        assert source is not None and domain is not None
        source_dir = storage_from_settings(settings).source_dir(source.domain_id, source.id)
        assert source_dir.exists()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        deleted = client.delete(f"/api/v1/admin/domains/fatigue/sources/{source_id}")

    assert deleted.status_code == 204
    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        assert LocalLightRAGIndexClient(settings).is_absent(domain, request_id=request_id)
        assert db.get(SourceDocument, source_id) is None
        assert not source_dir.exists()
    finally:
        db.close()
        engine.dispose()


def test_domain_delete_worker_clears_remote_index_before_hard_delete(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    request_id = _ready_indexed_source(settings, source_id)

    with TestClient(app) as client:
        _login_admin(client, settings)
        accepted = client.delete("/api/v1/admin/domains/fatigue")

    assert accepted.status_code == 202
    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "fatigue")
        assert domain is not None
        runtime_dir = LocalDomainRuntimeController(settings).runtime_dir(domain.id, domain.runtime_instance_id)
        assert DomainDeleteWorker(settings).run_once(db) is True
        assert db.get(Domain, "fatigue") is None
        assert db.get(SourceDocument, source_id) is None
        assert not runtime_dir.exists()
    finally:
        db.close()
        engine.dispose()

    assert request_id


def test_source_is_query_eligible_requires_available_ready_current_source(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    _ready_indexed_source(settings, source_id)

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        domain = db.get(Domain, "fatigue")
        assert source is not None and domain is not None
        assert source_is_query_eligible(db, source, domain, settings=settings) is True

        source.index_request_id = "stale-request"
        assert source_is_query_eligible(db, source, domain, settings=settings) is False
        source.index_request_id = compute_index_request_id(source.id, source.index_generation, source.index_content_hash)

        source.index_state = SOURCE_INDEX_STATE_ACCEPTED
        assert source_is_query_eligible(db, source, domain, settings=settings) is False
        source.index_state = SOURCE_INDEX_STATE_READY

        source.state = SOURCE_STATE_PENDING
        assert source_is_query_eligible(db, source, domain, settings=settings) is False
        source.state = SOURCE_STATE_PREPARED

        domain.state = DOMAIN_STATE_STOPPED
        assert source_is_query_eligible(db, source, domain, settings=settings) is False
        domain.state = DOMAIN_STATE_RUNNING

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
        assert source_is_query_eligible(db, source, domain, settings=settings) is False
    finally:
        db.close()
        engine.dispose()


def test_index_admin_routes_forbid_members_and_keep_openapi_safe(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, start=True)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    _prepare_uploaded_source(settings, source_id)
    engine, db = _session(settings)
    try:
        create_user(db, "member-index@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        login = client.post("/api/v1/auth/login", json={"username": "member-index@example.test", "password": "member-password"})
        assert login.status_code == 200
        retry = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/index/retry")
        cancel = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/index/cancel")

    assert retry.status_code == 403
    assert cancel.status_code == 403
    assert "indexGeneration" not in str(app.openapi())
    assert "indexRemoteDocumentId" not in str(app.openapi())


def test_pinned_lightrag_fixture_preserves_ce_block_idempotency_readiness_delete_and_typed_injection(tmp_path: Path) -> None:
    pytest.importorskip("json_repair")
    np = pytest.importorskip("numpy")
    ensure_vendored_lightrag_import_path()
    purge_loaded_lightrag_modules()

    async def proof() -> dict[str, object]:
        import lightrag
        from lightrag import LightRAG
        from lightrag._version import __version__
        from lightrag.kg.shared_storage import finalize_share_data, initialize_share_data
        from lightrag.utils import wrap_embedding_func_with_attrs

        assert_vendored_lightrag_loaded(lightrag)
        assert __version__ == PINNED_LIGHTRAG_VERSION

        calls = {"embedding": 0, "llm": 0}

        @wrap_embedding_func_with_attrs(embedding_dim=8, max_token_size=256, model_name="ce-proof-embedding")
        async def embed(texts, **kwargs):
            calls["embedding"] += 1
            return np.array([[float((idx + len(text)) % 7) for idx in range(8)] for text in texts], dtype=np.float32)

        async def llm(prompt, system_prompt=None, history_messages=None, **kwargs):
            calls["llm"] += 1
            return "synthetic entity"

        initialize_share_data(workers=1)
        try:
            rag = LightRAG(
                working_dir=str(tmp_path),
                embedding_func=embed,
                llm_model_func=llm,
                chunk_token_size=256,
                chunk_overlap_token_size=0,
            )
            await rag.initialize_storages()
            doc_id = "ce-source-proof"
            track_id = "ce-track-proof"
            rendered = (
                f"[CE_SOURCE schema=1 source_id=ce-source sha256={'a' * 64}]\n\n"
                "[CE_BLOCK id=block-1 order=1]\nBrake inspection interval.\n\n"
                "[CE_BLOCK id=block-2 order=2]\nTorque confirmation step."
            )
            returned = await rag.ainsert(rendered, ids=doc_id, file_paths="ce-source-proof.md", track_id=track_id)
            again = await rag.ainsert(rendered, ids=doc_id, file_paths="ce-source-proof.md", track_id=track_id)
            status = await rag.doc_status.get_by_id(doc_id)
            chunk_ids = list((status or {}).get("chunks_list") or [])
            chunks = await rag.text_chunks.get_by_ids(chunk_ids)
            delete_result = await rag.adelete_by_doc_id(doc_id)
            status_after = await rag.doc_status.get_by_id(doc_id)
            chunks_after = await rag.text_chunks.get_by_ids(chunk_ids)
            await rag.finalize_storages()
        finally:
            finalize_share_data()

        return {
            "track_match": returned == track_id and again == track_id,
            "ready": str((status or {}).get("status")) == "DocStatus.PROCESSED",
            "chunk_count": len([chunk for chunk in chunks if chunk]),
            "marker": any("[CE_BLOCK id=block-1 order=1]" in (chunk or {}).get("content", "") for chunk in chunks),
            "delete_status": str(getattr(delete_result, "status", delete_result)),
            "absent": status_after is None and not [chunk for chunk in chunks_after if chunk],
            "typed_injection": calls["embedding"] > 0,
        }

    result = asyncio.run(proof())
    assert result == {
        "track_match": True,
        "ready": True,
        "chunk_count": 1,
        "marker": True,
        "delete_status": "success",
        "absent": True,
        "typed_injection": True,
    }
