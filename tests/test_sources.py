from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect, select

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory
from context_engine.models import (
    PARSER_DOCLING,
    SOURCE_PREP_STATUS_FAILED,
    SOURCE_STATE_PENDING,
    SOURCE_STATE_PREPARED,
    Domain,
    SourceBlock,
    SourceDocument,
    SourceImage,
    SourcePreparationOperation,
)
from context_engine.services.domains import DomainDeleteWorker
from context_engine.services.sources import (
    ParserAdapterError,
    PreparedBlock,
    PreparedImage,
    PreparedSource,
    SourcePreparationWorker,
    normalize_docling_document,
    normalize_reducto_parse_response,
    publish_prepared_source,
    storage_from_settings,
)
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "source-test-credential"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "fatigue") -> None:
    response = client.post(
        "/api/v1/admin/domains",
        json={"id": domain_id, "embeddingProfileId": "openai-embedding-default"},
    )
    assert response.status_code == 201


def _upload(client: TestClient, domain_id: str = "fatigue", content: bytes = b"# Safety Manual\nFollow the steps."):
    return client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": ("manual.md", content, "text/markdown")},
    )


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


def _contains_forbidden_value(value: Any, needle: str) -> bool:
    if isinstance(value, dict):
        return any(_contains_forbidden_value(child, needle) for child in value.values())
    if isinstance(value, list):
        return any(_contains_forbidden_value(child, needle) for child in value)
    if isinstance(value, str):
        return needle in value.lower()
    return False


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


def _assert_safe_payload(payload: Any) -> None:
    forbidden_keys = {
        "secret",
        "credential",
        "ciphertext",
        "path",
        "storage",
        "storagepath",
        "url",
        "runtime",
        "runtimeurl",
        "port",
        "container",
        "parserpayload",
        "providerpayload",
        "taskid",
        "jobid",
        "canonicalmarkdown",
        "rawtext",
        "sourcetext",
        "stack",
        "traceback",
        "lightrag",
    }
    found = _contains_forbidden_key(payload, forbidden_keys)
    assert found is None, found
    for needle in {"secret", "credential", "ciphertext", "traceback", "lightrag"}:
        assert not _contains_forbidden_value(payload, needle), needle


def test_fresh_migration_creates_source_tables_without_forbidden_columns(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        source_columns = {column["name"] for column in inspector.get_columns("source_documents")}
        operation_columns = {column["name"] for column in inspector.get_columns("source_preparation_operations")}
        block_columns = {column["name"] for column in inspector.get_columns("source_blocks")}
        image_columns = {column["name"] for column in inspector.get_columns("source_images")}
        operation_indexes = {index["name"] for index in inspector.get_indexes("source_preparation_operations")}
    finally:
        engine.dispose()

    assert {"source_documents", "source_preparation_operations", "source_blocks", "source_images"}.issubset(tables)
    assert {
        "id",
        "domain_id",
        "original_filename",
        "content_type",
        "original_sha256",
        "original_size_bytes",
        "state",
        "parser_kind",
        "preparation_generation",
        "created_by_user_id",
    }.issubset(source_columns)
    assert {"operation_type", "status", "preparation_generation_at_start", "lease_owner", "lease_expires_at"}.issubset(operation_columns)
    assert {"source_order", "kind", "canonical_markdown", "heading_level", "page_start", "page_end", "section_path"}.issubset(block_columns)
    assert {"content_hash", "mime_type", "alt_text", "page_number"}.issubset(image_columns)
    assert "uq_source_preparation_operations_one_active" in operation_indexes
    assert not {"path", "storage_path", "parser_payload", "provider_payload", "task_id", "job_id", "metadata", "config_json"}.intersection(source_columns | operation_columns | block_columns | image_columns)


def test_upload_stores_private_original_rejects_duplicate_and_returns_safe_dtos(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "fatigue")
        _create_domain(client, "sleep")
        uploaded = _upload(client, "fatigue")
        duplicate = _upload(client, "fatigue")
        other_domain = _upload(client, "sleep")
        sources = client.get("/api/v1/admin/domains/fatigue/sources")
        operations = client.get(f"/api/v1/admin/domains/fatigue/sources/{uploaded.json()['source']['id']}/operations")

    assert uploaded.status_code == 201
    body = uploaded.json()
    assert body["source"]["state"] == SOURCE_STATE_PENDING
    assert body["source"]["parserKind"] == PARSER_DOCLING
    assert body["operation"]["operationType"] == "prepare"
    assert body["operation"]["status"] == "queued"
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "source_duplicate"
    assert other_domain.status_code == 201
    assert len(sources.json()["sources"]) == 1
    assert operations.json()["operations"][0]["status"] == "queued"
    for payload in (body, sources.json(), operations.json()):
        _assert_safe_payload(payload)

    source_id = body["source"]["id"]
    storage = storage_from_settings(settings)
    original_path = storage.original_path("fatigue", source_id)
    assert original_path.read_bytes() == b"# Safety Manual\nFollow the steps."

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.original_sha256 == hashlib.sha256(b"# Safety Manual\nFollow the steps.").hexdigest()
        assert source.original_filename == "manual.md"
    finally:
        db.close()
        engine.dispose()


def test_docling_and_reducto_fixtures_normalize_to_same_prepared_source_shape() -> None:
    image = b"synthetic-image"
    reducto = normalize_reducto_parse_response(
        "source-id",
        PARSER_DOCLING,
        {
            "job_id": "discard-me",
            "result": {
                "chunks": [
                    {
                        "blocks": [
                            {"type": "Title", "content": "Safety Manual", "bbox": {"page": 1}},
                            {"type": "Section Header", "content": "Introduction", "bbox": {"page": 1}},
                            {"type": "Text", "content": "Follow the steps.", "bbox": {"page": 2}},
                            {"type": "Table", "content": "| Hazard | Mitigation |", "bbox": {"page": 5}},
                            {
                                "type": "Figure",
                                "content": "Figure 3: Assembly",
                                "bbox": {"page": 7},
                                "image_bytes": image,
                                "mime_type": "image/png",
                                "image_url": "https://discard.example/image.png",
                            },
                        ]
                    }
                ]
            },
        },
    )
    docling = normalize_docling_document(
        "source-id",
        PARSER_DOCLING,
        {
            "texts": [
                {"self_ref": "#/texts/0", "label": "Title", "text": "Safety Manual", "prov": [{"page": 1}]},
                {"self_ref": "#/texts/1", "label": "SectionHeader", "text": "Introduction", "prov": [{"page": 1}], "level": 2},
                {"self_ref": "#/texts/2", "label": "Text", "text": "Follow the steps.", "prov": [{"page": 2}]},
            ],
            "tables": [{"self_ref": "#/tables/0", "label": "Table", "text": "| Hazard | Mitigation |", "prov": [{"page": 5}]}],
            "pictures": [
                {
                    "self_ref": "#/pictures/0",
                    "label": "Picture",
                    "caption": "Figure 3: Assembly",
                    "prov": [{"page": 7}],
                    "image_bytes": image,
                    "mime_type": "image/png",
                }
            ],
            "body": {
                "children": [
                    {"$ref": "#/texts/0"},
                    {"$ref": "#/texts/1"},
                    {"$ref": "#/texts/2"},
                    {"$ref": "#/tables/0"},
                    {"$ref": "#/pictures/0"},
                ]
            },
        },
    )

    reducto_shape = [(block.source_order, block.kind, block.heading_level, block.page_start, block.section_path) for block in reducto.blocks]
    docling_shape = [(block.source_order, block.kind, block.heading_level, block.page_start, block.section_path) for block in docling.blocks]
    assert reducto_shape == docling_shape
    assert [block.canonical_markdown for block in reducto.blocks] == [block.canonical_markdown for block in docling.blocks]
    assert len(reducto.images) == len(docling.images) == 1
    assert reducto.images[0].content_hash == docling.images[0].content_hash == hashlib.sha256(image).hexdigest()


def test_worker_success_publishes_blocks_all_or_none_and_outline_is_structural(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.state == SOURCE_STATE_PREPARED
        assert db.scalar(select(SourceBlock).where(SourceBlock.source_document_id == source_id)) is not None
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        detail = client.get(f"/api/v1/admin/domains/fatigue/sources/{source_id}")
        outline = client.get(f"/api/v1/admin/domains/fatigue/sources/{source_id}/outline")

    assert detail.json()["source"]["blockCount"] >= 1
    assert outline.status_code == 200
    assert outline.json()["items"][0]["title"] == "Safety Manual"
    _assert_safe_payload(detail.json())
    _assert_safe_payload(outline.json())


def test_failed_parse_leaves_source_pending_with_failed_operation(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    def fail_adapter(source, original, credential):
        raise ParserAdapterError("parser_unavailable", "Parser is unavailable.")

    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings, adapters={PARSER_DOCLING: fail_adapter}).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.state == SOURCE_STATE_PENDING
        operation = db.scalar(select(SourcePreparationOperation).where(SourcePreparationOperation.source_document_id == source_id))
        assert operation is not None
        assert operation.status == SOURCE_PREP_STATUS_FAILED
        assert operation.error_code == "parser_unavailable"
        assert db.scalar(select(SourceBlock).where(SourceBlock.source_document_id == source_id)) is None
    finally:
        db.close()
        engine.dispose()


def test_retry_preserves_frozen_parser_kind_after_runtime_setting_changes(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    def fail_adapter(source, original, credential):
        raise ParserAdapterError("parser_unavailable", "Parser is unavailable.")

    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings, adapters={PARSER_DOCLING: fail_adapter}).run_once(db) is True
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        assert client.put("/api/v1/admin/runtime-settings/providers/reducto", json={"credential": "reducto-secret"}).status_code == 200
        assert client.patch("/api/v1/admin/runtime-settings", json={"activeParserKind": "reducto"}).status_code == 200
        retry = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/retry")

    assert retry.status_code == 202
    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.parser_kind == PARSER_DOCLING
        assert source.preparation_generation == 2
        operations = list(db.scalars(select(SourcePreparationOperation).where(SourcePreparationOperation.source_document_id == source_id)))
        assert len(operations) == 2
        assert any(operation.status == "queued" and operation.preparation_generation_at_start == 2 for operation in operations)
    finally:
        db.close()
        engine.dispose()


def test_cancel_fences_stale_publish(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    engine, db = _session(settings)
    try:
        operation = db.scalar(select(SourcePreparationOperation).where(SourcePreparationOperation.source_document_id == source_id))
        assert operation is not None
        operation.status = "running"
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        cancelled = client.post(f"/api/v1/admin/domains/fatigue/sources/{source_id}/cancel")

    assert cancelled.status_code == 200
    engine, db = _session(settings)
    try:
        prepared = PreparedSource(
            source_document_id=source_id,
            parser_kind=PARSER_DOCLING,
            blocks=[PreparedBlock(source_order=1, kind="text", canonical_markdown="Late publish")],
        )
        assert publish_prepared_source(db, settings, operation.id, prepared) is False
        assert db.scalar(select(SourceBlock).where(SourceBlock.source_document_id == source_id)) is None
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.state == SOURCE_STATE_PENDING
        assert source.preparation_generation == 2
    finally:
        db.close()
        engine.dispose()


def test_source_delete_removes_rows_and_private_files(app, settings: Settings) -> None:
    image = b"synthetic-image"

    def image_adapter(source, original, credential):
        return PreparedSource(
            source_document_id=source.id,
            parser_kind=source.parser_kind,
            blocks=[PreparedBlock(source_order=1, kind="figure", canonical_markdown="Figure 1", section_path=["Figures"])],
            images=[PreparedImage(source_order=1, content_hash=hashlib.sha256(image).hexdigest(), mime_type="image/png", bytes_data=image)],
        )

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings, adapters={PARSER_DOCLING: image_adapter}).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        source_dir = storage_from_settings(settings).source_dir(source.domain_id, source.id)
        assert source_dir.exists()
        assert db.scalar(select(SourceImage).where(SourceImage.source_document_id == source_id)) is not None
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        deleted = client.delete(f"/api/v1/admin/domains/fatigue/sources/{source_id}")

    assert deleted.status_code == 204
    assert not source_dir.exists()
    engine, db = _session(settings)
    try:
        assert db.get(SourceDocument, source_id) is None
        assert db.scalar(select(SourceBlock).where(SourceBlock.source_document_id == source_id)) is None
        assert db.scalar(select(SourceImage).where(SourceImage.source_document_id == source_id)) is None
    finally:
        db.close()
        engine.dispose()


def test_domain_delete_worker_purges_sources_before_hard_delete(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        source_id = uploaded.json()["source"]["id"]

    engine, db = _session(settings)
    try:
        assert SourcePreparationWorker(settings).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        source_dir = storage_from_settings(settings).source_dir(source.domain_id, source.id)
        assert source_dir.exists()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        accepted = client.delete("/api/v1/admin/domains/fatigue")
        assert accepted.status_code == 202

    engine, db = _session(settings)
    try:
        assert DomainDeleteWorker(settings).run_once(db) is True
        assert db.get(Domain, "fatigue") is None
        assert db.get(SourceDocument, source_id) is None
        assert not source_dir.exists()
    finally:
        db.close()
        engine.dispose()


def test_source_admin_routes_forbid_members(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)

    engine, db = _session(settings)
    try:
        from context_engine.models import ROLE_MEMBER
        from context_engine.services.auth import create_user

        create_user(db, "member-source@example.test", "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        login = client.post("/api/v1/auth/login", json={"username": "member-source@example.test", "password": "member-password"})
        assert login.status_code == 200
        forbidden = client.get("/api/v1/admin/domains/fatigue/sources")

    assert forbidden.status_code == 403
    assert forbidden.json()["error"]["code"] == "forbidden"


def test_p4_source_services_do_not_import_or_call_lightrag() -> None:
    # The boundary rule forbids importing the LightRAG library, not the word
    # "lightrag": routes legitimately expose the contract-mandated
    # /admin/domains/{id}/diagnostics/lightrag path via the diagnostics service.
    import ast

    def lightrag_imports(path: str) -> list[str]:
        tree = ast.parse(Path(path).read_text(encoding="utf-8"))
        offenders: list[str] = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                offenders.extend(
                    alias.name for alias in node.names if "lightrag" in alias.name.lower()
                )
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                if "lightrag" in module.lower():
                    offenders.append(module)
        return offenders

    source_text = Path("context_engine/services/sources.py").read_text(encoding="utf-8").lower()
    assert "lightrag" not in source_text
    assert "ainsert" not in source_text
    assert lightrag_imports("context_engine/api/routes.py") == []


def _start_domain(client: TestClient, domain_id: str = "fatigue") -> None:
    started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
    assert started.status_code == 200


def _upload_typed(
    client: TestClient,
    *,
    domain_id: str = "fatigue",
    filename: str,
    content: bytes,
    content_type: str,
):
    return client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": (filename, content, content_type)},
    )


def _create_member(settings: Settings, username: str = "member-preview@example.test") -> None:
    engine, db = _session(settings)
    try:
        from context_engine.models import ROLE_MEMBER
        from context_engine.services.auth import create_user

        create_user(db, username, "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()


def test_member_source_list_and_preview_for_pdf_and_text(app, settings: Settings) -> None:
    pdf_bytes = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
    text_bytes = b"plain preview body"

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        _start_domain(client)
        pdf_upload = _upload_typed(
            client,
            filename="manual.pdf",
            content=pdf_bytes,
            content_type="application/pdf",
        )
        text_upload = _upload_typed(
            client,
            filename="notes.txt",
            content=text_bytes,
            content_type="text/plain",
        )
        assert pdf_upload.status_code == 201
        assert text_upload.status_code == 201
        pdf_id = pdf_upload.json()["source"]["id"]
        text_id = text_upload.json()["source"]["id"]

    _create_member(settings)

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "member-preview@example.test", "password": "member-password"},
        )
        assert login.status_code == 200

        listed = client.get("/api/v1/domains/fatigue/sources")
        assert listed.status_code == 200
        payload = listed.json()
        _assert_safe_payload(payload)
        source_ids = {item["id"] for item in payload["sources"]}
        assert pdf_id in source_ids
        assert text_id in source_ids

        pdf_preview = client.get(f"/api/v1/domains/fatigue/sources/{pdf_id}/preview")
        assert pdf_preview.status_code == 200
        assert pdf_preview.headers["content-type"].startswith("application/pdf")
        assert pdf_preview.headers.get("cache-control") == "private, no-store"
        assert "attachment" not in (pdf_preview.headers.get("content-disposition") or "").lower()
        assert pdf_preview.content == pdf_bytes

        text_preview = client.get(f"/api/v1/domains/fatigue/sources/{text_id}/preview")
        assert text_preview.status_code == 200
        assert text_preview.headers["content-type"].startswith("text/plain")
        assert text_preview.headers.get("cache-control") == "private, no-store"
        assert text_preview.content == text_bytes

        # Concurrent / sequential readers are not locked.
        second = client.get(f"/api/v1/domains/fatigue/sources/{pdf_id}/preview")
        assert second.status_code == 200
        assert second.content == pdf_bytes

        forbidden = client.get("/api/v1/admin/domains/fatigue/sources")
        assert forbidden.status_code == 403
        assert forbidden.json()["error"]["code"] == "forbidden"
        _assert_safe_payload(forbidden.json())


def test_member_preview_rejects_docx_and_missing_original_safely(app, settings: Settings) -> None:
    docx_bytes = b"PK\x03\x04docx-fixture"
    md_bytes = b"# Previewable\nbody"

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        _start_domain(client)
        docx_upload = _upload_typed(
            client,
            filename="manual.docx",
            content=docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        md_upload = _upload_typed(
            client,
            filename="manual.md",
            content=md_bytes,
            content_type="text/markdown",
        )
        assert docx_upload.status_code == 201
        assert md_upload.status_code == 201
        docx_id = docx_upload.json()["source"]["id"]
        md_id = md_upload.json()["source"]["id"]

    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, md_id)
        assert source is not None
        original = storage_from_settings(settings).original_path(source.domain_id, source.id)
        assert original.exists()
        original.unlink()
        storage_path_needle = str(original).lower()
    finally:
        db.close()
        engine.dispose()

    _create_member(settings, "member-preview-errors@example.test")

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "member-preview-errors@example.test", "password": "member-password"},
        )
        assert login.status_code == 200

        unsupported = client.get(f"/api/v1/domains/fatigue/sources/{docx_id}/preview")
        assert unsupported.status_code == 422
        assert unsupported.json()["error"]["code"] == "source_preview_unsupported"
        _assert_safe_payload(unsupported.json())

        missing = client.get(f"/api/v1/domains/fatigue/sources/{md_id}/preview")
        assert missing.status_code == 404
        assert missing.json()["error"]["code"] == "source_preview_unavailable"
        _assert_safe_payload(missing.json())
        assert storage_path_needle not in missing.text.lower()
        assert "domains/" not in missing.text.lower()

        unknown = client.get("/api/v1/domains/fatigue/sources/00000000-0000-0000-0000-000000000000/preview")
        assert unknown.status_code == 404
        assert unknown.json()["error"]["code"] == "source_not_found"
        _assert_safe_payload(unknown.json())

        denied_domain = client.get("/api/v1/domains/missing-domain/sources")
        assert denied_domain.status_code == 404
        assert denied_domain.json()["error"]["code"] == "domain_not_found"
        _assert_safe_payload(denied_domain.json())


def test_member_preview_requires_available_domain(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client)
        uploaded = _upload(client)
        assert uploaded.status_code == 201
        source_id = uploaded.json()["source"]["id"]
        # Domain created but not started → not available for member routes.

    _create_member(settings, "member-preview-stopped@example.test")

    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": "member-preview-stopped@example.test", "password": "member-password"},
        )
        assert login.status_code == 200
        listed = client.get("/api/v1/domains/fatigue/sources")
        assert listed.status_code == 409
        assert listed.json()["error"]["code"] == "domain_state_conflict"
        _assert_safe_payload(listed.json())

        preview = client.get(f"/api/v1/domains/fatigue/sources/{source_id}/preview")
        assert preview.status_code == 409
        assert preview.json()["error"]["code"] == "domain_state_conflict"
        _assert_safe_payload(preview.json())
