---
id: F-007
title: Agentic Chat And Streaming Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-006]
supersedes: []
---


# F-007 - Implementation Log

Status: implemented (T-010 through T-080 complete for P7 v1; multi-hop and budget-exhaustion runtime behavior remain deferred by LD-008 single-hop v1).

## T-010 — P7 data layer (2026-07-06)

- Migration `migrations/versions/20260706_0006_conversations_and_turns.py`: `conversations`, `conversation_turns`, `conversation_turn_evidence_refs` with owner FK, `(conversation_id, client_request_id)` uniqueness, partial unique running turn, evidence ordering, citation-label partial unique, `redacted_at` + redacted-field check.
- SQLAlchemy models: `Conversation`, `ConversationTurn`, `ConversationTurnEvidenceRef` in `context_engine/models.py`.
- Verification: `test_fresh_migration_creates_conversation_tables_with_required_constraints` in `tests/test_conversations.py`; `pytest -q --basetemp .pytest-tmp-full-2` → 61 passed.

## T-020 - Conversation CRUD API (2026-07-06)

- Service `context_engine/services/conversations.py`: owner-scoped conversation create/list/detail/update/delete helpers, safe summary mapper, title normalization, control-character rejection, and `conversation_not_found` for other-user access.
- API routes in `context_engine/api/routes.py`: `GET /conversations`, `POST /conversations`, `GET /conversations/{conversation_id}`, `PATCH /conversations/{conversation_id}`, `DELETE /conversations/{conversation_id}`. Detail returns an empty `turns` array until T-030/T-060 add persisted turn summaries and replay.
- Contract alignment: patched API-001 so supplied `domainId` always means `domain_rag`, matching AI-001 LD-019 and the locked handoff.
- OpenAPI evidence: regenerated `tests/snapshots/f007_openapi.json`; `tests/test_foundation_auth.py::test_openapi_snapshot_matches` now compares against the active P7 snapshot.
- Verification: `pytest tests/test_conversations.py tests/test_foundation_auth.py::test_openapi_snapshot_matches -q --basetemp .pytest-tmp-p7-t020-targeted` -> 4 passed; `pytest -q --basetemp .pytest-tmp-full-p7-t020-3` -> 63 passed, 1 warning.

## T-030 - Turn Claim, Idempotency, And Safe Replay Foundations (2026-07-06)

- Service `context_engine/services/chat_turns.py`: `claim_turn()` normalizes `clientRequestId` and message, validates effective route/domain shape, owner-filters the conversation, rejects running turns, returns terminal duplicate replay claims, and rejects changed message/route/effective-domain duplicates as `client_request_conflict`.
- Safe mapping: `safe_turn_summary()` and `conversation_turn_summaries()` project persisted safe fields for conversation detail, omit redacted evidence refs and private Source Document/Block ids, clear assistant answers for running/failed/redacted/`no_grounded_context`/`evidence_only`, and include safe errors/budget counters.
- API detail: `GET /conversations/{conversation_id}` now returns persisted safe turn summaries instead of an empty placeholder.
- Contract alignment: patched DATA-001 idempotency wording so supplied `domainId` always makes the effective route `domain_rag`; direct LLM duplicate comparison uses null domain only when no `domainId` was supplied and routing is direct.
- Verification: `pytest tests/test_conversations.py -q --basetemp .pytest-tmp-p7-t030-conversations` -> 7 passed; `pytest tests/test_foundation_auth.py::test_openapi_snapshot_matches -q --basetemp .pytest-tmp-p7-t030-openapi` -> 1 passed; `pytest -q --basetemp .pytest-tmp-full-p7-t030` -> 67 passed, 1 warning.

## T-040 - Intent Gate And Direct LLM Stream (2026-07-06)

- Added deterministic checked-in question-shape classifier in `context_engine/services/chat_intent.py`; supplied `domainId` always chooses `domain_rag`.
- Added synthesis adapter seam in `context_engine/services/chat_turns.py`; tests use mock stream adapters per AI-001 provider test guidance.
- Direct turns resolve active synthesis server-side, stream safe token events, persist `route=direct_llm`, and never create evidence refs.
- Verification: `tests/test_grounded_streaming_chat.py::test_direct_general_chat_streams_without_retrieval_or_citations`, `tests/test_grounded_streaming_chat.py::test_turn_stream_pre_stream_errors_are_json_and_do_not_claim`.

## T-050 - CE-Native TurnOrchestrator And RetrievalPort (2026-07-06)

- Added `TurnOrchestrator`, closed retrieval operations, budget counters, and label-only `fact` / `overview` / `verbatim` intent mapping over one `P6RetrievalPort`.
- Added internal mapped-evidence bridge in `context_engine/services/evidence.py` so chat can persist private Source Document/Block ids while public P6 DTOs stay unchanged.
- Domain RAG streams safe stage labels, persists current-turn evidence refs before answer tokens, validates citations from turn-scoped evidence ref ids, and maps no evidence/provider-after-evidence terminal states.
- Verification: `tests/test_grounded_streaming_chat.py::test_domain_rag_streams_evidence_before_tokens_and_persists_private_refs`, `tests/test_grounded_streaming_chat.py::test_domain_rag_no_evidence_does_not_fallback_to_direct_llm`, `tests/test_grounded_streaming_chat.py::test_provider_failure_after_evidence_returns_evidence_only`, `tests/test_grounded_streaming_chat.py::test_chat_runtime_rejects_unapproved_operations_and_dependencies`.

## T-060 - Context Engine SSE Endpoint (2026-07-06)

- Added `POST /api/v1/conversations/{conversation_id}/turns:stream` with strict body shape, pre-consumed first SSE event, and canonical JSON errors before `text/event-stream` opens.
- Added safe SSE encoding for `stage`, `evidence`, `token`, `done`, and `error`; replay streams are reconstructed from persisted safe turn/evidence state.
- Regenerated `tests/snapshots/f007_openapi.json`.
- Verification: `tests/test_grounded_streaming_chat.py`, `tests/test_foundation_auth.py::test_openapi_snapshot_matches`.

## T-070 - Source And Domain Redaction Hooks (2026-07-06)

- Wired source delete to redact turns citing the deleted source before local source rows/files are removed.
- Wired domain delete worker to redact all domain-grounded turns before domain/source purge.
- Redaction retains evidence-ref rows, clears public citation/source/excerpt fields, sets `redacted_at`, clears derived assistant answers, and preserves user messages.
- Verification: `tests/test_grounded_streaming_chat.py::test_source_and_domain_delete_redact_derived_turn_content`.

## T-080/T-900 - Fixture Coverage And Verification (2026-07-06)

- Added `tests/test_grounded_streaming_chat.py` covering direct success, pre-stream JSON errors, grounded success, no grounded context, provider failure after evidence, idempotent replay, running-turn/disconnect cancellation, redaction hooks, closed operations, and dependency scan.
- Centralized pytest temp output with `pyproject.toml` `addopts = "-q --basetemp=tests/.pytest-tmp"` and ignored both legacy root temp dirs and the new temp folder in `.gitignore`.
- Verification:
  - `python -m compileall context_engine tests` -> passed.
  - `pytest tests/test_grounded_streaming_chat.py` -> 9 passed, 1 warning.
  - `pytest tests/test_conversations.py tests/test_foundation_auth.py::test_openapi_snapshot_matches` -> 8 passed, 1 warning.
  - `pytest` -> 76 passed, 1 warning.
- Tooling note: `python -m ruff` could not run because `ruff` is not installed in the project virtualenv.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-07-02 | Replaced RAG-only pilot plan with explicit direct LLM general chat plus advanced agentic domain RAG. | User requirement and controllable RAG reference package show the desired synthesis architecture; contracts now prevent missing Evidence from becoming ungrounded domain answers. | Implement F-007 with CE-native `TurnOrchestrator` and typed middleware only; LangChain/LangGraph adapters are rejected. |
| 2026-07-02 | Locked F-007 orchestration to CE-native modules with no LangChain/LangGraph adapter path. | Lower entropy, fewer dependency/security surfaces, and clearer ownership for budgets, retrieval, verification, citation validation, and SSE projection. | Keep any future framework proposal behind a new approved decision and contract change, not an adapter placeholder. |
| 2026-07-02 | Clarified that CE has one physical P6/LightRAG retriever and three logical retrieval intent labels. | Prevents the upstream controllable-RAG three-FAISS-retriever design from being copied into CE. | Implement `fact`, `overview`, and `verbatim` as server-owned query-shaping policy over one RetrievalPort. |
| 2026-07-06 | Closed P7 API/SSE/data edge details for conversation detail DTOs, title update, idempotent replay, terminal SSE outcomes, pre-stream JSON errors, safe error codes, and internal mapped-evidence bridge. | Removes the P7 readiness blockers before implementation and prevents FK/stream-shape drift, public P6 DTO widening, and half-open SSE validation failures. | Implement against API-001, EVT-001, DATA-001, and AI-001; update OpenAPI/SSE/safe DTO fixtures during P7 code work. |
| 2026-07-06 | Locked redaction persistence as Option C: retain `conversation_turn_evidence_refs` rows, set `redacted_at`, clear public fields, omit from API/SSE/replay. | Preserves internal audit trail without exposing redacted citation content to the browser. | Patch DATA-001/API-001; redaction tests must assert row retention plus empty public payloads. |
| 2026-07-06 | Locked grill gates LD-005–LD-017: live Docker CI for Slice A; single-hop orchestrator; label-only intents; rules classifier; budget caps; whole-turn redaction; mock provider tests; full SSE replay. | Removes remaining implementation guesswork before P7 coding. | See `.devnotes/P6-post-impl-REVIEW/LOCKED-PLAN-coding-agent-handoff.md`. |
| 2026-07-08 | Review fix CHG-035: turn completion/failure is compare-and-set (UPDATE guarded on `status = 'running'`), so a late stream finalize cannot overwrite a concurrent redaction; regression test added. | ce-code-review #4 — in-flight streams could restore redacted `assistant_answer` after source/domain delete. | None; see `docs/residual-review-findings/a85eb030.md`. |

## Drift Register

No code/spec drift recorded yet. Specification changed before implementation.
