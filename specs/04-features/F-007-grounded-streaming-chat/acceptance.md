---
id: F-007
title: Agentic Chat And Streaming Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-006]
supersedes: []
---

# F-007 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `tests/test_conversations.py::test_conversation_crud_is_owner_scoped`, `tests/test_conversations.py::test_conversation_title_validation_and_omitted_body`; `pytest tests/test_conversations.py tests/test_foundation_auth.py::test_openapi_snapshot_matches` -> 8 passed, 1 warning; `pytest` -> 76 passed, 1 warning | implemented | user can CRUD own conversations only; cross-user detail/update/delete returns `conversation_not_found`; title create/update validation covered |
| AC-002 | `tests/test_grounded_streaming_chat.py::test_turn_stream_pre_stream_errors_are_json_and_do_not_claim`, `tests/test_grounded_streaming_chat.py::test_direct_general_chat_streams_without_retrieval_or_citations` | implemented | domain-specific turn without `domainId` returns `domain_required`; direct general chat omits domain and persists `route=direct_llm` |
| AC-003 | `tests/test_conversations.py::test_chat_turn_claim_creates_running_turn_and_blocks_second_running`, `tests/test_grounded_streaming_chat.py::test_running_stream_blocks_second_turn_and_disconnect_marks_cancelled` | implemented | second turn while a turn is running returns `conversation_turn_in_progress` before streaming |
| AC-004 | `tests/test_conversations.py::test_chat_turn_duplicate_terminal_requests_replay_and_conflicts`, `tests/test_grounded_streaming_chat.py::test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval` | implemented | duplicate terminal request replays persisted safe state; changed message/effective domain returns `client_request_conflict`; provider/retrieval counters do not increment on replay |
| AC-005 | `tests/test_grounded_streaming_chat.py::test_domain_rag_no_evidence_does_not_fallback_to_direct_llm` | implemented | no mapped Evidence completes with `stopReason=no_grounded_context` and no answer tokens |
| AC-006 | `tests/test_grounded_streaming_chat.py::test_provider_failure_after_evidence_returns_evidence_only` | implemented | provider failure after persisted Evidence completes with `stopReason=evidence_only`, Evidence retained, no answer tokens |
| AC-007 | `tests/test_grounded_streaming_chat.py::test_running_stream_blocks_second_turn_and_disconnect_marks_cancelled` | implemented | closing the stream generator settles the running turn as failed/cancelled with safe error `turn_cancelled` |
| AC-008 | `tests/test_grounded_streaming_chat.py::test_turn_stream_pre_stream_errors_are_json_and_do_not_claim` | implemented | forbidden browser control field `route` returns `422 validation_error` before claim/SSE |
| AC-009 | `tests/test_grounded_streaming_chat.py::test_direct_general_chat_streams_without_retrieval_or_citations` | implemented | direct general chat streams token events, stores answer, and has no retrieval, Evidence, or citations |
| AC-010 | `tests/test_grounded_streaming_chat.py::test_domain_rag_no_evidence_does_not_fallback_to_direct_llm` | implemented | domain RAG no-evidence path does not call the direct adapter |
| AC-011 | `tests/test_grounded_streaming_chat.py::test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs`, `tests/test_grounded_streaming_chat.py::test_chat_runtime_rejects_unapproved_operations_and_dependencies` | implemented | single-hop budgets are projected in `done`; invalid retrieval operation fails closed; chat runtime source scan rejects LangChain/LangGraph/FAISS |
| AC-012 | `tests/test_grounded_streaming_chat.py::test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs` | implemented | `stage` SSE payloads contain only `{ turnId, stage }` with approved labels |
| AC-013 | `tests/test_grounded_streaming_chat.py::test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval`, `tests/test_grounded_streaming_chat.py::test_chat_runtime_rejects_unapproved_operations_and_dependencies` | implemented | `fact`, `overview`, and `verbatim` are closed intent labels over `P6RetrievalPort`; no second retriever/vector-store dependency is introduced |
| AC-014 | `tests/test_grounded_streaming_chat.py::test_turn_stream_pre_stream_errors_are_json_and_do_not_claim`, `tests/test_grounded_streaming_chat.py::test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval` | implemented | missing domain, unknown domain, forbidden fields, running turn, and request conflicts return JSON errors before SSE opens |
| AC-015 | `tests/test_grounded_streaming_chat.py::test_idempotent_domain_replay_uses_persisted_state_without_provider_or_retrieval` | implemented | completed duplicate `clientRequestId` replays from persisted turn/evidence state with `done.replay=true` and no provider/retrieval calls |
| AC-016 | `tests/test_conversations.py::test_safe_turn_summary_and_conversation_detail_use_persisted_safe_fields`, `tests/test_grounded_streaming_chat.py::test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs`, `tests/test_grounded_streaming_chat.py::test_source_and_domain_delete_redact_derived_turn_content` | implemented | public API/SSE expose only turn-scoped evidence refs, citation labels, safe labels, and approved excerpts; private source/block ids are persisted internally only and cleared/omitted after redaction |

Verification summary:

- `python -m compileall context_engine tests` -> passed.
- `pytest tests/test_grounded_streaming_chat.py` -> 9 passed, 1 warning.
- `pytest tests/test_conversations.py tests/test_foundation_auth.py::test_openapi_snapshot_matches` -> 8 passed, 1 warning.
- `pytest` -> 76 passed, 1 warning.
- Warning: existing `StarletteDeprecationWarning` from `fastapi.testclient` / `httpx`.

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
