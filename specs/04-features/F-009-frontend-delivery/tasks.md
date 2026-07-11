---
id: F-009
title: Frontend Delivery Task List
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-10
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read and foundation gates.
- [x] T-010 [frontend] Implement runtime foundation: env, OpenAPI snapshot/client strategy, API client, error normalization, storage allowlist, tokens, tests.
  - Verification: `npm.cmd run test:foundation`, `npm.cmd run typecheck`, and `npm.cmd run build` pass; full visual baseline remains part of AC-008 before F-009 completion.
- [x] T-020 [frontend] Implement cookie login/logout/me and route guards.
  - Verification: auth wrappers use HttpOnly-cookie requests and no browser token persistence; live backend browser auth flow remains pending.
- [x] T-030 [frontend] Implement authenticated app shell, compact rail, settings entry, forbidden/loading/error states.
  - Verification: foundation route and nav-order tests pass; Playwright screenshot matrix remains pending before F-009 completion.
- [ ] T-040 [frontend] Implement Settings panels only after relevant OpenAPI fixtures exist.
  - Verification: admin/member and secret-status tests.
- [ ] T-050 [frontend] Implement documents/upload/operations slices.
  - Verification: state-machine and upload tests.
- [x] T-060 [frontend] Port chat shell with the turn-scoped Evidence Panel (single-column LS aside per revised `context-panel-tabs.md`); implement direct LLM and domain RAG SSE slices; wire P6/P7.
  - Verification: SSE fixture/cancel tests; panel shows the selected turn's evidence only and auto-opens on evidence; inline timeline evidence blocks removed; direct LLM leaves the panel closed with no hidden controls; timeline/composer/stop/retry UX is present without Local Studio terminal/filesystem/Git/browser-agent/model-controller controls.
  - Sub-slice done 2026-07-08: EvidencePanel aside + selection/auto-open state + inline evidence removal (`frontend/src/features/chat-shell/`); live transcript fixture replay and cancel UX remain open.
  - Live browser proof 2026-07-10: Playwright pilot happy path (direct chat + domain RAG + Evidence) against runnable stack.
- [ ] T-070 [frontend] Implement graph/source-nav/audit diagnostics only after contracts are captured.
  - Verification: contract and visual tests.
- [ ] T-080 [frontend] Split Settings dialog by ownership and hide post-P9 node/workspace controls unless approved contracts exist.
  - Verification: member/admin screenshots and import/network audit show no raw controller URL/API key, host path, runtime port, secret value, or browser-local infrastructure mutation.
- [x] T-085 [verification] Playwright pilot happy path + DESIGN screenshot matrix (AC-001 runtime, AC-007 pilot subset, AC-008).
  - Verification: stack up; `cd frontend && npm run test:e2e` (see `frontend/tests/e2e/README.md`); acceptance cites command + visual review note.
- [ ] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md` for Playwright pilot proof.
  - Verification: register status and evidence links current; F-009 remains `in_progress` until preview/graph AC-007 gaps close.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.

## Blocked Until Contract Or Fixture Proof

- Settings panels: each panel wires only after its endpoint fixture is captured from API-001/OpenAPI.
- Documents preview blob: API-001 member list + preview captured; wire Library panel and Playwright evidence.
- Source navigation: opaque resolve contract captured (`GET /evidence-refs/{evidence_ref_id}/source`); implement Evidence Panel Open in Library, Library deep-link + pdf.js page jump, Back to chat, and Playwright proof.
- Graph data: blocked until graph read DTOs are approved.
- Chat streaming UI: blocked until EVT-001 transcript fixtures exist and the two-column vs three-panel layout decision is recorded in F-009.
- Logs, Usage, Runtime Node, Docker, Wiki, and Smart Composer writes: blocked to F-010/F-011 unless active contracts are patched.
