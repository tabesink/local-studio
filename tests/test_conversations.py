from __future__ import annotations

from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect
from sqlalchemy.orm import Session

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    ROLE_MEMBER,
    TURN_ROUTE_DIRECT_LLM,
    TURN_ROUTE_DOMAIN_RAG,
    TURN_STATUS_COMPLETED,
    TURN_STATUS_FAILED,
    TURN_STATUS_REDACTED,
    TURN_STOP_REASON_EVIDENCE_ONLY,
    TURN_STOP_REASON_GROUNDED,
    TURN_STOP_REASON_PROVIDER_FAILURE,
    TURN_STOP_REASON_REDACTED,
    Conversation,
    ConversationTurn,
    ConversationTurnEvidenceRef,
)
from context_engine.services.auth import create_user
from context_engine.services.chat_turns import ChatTurnError, claim_turn, safe_turn_summary
from context_engine.services.conversations import create_conversation
from tests.conftest import run_migrations


def test_fresh_migration_creates_conversation_tables_with_required_constraints(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        conversation_columns = {column["name"] for column in inspector.get_columns("conversations")}
        turn_columns = {column["name"] for column in inspector.get_columns("conversation_turns")}
        evidence_columns = {column["name"] for column in inspector.get_columns("conversation_turn_evidence_refs")}
        turn_indexes = {index["name"] for index in inspector.get_indexes("conversation_turns")}
        turn_uniques = {constraint["name"] for constraint in inspector.get_unique_constraints("conversation_turns")}
        evidence_indexes = {index["name"] for index in inspector.get_indexes("conversation_turn_evidence_refs")}
        evidence_uniques = {
            constraint["name"] for constraint in inspector.get_unique_constraints("conversation_turn_evidence_refs")
        }
    finally:
        engine.dispose()

    assert {
        "conversations",
        "conversation_turns",
        "conversation_turn_evidence_refs",
    }.issubset(tables)
    assert {"id", "owner_user_id", "title", "created_at", "updated_at"}.issubset(conversation_columns)
    assert {
        "id",
        "conversation_id",
        "client_request_id",
        "domain_id",
        "route",
        "status",
        "stop_reason",
        "user_message",
        "assistant_answer",
        "safe_error_code",
        "safe_error_message",
        "plan_step_count",
        "retrieval_operation_count",
        "repair_attempt_count",
        "created_at",
        "started_at",
        "completed_at",
        "updated_at",
    }.issubset(turn_columns)
    assert {
        "id",
        "turn_id",
        "evidence_order",
        "source_document_id",
        "source_block_id",
        "citation_label",
        "source_label",
        "excerpt",
        "redacted_at",
        "created_at",
    }.issubset(evidence_columns)
    assert "uq_conversation_turns_client_request" in turn_uniques
    assert "uq_conversation_turns_one_running" in turn_indexes
    assert "uq_conversation_turn_evidence_refs_order" in evidence_uniques
    assert "uq_conversation_turn_evidence_refs_citation_label" in evidence_indexes
    assert not {
        "raw_prompt",
        "raw_answer",
        "provider_payload",
        "runtime_url",
        "path",
        "stack_trace",
    }.intersection(turn_columns | evidence_columns)


def _create_member(settings: Settings, username: str, password: str = "member-password") -> None:
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        create_user(db, username, password, role=ROLE_MEMBER)
    finally:
        db.close()
        engine.dispose()


def _login(client: TestClient, username: str, password: str = "member-password") -> None:
    response = client.post("/api/v1/auth/login", json={"username": username, "password": password})
    assert response.status_code == 200


def _contains_key(value: Any, forbidden_key: str) -> bool:
    if isinstance(value, dict):
        return any(key == forbidden_key or _contains_key(child, forbidden_key) for key, child in value.items())
    if isinstance(value, list):
        return any(_contains_key(child, forbidden_key) for child in value)
    return False


def test_conversation_crud_is_owner_scoped(app, settings: Settings) -> None:
    _create_member(settings, "alice@example.test")
    _create_member(settings, "bob@example.test")

    with TestClient(app) as client:
        _login(client, "alice@example.test")
        created = client.post("/api/v1/conversations", json={"title": "  Manual startup  "})
        assert created.status_code == 201
        created_body = created.json()
        conversation = created_body["conversation"]
        conversation_id = conversation["id"]
        assert conversation["title"] == "Manual startup"
        assert "createdAt" in conversation
        assert "updatedAt" in conversation
        assert not _contains_key(created_body, "ownerUserId")

        listed = client.get("/api/v1/conversations")
        assert listed.status_code == 200
        assert [item["id"] for item in listed.json()["conversations"]] == [conversation_id]

        detail = client.get(f"/api/v1/conversations/{conversation_id}")
        assert detail.status_code == 200
        assert detail.json()["conversation"]["id"] == conversation_id
        assert detail.json()["turns"] == []

        patched = client.patch(f"/api/v1/conversations/{conversation_id}", json={"title": " Updated title "})
        assert patched.status_code == 200
        assert patched.json()["conversation"]["title"] == "Updated title"

        cleared = client.patch(f"/api/v1/conversations/{conversation_id}", json={"title": "   "})
        assert cleared.status_code == 200
        assert cleared.json()["conversation"]["title"] is None

    with TestClient(app) as client:
        _login(client, "bob@example.test")
        for method, kwargs in (
            (client.get, {}),
            (client.patch, {"json": {"title": "Nope"}}),
            (client.delete, {}),
        ):
            response = method(f"/api/v1/conversations/{conversation_id}", **kwargs)
            assert response.status_code == 404
            assert response.json()["error"]["code"] == "conversation_not_found"
        assert client.get("/api/v1/conversations").json() == {"conversations": []}

    with TestClient(app) as client:
        _login(client, "alice@example.test")
        deleted = client.delete(f"/api/v1/conversations/{conversation_id}")
        assert deleted.status_code == 204
        assert client.get(f"/api/v1/conversations/{conversation_id}").status_code == 404


def test_conversation_title_validation_and_omitted_body(app, settings: Settings) -> None:
    with TestClient(app) as client:
        login = client.post(
            "/api/v1/auth/login",
            json={"username": settings.admin_username, "password": settings.admin_password},
        )
        assert login.status_code == 200

        omitted = client.post("/api/v1/conversations")
        assert omitted.status_code == 201
        assert omitted.json()["conversation"]["title"] is None

        empty_object = client.post("/api/v1/conversations", json={})
        assert empty_object.status_code == 201
        assert empty_object.json()["conversation"]["title"] is None

        unknown = client.post("/api/v1/conversations", json={"title": "Manual", "route": "direct_llm"})
        assert unknown.status_code == 422
        assert unknown.json()["error"]["code"] == "validation_error"

        too_long = client.post("/api/v1/conversations", json={"title": "x" * 121})
        assert too_long.status_code == 422
        assert too_long.json()["error"]["code"] == "validation_error"

        control_character = client.post("/api/v1/conversations", json={"title": "bad\u0000title"})
        assert control_character.status_code == 422
        assert control_character.json()["error"]["code"] == "validation_error"

    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        titles = [conversation.title for conversation in db.query(Conversation).order_by(Conversation.created_at).all()]
    finally:
        db.close()
        engine.dispose()
    assert titles[:2] == [None, None]


def test_chat_turn_claim_creates_running_turn_and_blocks_second_running(db_session: Session) -> None:
    owner = create_user(db_session, "turn-owner@example.test", "password", role=ROLE_MEMBER)
    other = create_user(db_session, "turn-other@example.test", "password", role=ROLE_MEMBER)
    conversation = create_conversation(db_session, owner=owner, title="Turns")

    claimed = claim_turn(
        db_session,
        owner=owner,
        conversation_id=conversation.id,
        client_request_id="req-0001",
        message="  Hello there  ",
        route=TURN_ROUTE_DIRECT_LLM,
        domain_id=None,
    )

    assert claimed.replay is False
    assert claimed.turn.status == "running"
    assert claimed.turn.user_message == "Hello there"
    assert claimed.turn.started_at is not None

    for client_request_id in ("req-0001", "req-0002"):
        try:
            claim_turn(
                db_session,
                owner=owner,
                conversation_id=conversation.id,
                client_request_id=client_request_id,
                message="Hello there",
                route=TURN_ROUTE_DIRECT_LLM,
                domain_id=None,
            )
        except ChatTurnError as exc:
            assert exc.status_code == 409
            assert exc.code == "conversation_turn_in_progress"
        else:  # pragma: no cover - makes the assertion intent clear if the service regresses
            raise AssertionError("running turn was not rejected")

    try:
        claim_turn(
            db_session,
            owner=other,
            conversation_id=conversation.id,
            client_request_id="req-0003",
            message="Hello there",
            route=TURN_ROUTE_DIRECT_LLM,
            domain_id=None,
        )
    except Exception as exc:
        assert getattr(exc, "status_code") == 404
        assert getattr(exc, "code") == "conversation_not_found"
    else:  # pragma: no cover
        raise AssertionError("cross-user turn claim was not rejected")


def test_chat_turn_duplicate_terminal_requests_replay_and_conflicts(db_session: Session) -> None:
    owner = create_user(db_session, "turn-replay@example.test", "password", role=ROLE_MEMBER)
    conversation = create_conversation(db_session, owner=owner, title="Replay")
    now = utc_now()
    completed = ConversationTurn(
        conversation_id=conversation.id,
        client_request_id="req-replay",
        domain_id="manuals",
        route=TURN_ROUTE_DOMAIN_RAG,
        status=TURN_STATUS_COMPLETED,
        stop_reason=TURN_STOP_REASON_GROUNDED,
        user_message="What does the manual say?",
        assistant_answer="Use the approved sequence.",
        started_at=now,
        completed_at=now,
        created_at=now,
        updated_at=now,
    )
    db_session.add(completed)
    db_session.commit()

    replay = claim_turn(
        db_session,
        owner=owner,
        conversation_id=conversation.id,
        client_request_id="req-replay",
        message="What does the manual say?",
        route=TURN_ROUTE_DOMAIN_RAG,
        domain_id="manuals",
    )

    assert replay.replay is True
    assert replay.turn.id == completed.id

    conflict_cases = [
        {"message": "Changed question", "route": TURN_ROUTE_DOMAIN_RAG, "domain_id": "manuals"},
        {"message": "What does the manual say?", "route": TURN_ROUTE_DOMAIN_RAG, "domain_id": "other"},
        {"message": "What does the manual say?", "route": TURN_ROUTE_DIRECT_LLM, "domain_id": None},
    ]
    for case in conflict_cases:
        try:
            claim_turn(
                db_session,
                owner=owner,
                conversation_id=conversation.id,
                client_request_id="req-replay",
                **case,
            )
        except ChatTurnError as exc:
            assert exc.status_code == 409
            assert exc.code == "client_request_conflict"
        else:  # pragma: no cover
            raise AssertionError("conflicting duplicate turn was not rejected")


def test_chat_turn_request_validation_happens_before_claim(db_session: Session) -> None:
    owner = create_user(db_session, "turn-validation@example.test", "password", role=ROLE_MEMBER)
    conversation = create_conversation(db_session, owner=owner, title="Validation")

    invalid_cases = [
        {"client_request_id": "short", "message": "Hello", "route": TURN_ROUTE_DIRECT_LLM, "domain_id": None},
        {"client_request_id": "bad id", "message": "Hello", "route": TURN_ROUTE_DIRECT_LLM, "domain_id": None},
        {"client_request_id": "req-valid-1", "message": "   ", "route": TURN_ROUTE_DIRECT_LLM, "domain_id": None},
        {"client_request_id": "req-valid-2", "message": "Hello", "route": TURN_ROUTE_DIRECT_LLM, "domain_id": "manuals"},
    ]
    for case in invalid_cases:
        try:
            claim_turn(db_session, owner=owner, conversation_id=conversation.id, **case)
        except ChatTurnError as exc:
            assert exc.status_code == 422
            assert exc.code == "validation_error"
        else:  # pragma: no cover
            raise AssertionError("invalid turn request was not rejected")

    try:
        claim_turn(
            db_session,
            owner=owner,
            conversation_id=conversation.id,
            client_request_id="req-valid-3",
            message="What does the manual say?",
            route=TURN_ROUTE_DOMAIN_RAG,
            domain_id=None,
        )
    except ChatTurnError as exc:
        assert exc.status_code == 422
        assert exc.code == "domain_required"
    else:  # pragma: no cover
        raise AssertionError("domain_rag without a domain was not rejected")

    assert db_session.query(ConversationTurn).filter_by(conversation_id=conversation.id).count() == 0


def test_safe_turn_summary_and_conversation_detail_use_persisted_safe_fields(app, settings: Settings) -> None:
    _create_member(settings, "summary-owner@example.test")
    with TestClient(app) as client:
        _login(client, "summary-owner@example.test")
        created = client.post("/api/v1/conversations", json={"title": "Summary"})
        assert created.status_code == 201
        conversation_id = created.json()["conversation"]["id"]

    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        now = utc_now()
        grounded = ConversationTurn(
            conversation_id=conversation_id,
            client_request_id="req-grounded",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="What does the manual say?",
            assistant_answer="Use the approved sequence.",
            plan_step_count=1,
            retrieval_operation_count=1,
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        evidence_only = ConversationTurn(
            conversation_id=conversation_id,
            client_request_id="req-evidence-only",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_EVIDENCE_ONLY,
            user_message="Find evidence.",
            assistant_answer="This must not be public.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        failed = ConversationTurn(
            conversation_id=conversation_id,
            client_request_id="req-failed",
            domain_id=None,
            route=TURN_ROUTE_DIRECT_LLM,
            status=TURN_STATUS_FAILED,
            stop_reason=TURN_STOP_REASON_PROVIDER_FAILURE,
            user_message="Hello",
            assistant_answer="This must not be public.",
            safe_error_code="provider_failure",
            safe_error_message="The answer could not be completed.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        redacted = ConversationTurn(
            conversation_id=conversation_id,
            client_request_id="req-redacted",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_REDACTED,
            stop_reason=TURN_STOP_REASON_REDACTED,
            user_message="Keep my question.",
            assistant_answer=None,
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add_all([grounded, evidence_only, failed, redacted])
        db.commit()
        db.add_all(
            [
                ConversationTurnEvidenceRef(
                    turn_id=grounded.id,
                    evidence_order=1,
                    source_document_id="source-private",
                    source_block_id="block-private",
                    citation_label="[1]",
                    source_label="manual.md",
                    excerpt="Bounded excerpt.",
                ),
                ConversationTurnEvidenceRef(
                    turn_id=grounded.id,
                    evidence_order=2,
                    source_document_id="source-redacted",
                    source_block_id="block-redacted",
                    citation_label=None,
                    source_label=None,
                    excerpt=None,
                    redacted_at=now,
                ),
                ConversationTurnEvidenceRef(
                    turn_id=redacted.id,
                    evidence_order=1,
                    source_document_id="source-redacted-turn",
                    source_block_id="block-redacted-turn",
                    citation_label=None,
                    source_label=None,
                    excerpt=None,
                    redacted_at=now,
                ),
            ]
        )
        db.commit()
        db.refresh(grounded)
        summary = safe_turn_summary(grounded)
    finally:
        db.close()
        engine.dispose()

    assert summary["assistantAnswer"] == "Use the approved sequence."
    assert summary["evidence"] == [
        {
            "id": summary["evidence"][0]["id"],
            "citationLabel": "[1]",
            "sourceLabel": "manual.md",
            "excerpt": "Bounded excerpt.",
        }
    ]
    assert summary["citations"] == [{"evidenceRefId": summary["evidence"][0]["id"], "citationLabel": "[1]"}]

    with TestClient(app) as client:
        _login(client, "summary-owner@example.test")
        detail = client.get(f"/api/v1/conversations/{conversation_id}")
        assert detail.status_code == 200
        body = detail.json()

    serialized = str(body)
    assert "source-private" not in serialized
    assert "block-private" not in serialized
    turns = {turn["clientRequestId"]: turn for turn in body["turns"]}
    assert turns["req-grounded"]["assistantAnswer"] == "Use the approved sequence."
    assert len(turns["req-grounded"]["evidence"]) == 1
    assert turns["req-evidence-only"]["assistantAnswer"] is None
    assert turns["req-failed"]["assistantAnswer"] is None
    assert turns["req-failed"]["safeError"] == {
        "code": "provider_failure",
        "message": "The answer could not be completed.",
    }
    assert turns["req-redacted"]["userMessage"] == "Keep my question."
    assert turns["req-redacted"]["assistantAnswer"] is None
    assert turns["req-redacted"]["evidence"] == []
    assert turns["req-redacted"]["citations"] == []
