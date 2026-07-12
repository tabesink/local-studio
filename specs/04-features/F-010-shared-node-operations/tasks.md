---
id: F-010
title: Shared Node Operations And Runnable Stack Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-11
depends_on: [F-010]
supersedes: []
---

# F-010 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, F-010 docs, RUN-001, API-001, DATA-001, QA-002, QA-003, QA-004, ARCH-002, F-009, and old compose evidence.
  - Verification: implementation response lists specs read and old-compose deltas.
- [x] T-010 [deployment] Add one combined compose/local fixture with stock `postgres:16` and migration service.
  - Verification: `scripts/stack_smoke.py` passed `postgres_health` and `alembic_head` (canonical names; historical first proof used former `p10` paths).
- [x] T-020 [deployment] Add current FastAPI API service.
  - Verification: stack smoke passed direct API `live`, `ready`, admin login, and `/auth/me` checks.
- [x] T-030 [deployment/frontend] Add frontend production build/start service aligned to API; document `next dev` only as an optional local path outside compose.
  - Verification: stack smoke passed frontend `/login`, same-origin login proxy, and same-origin `/auth/me` proxy checks.
- [x] T-040 [ops/test] Add HTTP stack smoke deepened to the full pilot path.
  - Verification: `python scripts/stack_smoke.py --env-file .env.stack.local --project-name context_engine_stack --reset-state --write-evidence _tmp/stack-smoke.json` proves auth/proxy plus upload → prepare → index → chat → delete → redaction without in-process `run_once`.
- [x] T-050 [backend] Complete workers-in-stack: one compose `worker` service running `python -m context_engine.worker` that claims prepare, index, and domain-delete leases. (Supersedes the earlier first-gate deferral.)
  - Verification: stack smoke passes `worker_running` and prepare/index/delete-redaction checks with the compose worker advancing state; no Redis/RQ/Celery.
- [x] T-060 [docs] Update launch runbook and environment guidance for `stack` names, volume rename caveat, and local-fake note.
  - Verification: runbook names required env vars with placeholders only; current instructions use `compose.stack.yml`, `.env.stack.*`, `STACK_*_PORT`, project `context_engine_stack`.
- [x] T-070 [security] Add safety scan coverage for compose/env examples and smoke evidence; allow CE lease worker while rejecting Redis/RQ/Celery/status-poller/deployment-control.
  - Verification: `python scripts/stack_safety_scan.py --smoke-evidence _tmp/stack-smoke.json` passed.
- [x] T-100 [contracts] Patch API-001 and DATA-001 for Settings Knowledge Graph storage summaries.
  - Verification: approved contract diffs define admin-only `storageSummary` without paths, URLs, ports, containers, or private runtime ids.
- [x] T-110 [backend/frontend] Implement the contracted Settings Knowledge Graph storage bars.
  - Verification: backend admin domain DTO test and frontend helper/source-scan test.
- [ ] T-120 [contracts] Patch API-001 and DATA-001 before Logs/Usage/Node/Docker UI work.
  - Verification: approved contract diffs.
- [ ] T-130 [frontend] Implement only contracted P10 operator surfaces.
  - Verification: authz tests, import/network audit, and visual screenshots.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Blocked Until Contract Or Fixture Proof

- Runtime Node, Node Environment, Logs, Usage, and operator dashboards are blocked until API-001 and DATA-001 capture DTOs, roles, audit events, and safety rules. Settings Knowledge Graph storage summaries are approved only through the admin domain `storageSummary` DTO.
- Browser node/runtime actions are blocked unless they use backend-authorized opaque IDs and never expose raw targets.
- Production secret management is blocked until a deployment-specific secret store is selected; P10 may name env/secret inputs only.
- Live Docker LightRAG / native runtime in compose acceptance remains deferred for this gate (local client kinds; LD-006 production default unchanged).

## Notes From Old Compose Evidence

- Reuse service-order ideas: database health -> migration -> API + worker -> frontend.
- Do not reuse stale backend module paths, old `DATABASE_URL`, old `REDIS_URL`, old API port defaults, Redis queue assumptions, status poller, or deployment-control socket access.
- Do not reuse the old custom Postgres image for the stack gate; use stock `postgres:16` unless migration evidence proves an extension requirement.
- The current CE lease worker (`python -m context_engine.worker`) is not the old Redis/RQ worker platform; it claims Postgres leases only.
