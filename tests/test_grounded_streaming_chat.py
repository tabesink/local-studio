from __future__ import annotations

import json
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import select

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import (
    ROLE_MEMBER,
    TURN_ROUTE_DOMAIN_RAG,
    TURN_STATUS_COMPLETED,
    TURN_STATUS_REDACTED,
    TURN_STATUS_RUNNING,
    TURN_STOP_REASON_GROUNDED,
    TURN_STOP_REASON_REDACTED,
    ConversationTurn,
    ConversationTurnEvidenceRef,
    Domain,
    SourceBlock,
    SourceDocument,
    User,
)
from context_engine.services.auth import create_user
from context_engine.services.chat_turns import (
    P6RetrievalPort,
    PublicEvidenceRef,
    ChatTurnError,
    SynthesisProviderError,
    SynthesisStreamAdapter,
    _complete_turn,
    intent_for_operation,
    redact_turns_for_domain,
    stream_turn_events,
)
from context_engine.services.conversations import create_conversation
from context_engine.services.domains import DomainDeleteWorker, LocalDomainRuntimeController
from context_engine.services.evidence import InternalMappedEvidence
from context_engine.services.indexing import LocalLightRAGIndexClient, SourceIndexWorker, index_client_from_settings
from context_engine.services.sources import SourcePreparationWorker


class CountingSynthesisAdapter(SynthesisStreamAdapter):
    def __init__(
        self,
        *,
        direct_tokens: tuple[str, ...] = ("Direct ", "answer."),
        grounded_tokens: tuple[str, ...] = ("Grounded ", "answer."),
        fail_direct: bool = False,
        fail_grounded: bool = False,
    ) -> None:
        self.direct_tokens = direct_tokens
        self.grounded_tokens = grounded_tokens
        self.fail_direct = fail_direct
        self.fail_grounded = fail_grounded
        self.direct_calls = 0
        self.grounded_calls = 0
        self.direct_prior: tuple[str, ...] = ()
        self.grounded_prior: tuple[str, ...] = ()
        self.grounded_evidence: tuple[PublicEvidenceRef, ...] = ()

    def stream_direct(self, **kwargs) -> tuple[str, ...]:
        self.direct_calls += 1
        self.direct_prior = kwargs["prior_user_questions"]
        if self.fail_direct:
            raise SynthesisProviderError()
        return self.direct_tokens

    def stream_grounded(self, **kwargs) -> tuple[str, ...]:
        self.grounded_calls += 1
        self.grounded_prior = kwargs["prior_user_questions"]
        self.grounded_evidence = kwargs["evidence"]
        if self.fail_grounded:
            raise SynthesisProviderError()
        return self.grounded_tokens


class CountingRetrievalPort(P6RetrievalPort):
    def __init__(self, settings: Settings, evidence: list[InternalMappedEvidence]) -> None:
        super().__init__(controller=LocalDomainRuntimeController(settings))
        self.calls: list[tuple[str, str, str]] = []
        self._evidence = evidence

    def retrieve(self, db, *, settings: Settings, domain_id: str, question: str, intent: str):
        self.calls.append((domain_id, question, intent))
        return list(self._evidence)


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "chat-test-credential"})
    assert response.status_code == 200


def _create_domain(client: TestClient, domain_id: str = "manuals", *, start: bool = True) -> None:
    response = client.post(
        "/api/v1/admin/domains",
        json={
            "id": domain_id,
            "displayName": f"{domain_id.title()} Domain",
            "embeddingProfileId": "openai-embedding-default",
        },
    )
    assert response.status_code == 201
    if start:
        started = client.post(f"/api/v1/admin/domains/{domain_id}/start")
        assert started.status_code == 200


def _upload(
    client: TestClient,
    domain_id: str = "manuals",
    filename: str = "manual.md",
    content: bytes = b"# Manual\nThe startup sequence requires lockout and inspection.",
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


def _prepare_and_index_source(settings: Settings, source_id: str) -> str:
    engine, db = _session(settings)
    client = index_client_from_settings(settings)
    try:
        assert SourcePreparationWorker(settings).run_once(db) is True
        assert SourceIndexWorker(settings, client).run_once(db) is True
        assert SourceIndexWorker(settings, client).run_once(db) is True
        source = db.get(SourceDocument, source_id)
        assert source is not None
        assert source.index_request_id
        return source.index_request_id
    finally:
        db.close()
        engine.dispose()


def _setup_ready_domain(app, settings: Settings, domain_id: str = "manuals") -> tuple[str, str]:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, domain_id, start=True)
        uploaded = _upload(client, domain_id)
        assert uploaded.status_code == 201
        source_id = uploaded.json()["source"]["id"]
    request_id = _prepare_and_index_source(settings, source_id)
    return source_id, request_id


def _create_conversation(client: TestClient) -> str:
    created = client.post("/api/v1/conversations", json={"title": "Chat"})
    assert created.status_code == 201
    return created.json()["conversation"]["id"]


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


def _contains_forbidden_key(value: Any, forbidden_keys: set[str]) -> str | None:
    if isinstance(value, dict):
        for key, child in value.items():
            if str(key).lower() in forbidden_keys:
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


def test_direct_general_chat_streams_without_retrieval_or_citations(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter(direct_tokens=("Hello", " there."))
    app.state.synthesis_stream_adapter = adapter
    app.state.retrieval_port = CountingRetrievalPort(settings, [])

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation_id = _create_conversation(client)
        response = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "direct-0001", "message": "Hello"},
        )
        assert response.status_code == 200
        events = _sse_events(response)
        detail = client.get(f"/api/v1/conversations/{conversation_id}").json()

    assert [event for event, _ in events] == ["stage", "token", "token", "done"]
    assert events[-1][1]["route"] == "direct_llm"
    assert events[-1][1]["stopReason"] == "direct_llm"
    assert events[-1][1]["citations"] == []
    assert adapter.direct_calls == 1
    assert adapter.grounded_calls == 0
    assert app.state.retrieval_port.calls == []
    turn = detail["turns"][0]
    assert turn["domainId"] is None
    assert turn["assistantAnswer"] == "Hello there."
    assert turn["evidence"] == []
    assert turn["citations"] == []


def test_turn_stream_pre_stream_errors_are_json_and_do_not_claim(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation_id = _create_conversation(client)
        missing_domain = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "domain-0001", "message": "What startup sequence does the manual require?"},
        )
        unknown_domain = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={
                "clientRequestId": "domain-0002",
                "message": "What startup sequence does the manual require?",
                "domainId": "missing",
            },
        )
        forbidden = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "domain-0003", "message": "Hello", "route": "direct_llm"},
        )
        detail = client.get(f"/api/v1/conversations/{conversation_id}")

    assert missing_domain.status_code == 422
    assert missing_domain.json()["error"]["code"] == "domain_required"
    assert unknown_domain.status_code == 404
    assert unknown_domain.json()["error"]["code"] == "domain_not_found"
    assert forbidden.status_code == 422
    assert forbidden.json()["error"]["code"] == "validation_error"
    assert detail.json()["turns"] == []
    assert "text/event-stream" not in missing_domain.headers.get("content-type", "")


def test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter(grounded_tokens=("Use ", "lockout."))
    app.state.synthesis_stream_adapter = adapter
    source_id, _ = _setup_ready_domain(app, settings)

    with TestClient(app) as client:
        _login_admin(client, settings)
        conversation_id = _create_conversation(client)
        response = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={
                "clientRequestId": "grounded-0001",
                "message": "What startup sequence does the manual require?",
                "domainId": "manuals",
            },
        )
        assert response.status_code == 200
        events = _sse_events(response)
        detail = client.get(f"/api/v1/conversations/{conversation_id}").json()

    event_names = [event for event, _ in events]
    assert event_names.index("evidence") < event_names.index("token")
    for _, payload in [item for item in events if item[0] == "stage"]:
        assert set(payload) == {"stage", "turnId"}
        assert payload["stage"] in {"planning", "retrieving", "verifying", "answering"}
    done = events[-1][1]
    assert done["route"] == "domain_rag"
    assert done["stopReason"] == "grounded"
    assert done["budget"] == {"planStepCount": 1, "retrievalOperationCount": 1, "repairAttemptCount": 0}
    evidence_payload = [payload for event, payload in events if event == "evidence"][0]
    evidence_id = evidence_payload["evidence"][0]["id"]
    assert done["citations"][0] == {"citationLabel": "[1]", "evidenceRefId": evidence_id}
    assert [citation["citationLabel"] for citation in done["citations"]] == [
        item["citationLabel"] for item in evidence_payload["evidence"]
    ]
    assert _contains_forbidden_key(evidence_payload, {"sourcedocumentid", "sourceblockid", "path", "rawhit"}) is None
    assert adapter.grounded_calls == 1
    assert adapter.grounded_evidence[0].id == evidence_id

    turn = detail["turns"][0]
    assert turn["assistantAnswer"] == "Use lockout."
    assert turn["evidence"][0]["id"] == evidence_id
    assert source_id not in json.dumps(detail)

    engine, db = _session(settings)
    try:
        ref = db.scalar(select(ConversationTurnEvidenceRef))
        assert ref is not None
        assert ref.source_document_id == source_id
        assert ref.source_block_id
    finally:
        db.close()
        engine.dispose()


def test_domain_rag_no_evidence_does_not_fallback_to_direct_llm(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter()
    app.state.synthesis_stream_adapter = adapter
    _, request_id = _setup_ready_domain(app, settings)

    engine, db = _session(settings)
    try:
        domain = db.get(Domain, "manuals")
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
        conversation_id = _create_conversation(client)
        response = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={
                "clientRequestId": "noground-0001",
                "message": "What startup sequence does the manual require?",
                "domainId": "manuals",
            },
        )
        events = _sse_events(response)
        detail = client.get(f"/api/v1/conversations/{conversation_id}").json()

    assert response.status_code == 200
    assert [event for event, _ in events if event == "token"] == []
    assert events[-1][1]["stopReason"] == "no_grounded_context"
    assert adapter.direct_calls == 0
    assert adapter.grounded_calls == 0
    turn = detail["turns"][0]
    assert turn["assistantAnswer"] is None
    assert turn["evidence"] == []


def test_provider_failure_after_evidence_returns_evidence_only(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter(fail_grounded=True)
    app.state.synthesis_stream_adapter = adapter
    _setup_ready_domain(app, settings)

    with TestClient(app) as client:
        _login_admin(client, settings)
        conversation_id = _create_conversation(client)
        response = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={
                "clientRequestId": "evidence-0001",
                "message": "What startup sequence does the manual require?",
                "domainId": "manuals",
            },
        )
        events = _sse_events(response)
        detail = client.get(f"/api/v1/conversations/{conversation_id}").json()

    assert response.status_code == 200
    assert "evidence" in [event for event, _ in events]
    assert "token" not in [event for event, _ in events]
    assert events[-1][0] == "done"
    assert events[-1][1]["stopReason"] == "evidence_only"
    assert detail["turns"][0]["assistantAnswer"] is None
    assert detail["turns"][0]["evidence"]


def test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter(grounded_tokens=("Persisted answer.",))
    fake_evidence = [
        InternalMappedEvidence(
            source_document_id="source-private",
            source_block_id="block-private",
            source_label="manual.md",
            excerpt="Bounded excerpt.",
            retrieval_order=1,
        )
    ]
    retrieval_port = CountingRetrievalPort(settings, fake_evidence)
    app.state.synthesis_stream_adapter = adapter
    app.state.retrieval_port = retrieval_port

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        _create_domain(client, "manuals", start=True)
        conversation_id = _create_conversation(client)
        body = {
            "clientRequestId": "replay-0001",
            "message": "What startup sequence does the manual require?",
            "domainId": "manuals",
        }
        first = client.post(f"/api/v1/conversations/{conversation_id}/turns:stream", json=body)
        replay = client.post(f"/api/v1/conversations/{conversation_id}/turns:stream", json=body)
        conflict = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={**body, "message": "What does the manual say?"},
        )

    assert first.status_code == 200
    assert replay.status_code == 200
    replay_events = _sse_events(replay)
    assert replay_events[-1][1]["replay"] is True
    assert adapter.grounded_calls == 1
    assert retrieval_port.calls == [("manuals", body["message"], "fact")]
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "client_request_conflict"


def test_running_stream_blocks_second_turn_and_disconnect_marks_cancelled(app, settings: Settings) -> None:
    adapter = CountingSynthesisAdapter(direct_tokens=("first", "second"))
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)

    engine, db = _session(settings)
    try:
        owner = db.scalar(select(User).where(User.username == settings.admin_username))
        assert owner is not None
        conversation = create_conversation(db, owner=owner, title="Cancel")
        stream = stream_turn_events(
            db,
            settings=settings,
            owner=owner,
            conversation_id=conversation.id,
            client_request_id="cancel-0001",
            message="Hello",
            domain_id=None,
            synthesis_adapter=adapter,
        )
        first = next(stream)
        assert first.event == "stage"
        assert first.payload["stage"] == "direct_answering"
        blocked = stream_turn_events(
            db,
            settings=settings,
            owner=owner,
            conversation_id=conversation.id,
            client_request_id="cancel-0002",
            message="Hello again",
            domain_id=None,
            synthesis_adapter=adapter,
        )
        try:
            next(blocked)
        except ChatTurnError as exc:
            assert exc.status_code == 409
            assert exc.code == "conversation_turn_in_progress"
        else:  # pragma: no cover
            raise AssertionError("running turn was not rejected")
        stream.close()
        turn = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "cancel-0001"))
        assert turn is not None
        assert turn.status == "failed"
        assert turn.stop_reason == "cancelled"
        assert turn.safe_error_code == "turn_cancelled"
    finally:
        db.close()
        engine.dispose()


def test_source_and_domain_delete_redact_derived_turn_content(app, settings: Settings) -> None:
    source_id, _ = _setup_ready_domain(app, settings)

    engine, db = _session(settings)
    try:
        owner = create_user(db, "redaction-owner@example.test", "password", role=ROLE_MEMBER)
        conversation = create_conversation(db, owner=owner, title="Redaction")
        source = db.get(SourceDocument, source_id)
        assert source is not None
        block = db.scalar(select(SourceBlock).where(SourceBlock.source_document_id == source.id))
        assert block is not None
        now = utc_now()
        source_turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id="redact-source",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="What does the manual say?",
            assistant_answer="Derived content.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        domain_turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id="redact-domain",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_COMPLETED,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            user_message="Summarize the fatigue domain SOP",
            assistant_answer="Domain derived content.",
            started_at=now,
            completed_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add_all([source_turn, domain_turn])
        db.commit()
        db.add(
            ConversationTurnEvidenceRef(
                turn_id=source_turn.id,
                evidence_order=1,
                source_document_id=source.id,
                source_block_id=block.id,
                citation_label="[1]",
                source_label=source.original_filename,
                excerpt="Bounded excerpt.",
            )
        )
        db.commit()
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        deleted_source = client.delete(f"/api/v1/admin/domains/manuals/sources/{source_id}")
        assert deleted_source.status_code == 204

    engine, db = _session(settings)
    try:
        source_turn = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "redact-source"))
        assert source_turn is not None
        assert source_turn.status == TURN_STATUS_REDACTED
        assert source_turn.stop_reason == TURN_STOP_REASON_REDACTED
        assert source_turn.user_message == "What does the manual say?"
        assert source_turn.assistant_answer is None
        ref = db.scalar(select(ConversationTurnEvidenceRef).where(ConversationTurnEvidenceRef.turn_id == source_turn.id))
        assert ref is not None
        assert ref.redacted_at is not None
        assert ref.citation_label is None
        assert ref.source_label is None
        assert ref.excerpt is None
    finally:
        db.close()
        engine.dispose()

    with TestClient(app) as client:
        _login_admin(client, settings)
        accepted = client.delete("/api/v1/admin/domains/manuals")
        assert accepted.status_code == 202

    engine, db = _session(settings)
    try:
        assert DomainDeleteWorker(settings).run_once(db) is True
        domain_turn = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "redact-domain"))
        assert domain_turn is not None
        assert domain_turn.status == TURN_STATUS_REDACTED
        assert domain_turn.stop_reason == TURN_STOP_REASON_REDACTED
        assert domain_turn.user_message == "Summarize the fatigue domain SOP"
        assert domain_turn.assistant_answer is None
    finally:
        db.close()
        engine.dispose()


def test_late_stream_finalize_does_not_overwrite_redaction(app, settings: Settings) -> None:
    with TestClient(app):
        pass

    engine, db = _session(settings)
    try:
        owner = create_user(db, "cas-owner@example.test", "password", role=ROLE_MEMBER)
        conversation = create_conversation(db, owner=owner, title="Redaction race")
        now = utc_now()
        turn = ConversationTurn(
            conversation_id=conversation.id,
            client_request_id="redact-race",
            domain_id="manuals",
            route=TURN_ROUTE_DOMAIN_RAG,
            status=TURN_STATUS_RUNNING,
            user_message="What does the manual say?",
            started_at=now,
            created_at=now,
            updated_at=now,
        )
        db.add(turn)
        db.commit()

        # Redaction (e.g. domain delete) wins the race while the stream is in flight.
        assert redact_turns_for_domain(db, "manuals") == 1

        finalized = _complete_turn(
            db,
            turn=turn,
            stop_reason=TURN_STOP_REASON_GROUNDED,
            assistant_answer="Late derived content.",
        )

        assert finalized.status == TURN_STATUS_REDACTED
        assert finalized.stop_reason == TURN_STOP_REASON_REDACTED
        assert finalized.assistant_answer is None

        stored = db.get(ConversationTurn, turn.id)
        assert stored is not None
        assert stored.status == TURN_STATUS_REDACTED
        assert stored.assistant_answer is None
    finally:
        db.close()
        engine.dispose()


def test_chat_runtime_rejects_unapproved_operations_and_dependencies(settings: Settings) -> None:
    assert intent_for_operation("retrieve_fact") == "fact"
    assert intent_for_operation("retrieve_overview") == "overview"
    assert intent_for_operation("retrieve_verbatim") == "verbatim"
    try:
        intent_for_operation("retrieve_web")
    except Exception as exc:
        assert exc.__class__.__name__ == "OrchestrationPolicyError"
    else:  # pragma: no cover
        raise AssertionError("invalid retrieval operation was not rejected")

    import context_engine.services.chat_turns as chat_turns

    source = chat_turns.__loader__.get_source(chat_turns.__name__).lower()
    assert "langchain" not in source
    assert "langgraph" not in source
    assert "faiss" not in source

    evidence = [
        InternalMappedEvidence(
            source_document_id="source",
            source_block_id="block",
            source_label="manual.md",
            excerpt="Bounded excerpt.",
            retrieval_order=1,
        )
    ]
    port = CountingRetrievalPort(settings, evidence)
    assert isinstance(port, P6RetrievalPort)
