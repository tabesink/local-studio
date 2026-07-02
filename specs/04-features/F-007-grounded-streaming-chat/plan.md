---
id: F-007
title: Agentic Chat And Streaming Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-006]
supersedes: []
---


# F-007 - Implementation Plan

## Build Strategy

Build only P7 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Chat UI later renders conversation list/thread/composer, direct LLM turns, current-turn evidence, stage labels, token stream, safe terminal states, and cancel. No source navigation until F-009 slice 16 contract exists. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `conversations`, `conversation_turns`, `conversation_turn_evidence_refs`; no prompt/raw evidence/raw provider columns. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, reasoning traces, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs and route/budget counters now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [backend/data] Add conversation, turn, and turn evidence-ref migrations and constraints.
  - Verification: Owner and unique request tests.
- [ ] T-020 [backend/api] Implement conversation CRUD with owner filters.
  - Verification: 404 other-user tests.
- [ ] T-030 [backend/service] Implement turn idempotency and one-running-turn guard.
  - Verification: 409/duplicate tests.
- [ ] T-040 [backend/ai] Implement server intent gate and direct LLM responder for non-domain general chat.
  - Verification: direct route tests prove no retrieval/evidence/citations and domain questions fail closed without a domain.
- [ ] T-050 [backend/ai] Implement CE-native advanced agentic RAG `TurnOrchestrator` with a statically registered typed middleware chain and closed RetrievalPort operations.
  - Verification: budget/operation/middleware tests; `fact`/`overview`/`verbatim` hit the same RetrievalPort/P6 path; invalid plan/operation fails closed; no direct LightRAG import and no LangChain/LangGraph dependency in chat runtime.
- [ ] T-060 [backend/api] Implement Context Engine SSE endpoint with safe `stage`, `evidence`, `token`, `done`, and `error` projection.
  - Verification: SSE fixture tests.
- [ ] T-070 [backend/service] Implement source/domain redaction hooks.
  - Verification: Delete/redaction tests.
- [ ] T-080 [backend/eval] Add direct, no-evidence, single-hop, multi-hop, and invalid-operation fixtures.
  - Verification: evaluation fixture run records route, stop reason, evidence ids, and budget counters.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
- Framework drift: do not add LangChain, LangGraph, `create_agent`, `create_react_agent`, `StateGraph`, or adapter boundaries to F-007. Keep orchestration policy in CE-native modules and tests.
- Retrieval drift: do not create intent-specific retrievers, FAISS stores, a second vector store, duplicate marker parsing, or additional retrieval endpoints. `fact`, `overview`, and `verbatim` stay policy labels over one P6/LightRAG retriever.
