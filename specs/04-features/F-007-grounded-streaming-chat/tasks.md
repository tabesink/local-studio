---
id: F-007
title: Agentic Chat And Streaming Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-006]
supersedes: []
---


# F-007 - Tasks

## Required Order

- [ ] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [ ] T-010 [backend/data] Add conversation, turn, and turn evidence-ref migrations and constraints.
  - Verification: Owner and unique request tests.
- [ ] T-020 [backend/api] Implement conversation CRUD with owner filters.
  - Verification: 404 other-user tests.
- [ ] T-030 [backend/service] Implement turn idempotency and one-running-turn guard.
  - Verification: 409/duplicate tests.
- [ ] T-040 [backend/ai] Implement server intent gate and direct LLM responder.
  - Verification: direct route tests, no retrieval/citation assertions.
- [ ] T-050 [backend/ai] Implement CE-native advanced agentic RAG `TurnOrchestrator` with typed middleware and closed RetrievalPort operations.
  - Verification: budget/operation/middleware/citation tests; intent tests prove `fact`/`overview`/`verbatim` use one RetrievalPort/P6 path; dependency scan rejects LangChain/LangGraph in chat runtime.
- [ ] T-060 [backend/api] Implement Context Engine SSE endpoint.
  - Verification: SSE fixture tests.
- [ ] T-070 [backend/service] Implement source/domain redaction hooks.
  - Verification: Delete/redaction tests.
- [ ] T-080 [backend/eval] Add direct, no-evidence, single-hop, multi-hop, invalid-operation, and budget-exhaustion fixtures.
  - Verification: fixture run records route and stop reason.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [ ] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
