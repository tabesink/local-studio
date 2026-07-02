---
id: F-009
title: Frontend Delivery Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Tasks

## Required Order

- [ ] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [ ] T-010 [frontend] Implement runtime foundation: env, API client, error normalization, tokens, tests.
  - Verification: unit tests and visual baseline.
- [ ] T-020 [frontend] Implement cookie login/logout/me and route guards.
  - Verification: browser storage/auth tests.
- [ ] T-030 [frontend] Implement authenticated app shell, compact rail, settings entry, forbidden/loading/error states.
  - Verification: Playwright shell tests.
- [ ] T-040 [frontend] Implement Settings panels only after relevant OpenAPI fixtures exist.
  - Verification: admin/member and secret-status tests.
- [ ] T-050 [frontend] Implement documents/upload/operations slices.
  - Verification: state-machine and upload tests.
- [ ] T-060 [frontend] Port chat shell with ContextPanelShell + context tab; implement direct LLM and domain RAG SSE slices; wire P6/P7 per `context-panel-tabs.md`.
  - Verification: SSE fixture/cancel tests; context tab evidence ordering; direct LLM has empty context and no hidden controls.
- [ ] T-070 [frontend] Implement graph/source-nav/audit diagnostics only after contracts are captured.
  - Verification: contract and visual tests.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [ ] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
