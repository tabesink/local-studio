---
id: F-010
title: Shared Node Operations And Runnable Stack Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-010]
supersedes: []
---

# F-010 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, F-010 docs, RUN-001, API-001, DATA-001, QA-002, QA-003, QA-004, ARCH-002, F-009, and old compose evidence.
  - Verification: implementation response lists specs read and old-compose deltas.
- [x] T-010 [deployment] Add one combined compose/local fixture with stock `postgres:16` and migration service.
  - Verification: `scripts/p10_stack_smoke.py` passed `postgres_health` and `alembic_head`.
- [x] T-020 [deployment] Add current FastAPI API service.
  - Verification: P10 smoke passed direct API `live`, `ready`, admin login, and `/auth/me` checks.
- [x] T-030 [deployment/frontend] Add frontend production build/start service aligned to API; document `next dev` only as an optional local path outside compose.
  - Verification: P10 smoke passed frontend `/login`, same-origin login proxy, and same-origin `/auth/me` proxy checks.
- [x] T-040 [ops/test] Add minimal HTTP stack smoke.
  - Verification: `python scripts/p10_stack_smoke.py --env-file _tmp/p10-smoke.env --project-name context_engine_p10_codex --reset-state --write-evidence _tmp/p10-stack-smoke.json` passed.
- [x] T-050 [backend] Record worker container deferral for the first runnable-stack proof.
  - Verification: implementation log states no worker process is needed for P10 auth/proxy smoke and background workflows remain outside first runnable-stack proof.
- [x] T-060 [docs] Update launch runbook and environment guidance.
  - Verification: runbook names required env vars with placeholders only.
- [x] T-070 [security] Add safety scan coverage for compose/env examples and smoke evidence.
  - Verification: `python scripts/p10_safety_scan.py --smoke-evidence _tmp/p10-stack-smoke.json` passed.
- [ ] T-100 [contracts] Patch API-001 and DATA-001 before Logs/Usage/Node/storage UI work.
  - Verification: approved contract diffs.
- [ ] T-110 [frontend] Implement only contracted P10 operator surfaces.
  - Verification: authz tests, import/network audit, and visual screenshots.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Blocked Until Contract Or Fixture Proof

- Runtime Node, Node Environment, Logs, Usage, storage summaries, and operator dashboards are blocked until API-001 and DATA-001 capture DTOs, roles, audit events, and safety rules.
- Worker service containers are deferred for T-010 through T-040 and remain blocked afterward until current repo worker loop entrypoints exist, are tested, and acceptance requires them.
- Browser node/runtime actions are blocked unless they use backend-authorized opaque IDs and never expose raw targets.
- Production secret management is blocked until a deployment-specific secret store is selected; P10 may name env/secret inputs only.

## Notes From Old Compose Evidence

- Reuse service-order ideas: database health -> migration -> API -> frontend.
- Do not reuse stale backend module paths, old `DATABASE_URL`, old `REDIS_URL`, old API port defaults, Redis queue assumptions, status poller, or deployment-control socket access.
- Do not reuse the old custom Postgres image for the first gate; use stock `postgres:16` unless migration evidence proves an extension requirement.
