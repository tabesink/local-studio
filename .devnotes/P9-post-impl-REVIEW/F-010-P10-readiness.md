# F-010 / P10 - Shared Node Operations And Runnable Stack

Scope note: P9 is foundation-complete only. This review prepares P10 from the implemented `T-000` through `T-030` frontend foundation; it does not close full P9 chat, documents, graph, Settings, or visual acceptance.

## Goal

Make the current checkout minimally runnable:

```text
Browser
  -> Next frontend on 127.0.0.1:3000
  -> FastAPI on 127.0.0.1:8000
  -> Postgres
```

Done means a developer/operator can start the stack, open `/login`, sign in with environment-seeded Administrator credentials, reach `/api/v1/auth/me`, and no longer see proxy `ECONNREFUSED` for auth calls.

## Not In The First P10 Gate

| Area | Decision |
| --- | --- |
| Full P9 closeout | Still blocked by SSE fixtures, Playwright screenshots, Settings fixtures, preview/source-ref/graph contracts. |
| Logs/Usage/Runtime Node UI | Blocked until API-001 and DATA-001 define DTOs, roles, audit, and safety rules. |
| Wiki and Smart Composer writes | F-011 only. |
| Old Context Engine compose copy | Evidence only; do not paste it into this repo. |
| Browser Docker/runtime/storage access | Forbidden by AGENTS, GOV-001, ARCH-002, QA-002, and F-010. |

## What Runnable Stack Means Here

| Term | P10 meaning | Not this |
| --- | --- | --- |
| `postgres` | Stock `postgres:16` target for the first gate; current Context Engine schema target for Alembic/API. | Proof that the whole app is usable by itself, or old AGE/vector custom image revival. |
| `migrate` | Runs Alembic to head using `CONTEXT_ENGINE_DATABASE_URL`. | A generic workflow service. |
| `api` | Starts `context_engine.app:create_app` on the agreed API port. | Old `app.main:create_app`. |
| `frontend` | Serves the P9 Next app in production build/start mode and proxies `/api/v1/*` and `/health/*` to FastAPI. | Browser-known database, Docker, runtime, or storage target; canonical `next dev` compose evidence. |
| admin bootstrap | Username/password supplied through local environment handling. | Committed working password in spec, compose, screenshot, log, or fixture. |

## Build Order From `tasks.md`

| Task | Gate | Review note |
| --- | --- | --- |
| T-000 | old compose delta | Record stale entrypoints, env names, ports, Redis/worker/status-poller/deployment-control gaps. |
| T-010 | stock Postgres + migration | Prove empty database reaches Alembic head on stock `postgres:16`. |
| T-020 | FastAPI service | Health and auth endpoints respond from the listening service. |
| T-030 | frontend production service | `/login` loads from `next build` + `next start`; auth calls proxy to API without connection refusal. |
| T-040 | HTTP stack smoke | One command proves DB, migration, API health, admin login, `/auth/me`, frontend `/login`, and frontend proxy. |
| T-050 | worker deferral | Record no worker process is needed for the first auth/proxy smoke. |
| T-060 | runbook/env | Placeholder-only env guidance; no working credentials. |
| T-070 | safety scan | Scan compose, env examples, runbook, and smoke evidence. |
| T-100/T-110 | node/logs/usage/storage | Contract patch first, UI second. |

## Accepted First-Gate Decisions

| Decision | Accepted path |
| --- | --- |
| Compose shape | one combined compose file or clearly named local fixture |
| Postgres | stock `postgres:16`; AGE/vector/custom image deferred |
| Frontend mode | production build/start in compose; `next dev` optional local workflow only |
| Workers | deferred for T-010 through T-040; T-050 records deferral |
| Browser proof | HTTP smoke only for P10 AC-001 through AC-004; Playwright remains F-009 AC-007 |

## Lifecycle Flow

```text
operator supplies local env
  -> start stack
  -> postgres healthy
  -> migrate to head
  -> api starts and seeds Administrator from env
  -> frontend starts with proxy aligned to API
  -> login succeeds
  -> /api/v1/auth/me returns safe user/session DTO
```

Failure is useful only when it names the missing layer. A green database with a dead API does not satisfy P10. A working API with a frontend proxy mismatch does not satisfy P10.

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| Compose/runbook | service order, env names, health/smoke command | product DTO invention |
| Postgres | current schema through migrations | app readiness by itself |
| FastAPI | auth, session cookie, admin seed, health, API truth | leaked credentials or stack traces |
| Next frontend | P9 shell and same-origin proxy | direct database/Docker/runtime/provider/storage targets |
| Future operator UI | safe DTO rendering after contracts | raw logs, local cost math, raw runtime controls |

## P9 Dependency Gate

| P9 proof | Status | Effect on P10 |
| --- | --- | --- |
| shared `ceFetch` | implemented | P10 can rely on same-origin `/api/v1` proxy. |
| 401 auth clearing | foundation test pass | live stack still must prove browser auth. |
| storage allowlist | foundation test pass | P10 must not add credential/browser infrastructure keys. |
| shell routes | foundation test pass | P10 can use `/login` and authenticated shell as smoke targets. |
| Settings admin panels | partial | Do not build richer node/operator settings until contracts exist. |
| chat streaming UI | blocked | Not needed for first runnable-stack smoke. |
| documents preview/source-ref/graph data | blocked | Not needed for first runnable-stack smoke. |

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner |
| --- | --- | --- |
| A1 | Does the runnable foundation need public API shape changes? Expected answer: no. | F-010 |
| A2 | Do Runtime Node, logs, usage, or storage summaries need DTOs before UI? Expected answer: yes. | API-001/DATA-001 |
| A3 | Does admin seed change user/session DTOs? Expected answer: no, use existing P1 auth contract. | API-001 |

### B. Runtime/controller/private blockers

| # | Question | Owner |
| --- | --- | --- |
| B1 | Is any browser-visible field a database/Docker/runtime/storage/provider target? If yes, stop. | ARCH-002/QA-002 |
| B2 | Are old deployment-control or status-poller containers approved current boundaries? No. | F-010 |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner |
| --- | --- | --- |
| C1 | Does P10 need current worker loop containers to prove login/auth? No. | T-050 |
| C2 | If worker services are added, do current repo entrypoints and tests exist? Must prove before compose service. | T-050 |

### D. Delete/redaction/destructive-state blockers

| # | Question | Owner |
| --- | --- | --- |
| D1 | Does stack cleanup delete volumes? Runbook must make destructive cleanup explicit. | RUN-001/F-010 |

### E. Storage/private data blockers

| # | Question | Owner |
| --- | --- | --- |
| E1 | Do examples include only placeholders? Must be true. | QA-002 |
| E2 | Does smoke output include raw paths, stack traces, prompt/source/answer text, or payloads? Must be false. | QA-002/QA-003 |

### F. Authz/roles blockers

| # | Question | Owner |
| --- | --- | --- |
| F1 | Is Administrator bootstrap env-driven and not committed? Must be true. | F-010 |
| F2 | Do member/admin UI differences rely on backend authorization, not hidden controls alone? Must be true for later UI. | API-001/PROD-004 |

### G. Test/evidence blockers

| # | Question | Owner |
| --- | --- | --- |
| G1 | Does smoke hit actual listening services instead of in-process clients only? Must be true. | F-010 test-plan |
| G2 | Does frontend `/login` prove proxy alignment? Must be true before AC-004. | F-010 |
| G3 | Does safety scan cover compose/env/runbook/smoke evidence? Must be true. | T-070 |

## Acceptance As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | Current fixture starts Postgres, migration, API, and frontend from clean state. |
| AC-002 | API and frontend are reachable on the F-010 ports. |
| AC-003 | Env-seeded Administrator login and `/auth/me` pass through the running stack. |
| AC-004 | Frontend auth proxy no longer emits connection refused for `/api/v1/auth/me` or `/api/v1/auth/login`. |
| AC-005 | Safety scan finds no committed working credentials, raw paths, runtime targets, stack traces, prompt/source/answer text, or raw payloads. |
| AC-006 | Compose audit rejects stale Redis/RQ/Celery and old incompatible services. |
| AC-007 | Logs/Usage/Node/storage UI remains blocked until API/data contracts are patched. |

## Junior Dev Reading Order

1. `AGENTS.md`
2. `README.md`
3. `specs/00-governance/constitution.md`
4. `CONTEXT.md`
5. `DESIGN.md`
6. `specs/04-features/F-009-frontend-delivery/acceptance.md`
7. `specs/04-features/F-009-frontend-delivery/implementation-log.md`
8. `specs/04-features/F-010-shared-node-operations/`
9. `specs/03-contracts/api/context-engine-v1.md`
10. `specs/03-contracts/data/context-engine-data.md`
11. `specs/05-quality/security-and-privacy.md`
12. `specs/02-architecture/component-boundaries.md`
13. `.references/code/context-engine/docker-compose.yml`

## Practical Start Checklist

- Confirm old compose deltas in the implementation log before editing deployment files.
- Add stock `postgres:16` and migration first.
- Start API with current module path and current env names.
- Run the frontend in production build/start mode for compose evidence.
- Align frontend proxy with API before debugging login UI.
- Keep admin bootstrap values local/ignored.
- Add HTTP smoke proof before richer UI.
- Record worker deferral at T-050.
- Keep node/logs/usage/storage dashboard work blocked until contracts land.

## Reference Comparison

| Question | Old compose evidence | Greenfield delta |
| --- | --- | --- |
| DB service | Prior product used Postgres. | Current repo must use current env name and migrations. |
| API entrypoint | Old module path. | Current target is `context_engine.app:create_app`. |
| API port | Old default differs. | P9 frontend defaults to the F-010 API port. |
| Workers | Old worker/status services existed. | Current worker containers require current entrypoints and explicit P10 decision. |
| Runtime control | Old compose included deployment-control style service. | Browser and public API cannot expose Docker/runtime targets. |
| Queues | Old Redis/worker assumptions existed. | Redis/RQ/Celery are rejected unless a later approved spec changes this. |

Verdict for junior dev: build the smallest current stack that proves auth through the frontend; do not revive old infrastructure just because it existed in the reference.

One-line summary: P10 should first make the current P9 foundation usable against a real FastAPI/Postgres stack, then stop before any uncontracted node/operator UI.
