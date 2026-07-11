from __future__ import annotations

import json
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import delete

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    PARSER_DOCLING,
    ROLE_MEMBER,
    SOURCE_BLOCK_KIND_TEXT,
    SOURCE_STATE_PREPARED,
    TURN_ROUTE_DOMAIN_RAG,
    TURN_STATUS_COMPLETED,
    TURN_STOP_REASON_GROUNDED,
    ConversationTurn,
    ConversationTurnEvidenceRef,
    SourceBlock,
    SourceDocument,
)
from context_engine.services.auth import create_user
from context_engine.services.conversations import create_conversation


RESOLVE_PATH = "/api/v1/evidence-refs/{evidence_ref_id}/source"
FORBIDDEN_RESPONSE_KEYS = {
    "source_block_id",
    "sourceblockid",
    "sourceBlockId",
    "storagepath",
    "storage_path",
    "storagePath",
    "runtimeurl",
    "runtime_url",
    "runtimeUrl",
    "path",
    "url",
    "excerpt",
}


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put(
        "/api/v1/admin/runtime-settings/providers/openai",
        json={"credential": "source-ref-test-credential"},
    )
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "manuals") -> None:
    response = client.post(
        "/api/v1/admin/domains",
        json={
            "id": domain_id,
            "displayName": f"{domain_id.title()} Domain",
            "embeddingProfileId": "openai-embedding-default",
        },
    )
    assert response.status_code == 201
    started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
    assert started.status_code == 200


def _upload(
    client: TestClient,
    *,
    domain_id: str,
    filename: str,
    content: bytes,
    content_type: str,
) -> str:
    response = client.post(
        f"/api/v1/admin/domains/{domain_id}/sources",
        files={"file": (filename, content, content_type)},
    )
    assert response.status_code == 201
    return response.json()["source"]["id"]


def _session(settings: Settings):
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db = factory()
    return engine, db


def _create_member(settings: Settings, username: str) -> None:
    engine, db = _session(settings)
    try:
        create_user(db, username, "member-password", role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()


def _login_member(client: TestClient, username: str) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": username, "password": "member-password"},
    )
    assert response.status_code == 200


def _contains_forbidden_key(value: Any, forbidden_keys: set[str]) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            key_lower = str(key).lower().replace("_", "")
            if key_lower in {k.lower().replace("_", "") for k in forbidden_keys}:
                return str(key)
            if str(key) in forbidden_keys:
                return str(key)
            found = _contains_forbidden_key(child, forbidden_keys)
            if found:
                return found
    if isinstance(value, list):
        for child in value:
            found = _contains_forbidden_key(child, forbidden_keys)
            if found:
                return found
    return None


def _assert_safe_resolve_payload(payload: Any) -> None:
    found = _contains_forbidden_key(payload, FORBIDDEN_RESPONSE_KEYS)
    assert found is None, f"forbidden key present: {found}"
    text = json.dumps(payload).lower()
    assert "source_block_id" not in text
    assert "sourceblockid" not in text
    for needle in ("traceback", "lightrag", "credential", "ciphertext"):
        assert needle not in text


def _add_block(
    settings: Settings,
    *,
    source_id: str,
    domain_id: str,
    block_id: str,
    page_start: int | None,
    markdown: str = "Bounded excerpt for resolve.",
) -> None:
    engine, db = _session(settings)
    try:
        source = db.get(SourceDocument, source_id)
        assert source is not None
        source.state = SOURCE_STATE_PREPARED
        db.add(
            SourceBlock(
                id=block_id,
                source_document_id=source_id,
                domain_id=domain_id,
                source_order=1,
                kind=SOURCE_BLOCK_KIND_TEXT,
                canonical_markdown=markdown,
                page_start=page_start,
                page_end=page_start,
                section_path="[]",
            )
        )
        db.commit()
    finally:
        db.close()
        engine.dispose()


def _seed_evidence_ref(
    settings: Settings,
    *,
    username: str,
    domain_id: str,
    source_id: str,
    block_id: str,
    source_label: str,
    redacted: bool = False,
) -> str:
    engine, db = _session(settings)
    try:
        from sqlalchemy import select
        from context_engine.models import User

        owner = db.scalar(select(User).where(User.username == username))
        assert owner is not None
        conversation = create_conversation(db, owner=owner, title="Resolve fixture")
        now = utc_now()
        turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id=f"resolve-{block_id}",
            domain_id=domain_id,
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="What does the source say?",
            assistant_answer="Grounded answer.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(turn)
        db.commit()
        ref = ConversationTurnEvidenceRef(
            turn_id=turn.id,
            evidence_order=1,
            source_document_id=source_id,
            source_block_id=block_id,
            citation_label=None if redacted else "[1]",
            source_label=None if redacted else source_label,
            excerpt=None if redacted else "Bounded excerpt for resolve.",
            redacted_at=now if redacted else None,
        )
        db.add(ref)
        db.commit()
        return ref.id
    finally:
        db.close()
        engine.dispose()


def _prepare_running_domain_with_sources(app, settings: Settings) -> dict[str, str]:
    pdf_bytes = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n"
    md_bytes = b"# Manual\nStartup sequence requires lockout."

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "manuals")
        pdf_id = _upload(
            client,
            domain_id="manuals",
            filename="manual.pdf",
            content=pdf_bytes,
            content_type="application/pdf",
        )
        md_id = _upload(
            client,
            domain_id="manuals",
            filename="notes.md",
            content=md_bytes,
            content_type="text/markdown",
        )
        no_page_pdf_id = _upload(
            client,
            domain_id="manuals",
            filename="scan.pdf",
            content=pdf_bytes + b"\n%%EOF-extra\n",
            content_type="application/pdf",
        )

    _add_block(settings, source_id=pdf_id, domain_id="manuals", block_id="block-pdf-page", page_start=12)
    _add_block(settings, source_id=md_id, domain_id="manuals", block_id="block-md", page_start=None)
    _add_block(
        settings,
        source_id=no_page_pdf_id,
        domain_id="manuals",
        block_id="block-pdf-no-page",
        page_start=None,
    )
    return {
        "pdf_source_id": pdf_id,
        "md_source_id": md_id,
        "no_page_pdf_source_id": no_page_pdf_id,
        "pdf_block_id": "block-pdf-page",
        "md_block_id": "block-md",
        "no_page_pdf_block_id": "block-pdf-no-page",
    }


def test_resolve_pdf_with_page_start_returns_navigation_dto(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-owner@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-owner@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-owner@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 200
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["domainId"] == "manuals"
    assert payload["sourceId"] == ids["pdf_source_id"]
    assert payload["page"] == 12
    assert payload.get("sourceLabel") == "manual.pdf"


def test_resolve_markdown_omits_or_nulls_page(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-md@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-md@example.test",
        domain_id="manuals",
        source_id=ids["md_source_id"],
        block_id=ids["md_block_id"],
        source_label="notes.md",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-md@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 200
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["domainId"] == "manuals"
    assert payload["sourceId"] == ids["md_source_id"]
    assert payload.get("page") in (None, )
    assert "page" not in payload or payload["page"] is None
    assert payload.get("sourceLabel") == "notes.md"


def test_resolve_missing_page_start_does_not_invent_page(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-no-page@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-no-page@example.test",
        domain_id="manuals",
        source_id=ids["no_page_pdf_source_id"],
        block_id=ids["no_page_pdf_block_id"],
        source_label="scan.pdf",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-no-page@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 200
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["sourceId"] == ids["no_page_pdf_source_id"]
    assert payload.get("page") is None


def test_resolve_redacted_evidence_is_unavailable(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-redacted@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-redacted@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
        redacted=True,
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-redacted@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 404
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["error"]["code"] == "source_ref_unavailable"
    assert "domainId" not in payload
    assert "sourceId" not in payload
    assert "page" not in payload


def test_resolve_deleted_source_is_unavailable(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-deleted@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-deleted@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
    )

    engine, db = _session(settings)
    try:
        db.execute(delete(SourceBlock).where(SourceBlock.source_document_id == ids["pdf_source_id"]))
        db.execute(delete(SourceDocument).where(SourceDocument.id == ids["pdf_source_id"]))
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_member(client, "resolve-deleted@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 404
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["error"]["code"] == "source_ref_unavailable"
    assert "sourceId" not in payload
    assert ids["pdf_source_id"] not in response.text


def test_resolve_other_users_evidence_is_unavailable_without_leak(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-owner-a@example.test")
    _create_member(settings, "resolve-intruder@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-owner-a@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-intruder@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 404
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert payload["error"]["code"] == "source_ref_unavailable"
    assert "sourceId" not in payload
    assert "domainId" not in payload
    assert ids["pdf_source_id"] not in response.text
    assert evidence_ref_id not in json.dumps(payload.get("error", {}))


def test_resolve_response_never_exposes_private_fields(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-safety@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-safety@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-safety@example.test")
        response = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert response.status_code == 200
    payload = response.json()
    _assert_safe_resolve_payload(payload)
    assert ids["pdf_block_id"] not in response.text
    assert "source-storage" not in response.text.lower()
    assert "http://" not in response.text.lower()
    assert "https://" not in response.text.lower()
    assert set(payload.keys()) <= {"domainId", "sourceId", "page", "sourceLabel"}


def test_resolve_same_evidence_twice_succeeds_independently(app, settings: Settings) -> None:
    ids = _prepare_running_domain_with_sources(app, settings)
    _create_member(settings, "resolve-concurrent@example.test")
    evidence_ref_id = _seed_evidence_ref(
        settings,
        username="resolve-concurrent@example.test",
        domain_id="manuals",
        source_id=ids["pdf_source_id"],
        block_id=ids["pdf_block_id"],
        source_label="manual.pdf",
    )

    with TestClient(app) as client:
        _login_member(client, "resolve-concurrent@example.test")
        first = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))
        second = client.get(RESOLVE_PATH.format(evidence_ref_id=evidence_ref_id))

    assert first.status_code == 200
    assert second.status_code == 200
    assert first.json() == second.json()
    _assert_safe_resolve_payload(first.json())
    _assert_safe_resolve_payload(second.json())


def test_resolve_requires_authentication(app, settings: Settings) -> None:
    with TestClient(app) as client:
        response = client.get(RESOLVE_PATH.format(evidence_ref_id="00000000-0000-0000-0000-000000000001"))

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "unauthenticated"
