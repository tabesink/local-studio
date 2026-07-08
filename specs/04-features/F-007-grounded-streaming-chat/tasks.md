---
id: F-007
title: Agentic Chat And Streaming Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-006]
supersedes: []
---


# F-007 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-010 [backend/data] Add conversation, turn, and turn evidence-ref migrations and constraints.
  - Verification: Owner, unique request, evidence ordering, citation-label uniqueness, and fresh migration tests.
- [x] T-020 [backend/api] Implement conversation CRUD with owner filters.
  - Verification: 404 other-user tests; title create/update validation tests.
- [x] T-030 [backend/service] Implement turn idempotency and one-running-turn guard.
  - Verification: 409/duplicate tests; completed/failed/redacted replay tests prove no provider/retrieval call; changed message/effective domain returns `client_request_conflict`.
- [x] T-040 [backend/ai] Implement server intent gate and direct LLM responder.
  - Verification: `tests/test_grounded_streaming_chat.py::test_direct_general_chat_streams_without_retrieval_or_citations`, `tests/test_grounded_streaming_chat.py::test_turn_stream_pre_stream_errors_are_json_and_do_not_claim`.
- [x] T-050 [backend/ai] Implement CE-native advanced agentic RAG `TurnOrchestrator` with typed middleware and closed RetrievalPort operations.
  - Verification: `tests/test_grounded_streaming_chat.py::test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs`, `tests/test_grounded_streaming_chat.py::test_chat_runtime_rejects_unapproved_operations_and_dependencies`, `tests/test_grounded_streaming_chat.py::test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval`.
- [x] T-060 [backend/api] Implement Context Engine SSE endpoint.
  - Verification: `tests/test_grounded_streaming_chat.py` covers stage/evidence/token/done/error projection, replay markers, terminal outcomes, and JSON errors before SSE opens.
- [x] T-070 [backend/service] Implement source/domain redaction hooks.
  - Verification: `tests/test_grounded_streaming_chat.py::test_source_and_domain_delete_redact_derived_turn_content`.
- [x] T-080 [backend/eval] Add direct, no-evidence, single-hop, provider-failure, and invalid-operation fixture coverage.
  - Verification: `tests/test_grounded_streaming_chat.py`; multi-hop and budget-exhaustion runtime paths remain deferred by LD-008 single-hop v1.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: `python -m compileall context_engine tests` -> passed; `pytest tests/test_grounded_streaming_chat.py` -> 9 passed, 1 warning; `pytest tests/test_conversations.py tests/test_foundation_auth.py::test_openapi_snapshot_matches` -> 8 passed, 1 warning; `pytest` -> 76 passed, 1 warning.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
