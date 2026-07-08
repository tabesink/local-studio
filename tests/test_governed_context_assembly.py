from __future__ import annotations

import hashlib
import json
from datetime import timedelta
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient
from sqlalchemy import inspect, select
from sqlalchemy.orm import Session

from context_engine.config import Settings
from context_engine.db import create_db_engine, create_session_factory, utc_now
from context_engine.models import ROLE_MEMBER, ComposerRefToken, ConversationTurn, PromptTemplate
from context_engine.services.auth import create_user
from context_engine.services.chat_turns import SynthesisStreamAdapter
from tests.conftest import run_migrations


def _f012_openapi_subset(app) -> dict[str, Any]:
    spec = app.openapi()
    return {
        "paths": {
            path: spec["paths"][path]
            for path in [
                "/api/v1/composer-refs:discover",
                "/api/v1/conversations/{conversation_id}/turns:stream",
            ]
        },
        "schemas": {
            name: spec["components"]["schemas"][name]
            for name in ["ComposerRefDiscoverRequest", "TurnStreamRequest"]
        },
    }


def test_fresh_migration_creates_governed_context_tables(sqlite_url: str) -> None:
    run_migrations(sqlite_url)
    engine = create_db_engine(Settings(database_url=sqlite_url, session_cookie_secure=False, testing=True))
    try:
        inspector = inspect(engine)
        tables = set(inspector.get_table_names())
        turn_columns = {column["name"] for column in inspector.get_columns("conversation_turns")}
        template_columns = {column["name"] for column in inspector.get_columns("prompt_templates")}
        token_columns = {column["name"] for column in inspector.get_columns("composer_ref_tokens")}
        accepted_ref_columns = {
            column["name"] for column in inspector.get_columns("conversation_turn_composer_refs")
        }
        token_indexes = {
            index["name"] for index in inspector.get_indexes("composer_ref_tokens")
        } | {
            constraint["name"] for constraint in inspector.get_unique_constraints("composer_ref_tokens")
        }
        accepted_ref_indexes = {
            index["name"] for index in inspector.get_indexes("conversation_turn_composer_refs")
        } | {
            constraint["name"]
            for constraint in inspector.get_unique_constraints("conversation_turn_composer_refs")
        }
    finally:
        engine.dispose()

    assert {
        "prompt_templates",
        "composer_ref_tokens",
        "conversation_turn_composer_refs",
    }.issubset(tables)
    assert "composer_ref_fingerprint" in turn_columns
    assert {
        "id",
        "name",
        "description",
        "body",
        "state",
        "created_at",
        "updated_at",
    }.issubset(template_columns)
    assert {
        "id",
        "token_hash",
        "owner_user_id",
        "ref_kind",
        "target_id",
        "domain_id",
        "safe_label",
        "safe_description",
        "expires_at",
        "created_at",
    }.issubset(token_columns)
    assert {
        "id",
        "turn_id",
        "ref_order",
        "ref_kind",
        "safe_label",
        "safe_description",
        "domain_id",
        "source_document_id",
        "source_block_id",
        "evidence_ref_id",
        "wiki_page_id",
        "wiki_revision_id",
        "prompt_template_id",
        "redacted_at",
        "created_at",
    }.issubset(accepted_ref_columns)
    assert "token" not in token_columns
    assert "uq_composer_ref_tokens_hash" in token_indexes
    assert "uq_conversation_turn_composer_refs_order" in accepted_ref_indexes
    assert not {
        "raw_prompt",
        "raw_answer",
        "raw_source_text",
        "raw_lightrag_hit",
        "template_body",
        "provider_payload",
        "runtime_url",
        "path",
        "stack_trace",
        "token",
    }.intersection(accepted_ref_columns)



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


def test_composer_ref_discovery_seeds_templates_and_returns_hashed_tokens(app, settings: Settings) -> None:
    _create_member(settings, "composer-member@example.test")

    with TestClient(app) as client:
        _login(client, "composer-member@example.test")
        response = client.post("/api/v1/composer-refs:discover", json={"kinds": ["template"], "limit": 2})

    assert response.status_code == 200
    refs = response.json()["refs"]
    assert 1 <= len(refs) <= 2
    ref = refs[0]
    assert set(ref) == {"refToken", "kind", "label", "description"}
    assert ref["kind"] == "template"
    assert ref["refToken"]
    assert "body" not in ref
    assert "templateBody" not in ref

    token_hash = hashlib.sha256(ref["refToken"].encode("utf-8")).hexdigest()
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        stored = db.scalar(select(ComposerRefToken).where(ComposerRefToken.token_hash == token_hash))
        assert stored is not None
        assert stored.token_hash != ref["refToken"]
        assert stored.ref_kind == "template"
        assert stored.safe_label == ref["label"]
        template = db.get(PromptTemplate, stored.target_id)
        assert template is not None
        assert template.body
    finally:
        db.close()
        engine.dispose()


def test_composer_ref_discovery_rejects_extra_fields(app, settings: Settings) -> None:
    _create_member(settings, "composer-strict@example.test")

    with TestClient(app) as client:
        _login(client, "composer-strict@example.test")
        response = client.post(
            "/api/v1/composer-refs:discover",
            json={"kinds": ["template"], "rawPrompt": "leak me"},
        )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"



class CaptureAssemblyAdapter(SynthesisStreamAdapter):
    def __init__(self) -> None:
        self.direct_calls = 0
        self.messages: list[str] = []
        self.assembly_contexts: list[Any] = []

    def stream_direct(self, **kwargs) -> tuple[str, ...]:
        self.direct_calls += 1
        self.messages.append(kwargs["message"])
        self.assembly_contexts.append(kwargs.get("assembly_context"))
        return ("Template answer.",)


def _login_admin(client: TestClient, settings: Settings) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"username": settings.admin_username, "password": settings.admin_password},
    )
    assert response.status_code == 200


def _configure_openai(client: TestClient) -> None:
    response = client.put("/api/v1/admin/runtime-settings/providers/openai", json={"credential": "f012-credential"})
    assert response.status_code == 200


def _create_conversation(client: TestClient) -> str:
    created = client.post("/api/v1/conversations", json={"title": "Governed context"})
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


def test_template_ref_turn_persists_accepted_refs_and_private_assembly(app, settings: Settings) -> None:
    adapter = CaptureAssemblyAdapter()
    app.state.synthesis_stream_adapter = adapter

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation_id = _create_conversation(client)
        discovered = client.post("/api/v1/composer-refs:discover", json={"kinds": ["template"], "limit": 1})
        assert discovered.status_code == 200
        ref = discovered.json()["refs"][0]
        token = ref["refToken"]
        streamed = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={
                "clientRequestId": "templ-0001",
                "message": "Write a concise decision note",
                "composerRefTokens": [token],
            },
        )
        detail = client.get(f"/api/v1/conversations/{conversation_id}")

    assert streamed.status_code == 200
    events = _sse_events(streamed)
    assert [event for event, _ in events] == ["stage", "token", "done"]
    assert all("acceptedRefs" not in payload for _, payload in events[:-1])
    done = events[-1][1]
    assert done["acceptedRefs"] == [
        {
            "id": detail.json()["turns"][0]["acceptedRefs"][0]["id"],
            "kind": "template",
            "order": 1,
            "label": ref["label"],
            "description": ref["description"],
        }
    ]
    turn = detail.json()["turns"][0]
    assert turn["userMessage"] == "Write a concise decision note"
    assert turn["assistantAnswer"] == "Template answer."
    assert turn["acceptedRefs"] == done["acceptedRefs"]
    assert "refToken" not in streamed.text
    assert "body" not in streamed.text
    assert adapter.direct_calls == 1
    assert adapter.messages == ["Write a concise decision note"]
    assert adapter.assembly_contexts[0] is not None
    assert adapter.assembly_contexts[0].snippets[0].kind == "template"

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    engine = create_db_engine(settings)
    factory = create_session_factory(engine)
    db: Session = factory()
    try:
        stored_token = db.scalar(select(ComposerRefToken).where(ComposerRefToken.token_hash == token_hash))
        assert stored_token is not None
        template = db.get(PromptTemplate, stored_token.target_id)
        assert template is not None
        assert adapter.assembly_contexts[0].snippets[0].body == template.body
        stored_turn = db.scalar(select(ConversationTurn).where(ConversationTurn.client_request_id == "templ-0001"))
        assert stored_turn is not None
        assert stored_turn.user_message == "Write a concise decision note"
        assert stored_turn.composer_ref_fingerprint != token_hash
    finally:
        db.close()
        engine.dispose()


def test_template_ref_replay_uses_fingerprint_without_revalidating_expired_token(app, settings: Settings) -> None:
    adapter = CaptureAssemblyAdapter()
    app.state.synthesis_stream_adapter = adapter

    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation_id = _create_conversation(client)
        token = client.post(
            "/api/v1/composer-refs:discover",
            json={"kinds": ["template"], "limit": 1},
        ).json()["refs"][0]["refToken"]
        first = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "templ-0002", "message": "Use the template", "composerRefTokens": [token]},
        )
        assert first.status_code == 200

        engine = create_db_engine(settings)
        factory = create_session_factory(engine)
        db: Session = factory()
        try:
            token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            stored_token = db.scalar(select(ComposerRefToken).where(ComposerRefToken.token_hash == token_hash))
            assert stored_token is not None
            stored_token.expires_at = utc_now() - timedelta(seconds=1)
            db.commit()
        finally:
            db.close()
            engine.dispose()

        replay = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "templ-0002", "message": "Use the template", "composerRefTokens": [token]},
        )
        new_token = client.post(
            "/api/v1/composer-refs:discover",
            json={"kinds": ["template"], "limit": 1},
        ).json()["refs"][0]["refToken"]
        conflict = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "templ-0002", "message": "Use the template", "composerRefTokens": [new_token]},
        )

    assert replay.status_code == 200
    assert _sse_events(replay)[-1][1]["replay"] is True
    assert adapter.direct_calls == 1
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "client_request_conflict"



def test_expired_composer_ref_token_fails_before_turn_claim(app, settings: Settings) -> None:
    with TestClient(app) as client:
        _login_admin(client, settings)
        _configure_openai(client)
        conversation_id = _create_conversation(client)
        token = client.post(
            "/api/v1/composer-refs:discover",
            json={"kinds": ["template"], "limit": 1},
        ).json()["refs"][0]["refToken"]

        engine = create_db_engine(settings)
        factory = create_session_factory(engine)
        db: Session = factory()
        try:
            token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
            stored_token = db.scalar(select(ComposerRefToken).where(ComposerRefToken.token_hash == token_hash))
            assert stored_token is not None
            stored_token.expires_at = utc_now() - timedelta(seconds=1)
            db.commit()
        finally:
            db.close()
            engine.dispose()

        response = client.post(
            f"/api/v1/conversations/{conversation_id}/turns:stream",
            json={"clientRequestId": "templ-0003", "message": "Use expired", "composerRefTokens": [token]},
        )
        detail = client.get(f"/api/v1/conversations/{conversation_id}")

    assert response.status_code == 409
    assert response.headers["content-type"].startswith("application/json")
    assert response.json()["error"]["code"] == "composer_ref_unavailable"
    assert detail.json()["turns"] == []



def test_f012_openapi_snapshot_matches_contract(app) -> None:
    generated = _f012_openapi_subset(app)
    expected = json.loads(Path("tests/snapshots/f012_openapi.json").read_text())
    assert generated == expected

    turn_schema = generated["schemas"]["TurnStreamRequest"]
    assert turn_schema["additionalProperties"] is False
    assert turn_schema["properties"]["composerRefTokens"]["maxItems"] == 10
    discover_schema = generated["schemas"]["ComposerRefDiscoverRequest"]
    assert discover_schema["additionalProperties"] is False
    assert discover_schema["properties"]["kinds"]["anyOf"][0]["maxItems"] == 4
