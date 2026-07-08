---
id: F-010
title: Shared Node Operations And Runnable Stack Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-009]
supersedes: []
---

# F-010 - Shared Node Operations And Runnable Stack

Phase: P10

## Outcome

After P10, a developer or operator can start the current Context Engine application from this checkout, open the Next.js frontend, reach the FastAPI backend through the frontend proxy, sign in with an environment-seeded Administrator, and verify health/auth with Postgres-backed state.

P10 also defines the governed home for shared-mode node operations surfaces: operator dashboard, scoped logs, usage/cost, storage summaries, Runtime Node status, and Docker-backed Node Environment controls. Those richer surfaces are implemented only after their API/data contracts are captured.

## Why Now

P9 establishes the frontend foundation, but it cannot be used interactively unless the backend and database are started in a current-repo deployment shape. P8 intentionally closed with a local compose-replacement smoke, not a deployment compose fixture. P10 now owns that fixture so the product can move from tested slices to a minimally runnable local stack.

## Reference Evidence

The old Context Engine compose file at `.references/code/context-engine/docker-compose.yml` is evidence only. It proves the prior product used Postgres, migrations, API, worker, and runtime-control containers, but it must not be copied unchanged.

Known incompatibilities with the current repo:

- old backend entrypoint: `app.main:create_app`; current entrypoint: `context_engine.app:create_app`;
- old database env: `DATABASE_URL`; current env: `CONTEXT_ENGINE_DATABASE_URL`;
- old API default port: `8010`; current P9 frontend proxy default: `http://127.0.0.1:8000`;
- old Redis/worker/status-poller/deployment-control services are not approved current boundaries;
- old LightRAG runtime URL/container settings expose concepts that current contracts keep private.

## Actors

Developers, Administrators, operators, delivery reviewers.

## In Scope

- Current-repo deployment fixture for local/pilot-like development:
  - one combined compose file or clearly named local fixture for the first gate;
  - stock `postgres:16` service with no AGE/vector custom image for the first gate;
  - migration service;
  - FastAPI API service on `127.0.0.1:8000`;
  - Next.js frontend service on `127.0.0.1:3000` using production build/start mode in the fixture;
  - environment placeholder file or runbook with no committed working secrets.
- Admin bootstrap through `CE_ADMIN_USERNAME` and `CE_ADMIN_PASSWORD` supplied by local environment or secret handling.
- `CONTEXT_ENGINE_DATABASE_URL` wired consistently for migrations and API.
- `CONFIG_ENCRYPTION_KEY` supplied through environment/secret handling, never hard-coded as a real deployment secret.
- Smoke proof for:
  - database readiness;
  - migration from empty;
  - API live/ready;
  - admin login;
  - `/api/v1/auth/me`;
  - frontend login route proxying to the API without `ECONNREFUSED`.
- Current-repo Dockerfile or compose support only where needed by the fixture.
- HTTP smoke only for the first runnable-stack proof. Playwright remains owned by F-009 AC-007 unless P10 later implements contracted operator UI.
- Future P10 contracts for admin/operator shared-node surfaces: Runtime Node status, Node Environment status/actions, scoped logs, usage/cost, storage summaries, and safe dashboard aggregates.

## Out Of Scope

- Copying `.references/code/context-engine/docker-compose.yml` unchanged.
- Redis, RQ, Celery, a generic event bus, or a generic workflow/job platform.
- Old `worker`, `status-poller`, or `deployment-control` containers unless current repo entrypoints and contracts explicitly require replacements.
- Worker containers for T-010 through T-040. T-050 records explicit deferral for the first gate unless current entrypoints and acceptance evidence require a worker later.
- AGE/vector/custom Postgres image requirements for the first gate. Extensions are deferred until migrations, indexing, graph, or node contracts require them.
- Next dev mode as the canonical compose fixture. It may be documented as an optional local development path outside the first-gate fixture.
- Browser access to Docker, storage paths, runtime URLs, controller URLs, provider APIs, database targets, node credentials, or host paths.
- Browser-supplied cost/storage calculations.
- Raw logs, raw runtime payloads, stack traces, provider payloads, prompts, source text, evidence excerpts, or credentials in UI/API/log/screenshot/spec evidence.
- Production-grade secret orchestration beyond naming required env/secret inputs.
- Wiki and Smart Composer durable writes; those belong to F-011.

## Functional Requirements

| ID | Requirement | Source | Verification |
| --- | --- | --- | --- |
| FR-001 | P10 must provide one current-repo compose/local fixture that starts stock `postgres:16`, runs Alembic migrations, starts FastAPI on `127.0.0.1:8000`, and starts the P9 frontend production server on `127.0.0.1:3000`. | RUN-001, F-009 | HTTP compose smoke |
| FR-002 | The fixture must use current env names: `CONTEXT_ENGINE_DATABASE_URL`, `CE_ADMIN_USERNAME`, `CE_ADMIN_PASSWORD`, `CONFIG_ENCRYPTION_KEY`, and `CONTEXT_ENGINE_API_BASE` where applicable. | F-001, API-001, F-009 | config test/review |
| FR-003 | Admin bootstrap must remain environment-driven. No committed spec, fixture, screenshot, or log may contain a real working password. | QA-002 | secret scan |
| FR-004 | The frontend must reach the backend through the approved API proxy path and must not require direct browser knowledge of database, Docker, runtime, storage, or controller targets. | ARCH-002, F-009 | browser/network audit |
| FR-005 | A P10 smoke command must prove login and `/auth/me` from the running stack, not only from in-process tests. | API-001, RUN-001 | smoke script |
| FR-006 | The old compose file may inform service ordering and healthcheck shape, but incompatibilities must be documented before implementation. | AGENTS.md | implementation log |
| FR-007 | Rich node/logs/usage/storage UI surfaces require API-001 and DATA-001 patches before frontend implementation. | CON-000, API-001, DATA-001 | contract gate |
| FR-008 | P10 must not reintroduce Redis/RQ/Celery or a generic worker platform unless an approved spec changes the architecture. | GOV-001, ARCH-002 | import/compose audit |
| FR-009 | P10 first-gate proof must use HTTP smoke against listening services; Playwright is not required until F-009 AC-007 or later contracted P10 UI work. | F-009, F-010 | smoke/test-plan review |

## Data And Contracts

- Contracts currently consumed: API-001, DATA-001, QA-002, QA-003, QA-004, RUN-001, ARCH-002, DESIGN.md, F-009.
- Data changes for the runnable stack foundation: none expected beyond running existing migrations.
- Future P10 data/API contracts may add Runtime Node, Node Environment, usage, storage-summary, or scoped-log DTOs. They must be patched into API-001 and DATA-001 before implementation.

## Primary Flow

1. Operator supplies local environment values or a local ignored env file.
2. Operator starts the single P10 deployment fixture.
3. Stock Postgres becomes healthy.
4. Migration service runs Alembic to head.
5. FastAPI starts, validates config encryption, seeds/rotates the Administrator from environment, and exposes `/health/live`, `/health/ready`, and `/api/v1`.
6. Next.js production server starts and proxies `/api/v1/*` and `/health/*` to the FastAPI service.
7. Operator opens the frontend, signs in, and reaches the authenticated shell.

## Exceptions

| Condition | Required behavior | User-visible result | Evidence |
| --- | --- | --- | --- |
| Postgres is unavailable | API readiness fails safely; no partial success is claimed | Login remains unavailable | smoke failure |
| Migration fails | API does not claim ready stack | start command fails | migration log with safe metadata |
| Admin env is missing | API may start, but login smoke is blocked with explicit missing-env note | No seeded admin login | smoke result |
| API port mismatches frontend proxy | Smoke fails before acceptance | Frontend shows API unavailable | proxy check |
| Docker/runtime target would be exposed to browser | Implementation is blocked | No UI surface shipped | import/network audit |

## Acceptance Criteria

- AC-001: Current-repo compose/deployment fixture starts stock Postgres, migrations, API, and production frontend from a clean checkout.
- AC-002: API is reachable at `http://127.0.0.1:8000` and frontend is reachable at `http://127.0.0.1:3000`.
- AC-003: Admin login and `/api/v1/auth/me` pass through the running stack using environment-seeded credentials.
- AC-004: HTTP smoke through the frontend login/proxy path no longer emits `ECONNREFUSED` for `/api/v1/auth/me` or `/api/v1/auth/login`.
- AC-005: Secret scan over compose/env examples/log/smoke evidence finds no committed working password, provider key, runtime URL, host path, stack trace, raw source text, prompt, answer, or raw payload.
- AC-006: Compose audit shows no Redis/RQ/Celery/generic queue service and no old incompatible service copied from `.references/code/context-engine/docker-compose.yml`.
- AC-007: P10 node/logs/usage/storage UI/API work remains blocked until API-001 and DATA-001 are patched.

## Resolved First-Gate Decisions

| ID | Decision | Rationale | Applies to |
| --- | --- | --- | --- |
| OD-001 | Use one combined compose file or clearly named local fixture for the first gate. | Smallest path to AC-001 through AC-004; split dev/pilot fixtures only when divergence is proven. | T-010 |
| OD-002 | Run the frontend in production build/start mode in the fixture. Document `next dev` only as an optional local path outside compose. | P10 needs repeatable smoke evidence, not fastest iteration. | T-030 |
| OD-003 | Defer worker containers for T-010 through T-040 and record explicit deferral at T-050. | Workers do not fix the frontend proxy/API availability failure and old worker/Redis paths are rejected. | T-050 |
| OD-004 | Use stock `postgres:16` for the first gate. Defer AGE/vector/custom image requirements until migrations or later contracts require them. | Current first-gate migrations/auth smoke do not require extensions; old custom image is evidence only. | T-010 |
| P10-G2 | Use HTTP smoke only for P10 AC-001 through AC-004. Keep Playwright under F-009 AC-007 unless later P10 UI surfaces require browser proof. | HTTP smoke directly proves the connection-refused/proxy failure class with less setup and flakiness. | T-040 |

## Deferred Decisions

Runtime Node, Node Environment, logs, usage/cost, storage summaries, and operator dashboards remain deferred until API-001 and DATA-001 patches are approved.
## Risks And Assumptions

- Risk: copying the old compose reintroduces stale env names, old app entrypoints, Redis, and runtime URL leakage. Mitigation: build a current fixture from active contracts and record old-compose deltas.
- Risk: committing usable credentials violates QA-002. Mitigation: env placeholders only; smoke values stay local.
- Risk: a green database container is mistaken for a runnable app. Mitigation: AC-003 and AC-004 require real API and frontend auth proof.
- Risk: stock Postgres misses a hidden extension dependency. Mitigation: migration smoke is the gate; if it fails, patch the fixture and docs from that evidence.
- Risk: production frontend mode slows local iteration. Mitigation: document `next dev` as optional local workflow, not acceptance evidence.
- Assumption: Minimal post-P10 interaction means login/authenticated shell plus API health/auth, not full document/chat/domain production workflows.
