from __future__ import annotations
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    DOMAIN_STATE_STOPPED,
    PARSER_DOCLING,
    AUDIT_EVENT_WIKI_CONTRIBUTION_PUBLISHED,
    ROLE_MEMBER,
    SOURCE_BLOCK_KIND_TEXT,
    SOURCE_INDEX_STATE_NOT_REQUESTED,
    SOURCE_STATE_PREPARED,
    TURN_ROUTE_DOMAIN_RAG,
    TURN_STATUS_COMPLETED,
    TURN_STOP_REASON_GROUNDED,
    WIKI_CONTRIBUTION_STATE_BLOCKED,
    WIKI_PAGE_STATE_NEEDS_REVIEW,
    ConversationTurn,
    ConversationTurnEvidenceRef,
    Domain,
    SourceBlock,
    SourceDocument,
    WikiContribution,
    WikiPage,
    WikiRevision,
)
from context_engine.services.audit import AuditError, AuditService
from context_engine.services.auth import create_user
from context_engine.services.conversations import create_conversation
from context_engine.services.runtime_config import seed_runtime_config
from tests.conftest import run_migrations


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _create_member(settings: Settings, username: str, password: str = "member-password") -> None:
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        create_user(db, username, password, role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()


def _login_member(client: TestClient, username: str, password: str = "member-password") -> None:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200


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


def _add_completed_grounded_turn(settings: Settings, username: str) -> str:
    engine, db = _session(settings)
    try:
        user = create_user(db, username, "member-password", role=ROLE_MEMBER)
        conversation = create_conversation(db, owner=user, title="Evidence")
        now = utc_now()
        turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id="wiki-evidence-0001",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="What should the wiki say?",
            assistant_answer="Use the approved startup sequence.",
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
            source_document_id="source-wiki",
            source_block_id="block-wiki",
            citation_label="[1]",
            source_label="manual.md",
            excerpt="Approved startup sequence.",
        )
        db.add(ref)
        db.commit()
        return ref.id
    finally:
        db.close()
        engine.dispose()


def _create_prepared_source_with_evidence(settings: Settings, username: str) -> tuple[str, str]:
    engine, db = _session(settings)
    try:
        seed_runtime_config(db)
        user = create_user(db, username, "member-password", role=ROLE_MEMBER)
        domain = Domain(
            id="manuals",
            display_name="manuals",
            state=DOMAIN_STATE_STOPPED,
            embedding_profile_id="openai-embedding-default",
        )
        source = SourceDocument(
            id="source-wiki-delete",
            domain_id="manuals",
            original_filename="manual.md",
            content_type="text/markdown",
            original_sha256="b" * 64,
            original_size_bytes=20,
            state=SOURCE_STATE_PREPARED,
            parser_kind=PARSER_DOCLING,
            preparation_generation=1,
            index_state=SOURCE_INDEX_STATE_NOT_REQUESTED,
            index_generation=0,
            created_by_user_id=user.id,
        )
        block = SourceBlock(
            id="block-wiki-delete",
            source_document_id=source.id,
            domain_id="manuals",
            source_order=1,
            kind=SOURCE_BLOCK_KIND_TEXT,
            canonical_markdown="Approved startup sequence.",
            section_path="Manual",
        )
        conversation = create_conversation(db, owner=user, title="Evidence")
        now = utc_now()
        turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id="wiki-delete-0001",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="What should the wiki say?",
            assistant_answer="Use the approved startup sequence.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add_all([domain, source, block, turn])
        db.commit()
        ref = ConversationTurnEvidenceRef(
            turn_id=turn.id,
            evidence_order=1,
            source_document_id=source.id,
            source_block_id=block.id,
            citation_label="[1]",
            source_label="manual.md",
            excerpt="Approved startup sequence.",
        )
        db.add(ref)
        db.commit()
        return source.id, ref.id
    finally:
        db.close()
        engine.dispose()


def test_fresh_migration_adds_wiki_curation_tables(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        page_columns = {column["name"] for column in inspector.get_columns("wiki_pages")}
        contribution_columns = {column["name"] for column in inspector.get_columns("wiki_contributions")}
        revision_columns = {column["name"] for column in inspector.get_columns("wiki_revisions")}
        contribution_ref_columns = {column["name"] for column in inspector.get_columns("wiki_contribution_evidence_refs")}
        contribution_ref_indexes = {index["name"] for index in inspector.get_indexes("wiki_contribution_evidence_refs")}
    finally:
        engine.dispose()

    assert {"wiki_pages", "wiki_revisions", "wiki_contributions", "wiki_contribution_evidence_refs"}.issubset(tables)
    assert {"id", "title", "state", "current_revision_id", "created_at", "updated_at"}.issubset(page_columns)
    assert {
        "id",
        "target_wiki_page_id",
        "created_by_user_id",
        "reviewed_by_user_id",
        "title",
        "body",
        "state",
        "reviewer_note",
        "submitted_at",
        "reviewed_at",
        "created_at",
        "updated_at",
    }.issubset(contribution_columns)
    assert {
        "id",
        "wiki_page_id",
        "revision_number",
        "title",
        "body",
        "published_from_contribution_id",
        "published_by_user_id",
        "created_at",
    }.issubset(revision_columns)
    assert {
        "id",
        "wiki_contribution_id",
        "conversation_turn_evidence_ref_id",
        "ref_order",
        "citation_label",
        "source_label",
        "state",
        "invalidated_at",
        "created_at",
    }.issubset(contribution_ref_columns)
    assert "uq_wiki_contribution_evidence_refs_conversation_ref" in contribution_ref_indexes
    assert not {"raw_prompt", "raw_answer", "provider_payload", "runtime_url", "path", "stack_trace"}.intersection(
        page_columns | contribution_columns | revision_columns | contribution_ref_columns
    )


def test_member_can_create_update_submit_and_admin_can_publish_once(app, settings: Settings) -> None:
    evidence_ref_id = _add_completed_grounded_turn(settings, "wiki-owner@example.test")

    with TestClient(app) as client:
        _login_member(client, "wiki-owner@example.test")
        created = client.post(
            "/api/v1/wiki/contributions",
            json={
                "title": " Startup sequence ",
                "body": " Draft startup sequence. ",
                "evidenceRefIds": [evidence_ref_id],
            },
        )
        contribution_id = created.json()["contribution"]["id"]
        patched = client.patch(
            f"/api/v1/wiki/contributions/{contribution_id}",
            json={"body": "Updated startup sequence."},
        )
        submitted = client.post(f"/api/v1/wiki/contributions/{contribution_id}:submit")
        locked_patch = client.patch(
            f"/api/v1/wiki/contributions/{contribution_id}",
            json={"body": "Should not update after submit."},
        )
        duplicate_submit = client.post(f"/api/v1/wiki/contributions/{contribution_id}:submit")
        listed = client.get("/api/v1/wiki/contributions")

    assert created.status_code == 201
    assert created.json()["contribution"]["title"] == "Startup sequence"
    assert created.json()["contribution"]["publishedPageId"] is None
    assert created.json()["contribution"]["publishedRevisionId"] is None
    created_refs = created.json()["contribution"]["evidenceRefs"]
    assert len(created_refs) == 1
    assert created_refs[0]["id"]
    assert {key: value for key, value in created_refs[0].items() if key != "id"} == {
        "evidenceRefId": evidence_ref_id,
        "citationLabel": "[1]",
        "sourceLabel": "manual.md",
        "state": "active",
    }
    assert not _contains(created.json(), "Approved startup sequence.")
    assert patched.status_code == 200
    assert patched.json()["contribution"]["body"] == "Updated startup sequence."
    assert submitted.status_code == 200
    assert submitted.json()["contribution"]["state"] == "submitted"
    assert locked_patch.status_code == 409
    assert locked_patch.json()["error"]["code"] == "wiki_contribution_state_conflict"
    assert duplicate_submit.status_code == 409
    assert duplicate_submit.json()["error"]["code"] == "wiki_contribution_state_conflict"
    assert [item["id"] for item in listed.json()["contributions"]] == [contribution_id]

    with TestClient(app) as client:
        _login_admin(client, settings)
        admin_list = client.get("/api/v1/admin/wiki/contributions")
        published = client.post(f"/api/v1/admin/wiki/contributions/{contribution_id}:publish")
        replay = client.post(f"/api/v1/admin/wiki/contributions/{contribution_id}:publish")
        page_id = published.json()["page"]["id"]
        page = client.get(f"/api/v1/wiki/pages/{page_id}")
        revisions = client.get(f"/api/v1/wiki/pages/{page_id}/revisions")

    assert admin_list.status_code == 200
    assert [item["id"] for item in admin_list.json()["contributions"]] == [contribution_id]
    assert published.status_code == 200
    assert published.json()["revision"]["revisionNumber"] == 1
    assert published.json()["revision"]["wikiPageId"] == published.json()["page"]["id"]
    assert published.json()["revision"]["publishedAt"] is not None
    assert published.json()["contribution"]["publishedPageId"] == published.json()["page"]["id"]
    assert published.json()["contribution"]["publishedRevisionId"] == published.json()["revision"]["id"]
    assert replay.status_code == 200
    assert replay.json()["revision"]["id"] == published.json()["revision"]["id"]
    assert page.status_code == 200
    assert page.json()["currentRevision"]["body"] == "Updated startup sequence."
    assert revisions.status_code == 200
    assert [revision["id"] for revision in revisions.json()["revisions"]] == [published.json()["revision"]["id"]]

    engine, db = _session(settings)
    try:
        assert db.query(WikiRevision).count() == 1
        audit_event = db.scalar(select(WikiContribution).where(WikiContribution.id == contribution_id))
        assert audit_event is not None
        event_count = db.execute(
            select(WikiContribution.id).where(WikiContribution.state == "published")
        ).all()
        assert len(event_count) == 1
    finally:
        db.close()
        engine.dispose()


def test_members_cannot_review_and_admins_cannot_read_private_drafts(app, settings: Settings) -> None:
    _create_member(settings, "wiki-member@example.test")
    with TestClient(app) as client:
        _login_member(client, "wiki-member@example.test")
        created = client.post("/api/v1/wiki/contributions", json={"title": "Draft", "body": "Private draft."})
        contribution_id = created.json()["contribution"]["id"]
        denied = client.post(f"/api/v1/admin/wiki/contributions/{contribution_id}:publish")

    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "forbidden"

    with TestClient(app) as client:
        _login_admin(client, settings)
        admin_detail = client.get(f"/api/v1/admin/wiki/contributions/{contribution_id}")
        admin_list = client.get("/api/v1/admin/wiki/contributions")

    assert admin_detail.status_code == 404
    assert admin_detail.json()["error"]["code"] == "wiki_contribution_not_found"
    assert admin_list.status_code == 200
    assert admin_list.json()["contributions"] == []


def test_reject_and_evidence_ref_failures_are_safe(app, settings: Settings) -> None:
    owner_ref_id = _add_completed_grounded_turn(settings, "wiki-evidence-owner@example.test")
    other_ref_id = _add_completed_grounded_turn(settings, "wiki-evidence-other@example.test")

    engine, db = _session(settings)
    try:
        redacted_ref = db.get(ConversationTurnEvidenceRef, owner_ref_id)
        assert redacted_ref is not None
        redacted_ref.redacted_at = utc_now()
        redacted_ref.citation_label = None
        redacted_ref.source_label = None
        redacted_ref.excerpt = None
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_member(client, "wiki-evidence-owner@example.test")
        missing = client.post(
            "/api/v1/wiki/contributions",
            json={"title": "Missing ref", "body": "Body.", "evidenceRefIds": ["missing-evidence-ref"]},
        )
        unauthorized = client.post(
            "/api/v1/wiki/contributions",
            json={"title": "Other ref", "body": "Body.", "evidenceRefIds": [other_ref_id]},
        )
        redacted = client.post(
            "/api/v1/wiki/contributions",
            json={"title": "Redacted ref", "body": "Body.", "evidenceRefIds": [owner_ref_id]},
        )
        draft = client.post("/api/v1/wiki/contributions", json={"title": "Reject me", "body": "Body."})
        contribution_id = draft.json()["contribution"]["id"]
        submit = client.post(f"/api/v1/wiki/contributions/{contribution_id}:submit")

    assert missing.status_code == 409
    assert missing.json()["error"]["code"] == "wiki_contribution_context_unavailable"
    assert unauthorized.status_code == 409
    assert unauthorized.json()["error"]["code"] == "wiki_contribution_context_unavailable"
    assert redacted.status_code == 409
    assert redacted.json()["error"]["code"] == "wiki_contribution_context_unavailable"
    assert submit.status_code == 200

    with TestClient(app) as client:
        _login_member(client, "wiki-evidence-other@example.test")
        other_read = client.get(f"/api/v1/wiki/contributions/{contribution_id}")

    assert other_read.status_code == 404
    assert other_read.json()["error"]["code"] == "wiki_contribution_not_found"

    with TestClient(app) as client:
        _login_admin(client, settings)
        rejected = client.post(
            f"/api/v1/admin/wiki/contributions/{contribution_id}:reject",
            json={"reviewerNote": "Needs more detail."},
        )

    assert rejected.status_code == 200
    assert rejected.json()["contribution"]["state"] == "rejected"
    assert rejected.json()["contribution"]["reviewerNote"] == "Needs more detail."

    engine, db = _session(settings)
    try:
        assert db.query(WikiRevision).filter_by(published_from_contribution_id=contribution_id).count() == 0
    finally:
        db.close()
        engine.dispose()


def test_publish_rolls_back_when_audit_is_unavailable(app, settings: Settings, monkeypatch) -> None:
    _create_member(settings, "wiki-audit-rollback@example.test")
    with TestClient(app) as client:
        _login_member(client, "wiki-audit-rollback@example.test")
        draft = client.post("/api/v1/wiki/contributions", json={"title": "Rollback", "body": "Body."})
        contribution_id = draft.json()["contribution"]["id"]
        submitted = client.post(f"/api/v1/wiki/contributions/{contribution_id}:submit")
        assert submitted.status_code == 200

    original_record = AuditService.record

    def fail_publish_audit(self, event_name, *args, **kwargs):
        if event_name == AUDIT_EVENT_WIKI_CONTRIBUTION_PUBLISHED:
            raise AuditError()
        return original_record(self, event_name, *args, **kwargs)

    monkeypatch.setattr(AuditService, "record", fail_publish_audit)

    with TestClient(app) as client:
        _login_admin(client, settings)
        failed = client.post(f"/api/v1/admin/wiki/contributions/{contribution_id}:publish")

    assert failed.status_code == 503
    assert failed.json()["error"]["code"] == "audit_unavailable"

    engine, db = _session(settings)
    try:
        contribution = db.get(WikiContribution, contribution_id)
        assert contribution is not None
        assert contribution.state == "submitted"
        assert db.query(WikiRevision).filter_by(published_from_contribution_id=contribution_id).count() == 0
        assert db.query(WikiPage).count() == 0
    finally:
        db.close()
        engine.dispose()


def test_redacted_evidence_blocks_draft_and_hides_invalidated_page(app, settings: Settings) -> None:
    source_id, draft_ref_id = _create_prepared_source_with_evidence(settings, "wiki-redact-draft@example.test")
    published_ref_id = _add_completed_grounded_turn(settings, "wiki-redact-published@example.test")

    with TestClient(app) as client:
        _login_member(client, "wiki-redact-draft@example.test")
        draft = client.post(
            "/api/v1/wiki/contributions",
            json={"title": "Draft redaction", "body": "Draft.", "evidenceRefIds": [draft_ref_id]},
        )
        draft_id = draft.json()["contribution"]["id"]

    with TestClient(app) as client:
        _login_member(client, "wiki-redact-published@example.test")
        contribution = client.post(
            "/api/v1/wiki/contributions",
            json={"title": "Published redaction", "body": "Published.", "evidenceRefIds": [published_ref_id]},
        )
        contribution_id = contribution.json()["contribution"]["id"]
        submit = client.post(f"/api/v1/wiki/contributions/{contribution_id}:submit")
        assert submit.status_code == 200

    with TestClient(app) as client:
        _login_admin(client, settings)
        published = client.post(f"/api/v1/admin/wiki/contributions/{contribution_id}:publish")
        page_id = published.json()["page"]["id"]

    engine, db = _session(settings)
    try:
        published_evidence_ref = db.get(ConversationTurnEvidenceRef, published_ref_id)
        assert published_evidence_ref is not None
        published_evidence_ref.source_document_id = source_id
        published_evidence_ref.source_block_id = "block-wiki-delete"
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        deleted = client.delete(f"/api/v1/admin/domains/manuals/sources/{source_id}")

    assert deleted.status_code == 204

    engine, db = _session(settings)
    try:
        draft_contribution = db.get(WikiContribution, draft_id)
        page = db.get(WikiPage, page_id)
        assert draft_contribution is not None
        assert page is not None
        assert draft_contribution.state == WIKI_CONTRIBUTION_STATE_BLOCKED
        assert page.state == WIKI_PAGE_STATE_NEEDS_REVIEW
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_member(client, "wiki-redact-published@example.test")
        hidden = client.get(f"/api/v1/wiki/pages/{page_id}")

    assert hidden.status_code == 404
    assert hidden.json()["error"]["code"] == "wiki_page_not_found"
