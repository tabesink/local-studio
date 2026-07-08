# F-010 / P10 Reconciled Design Gates

Status: review decision draft  
Feature: F-010 - Shared Node Operations And Runnable Stack  
Date: 2026-07-06  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P9-post-impl-REVIEW/F-010-P10-readiness.md`.

It is not implementation authority by itself. Before coding or claiming acceptance, update the source-of-truth files named below and then implement the approved tasks.

Canonical patch targets:

- `specs/04-features/F-010-shared-node-operations/implementation-log.md`
- `specs/06-delivery/runbooks/pilot-launch.md` or a new F-010 launch runbook linked from it
- P10 deployment fixture files selected by T-010
- P10 smoke/safety scripts selected by T-040/T-070
- `specs/04-features/F-010-shared-node-operations/acceptance.md`
- `specs/07-traceability/feature-register.md`

Conditional patch targets:

- `specs/03-contracts/api/context-engine-v1.md` before any Runtime Node, Node Environment, logs, usage, storage, or dashboard API work
- `specs/03-contracts/data/context-engine-data.md` before any persisted or computed node/log/usage/storage truth
- `specs/04-features/F-010-shared-node-operations/spec.md`, `plan.md`, and `test-plan.md` only if P10 changes the already-approved runnable-stack shape

User decisions folded in after review:

- OD-001: one combined compose file or clearly named local fixture for the first gate.
- OD-004: stock `postgres:16`; AGE/vector/custom image work deferred until migrations or later contracts require it.
- OD-002: production Next build/start in compose; `next dev` optional outside compose only.
- OD-003: worker containers deferred for T-010 through T-040 and recorded as deferral at T-050.
- P10 browser proof: HTTP smoke only for AC-001 through AC-004; Playwright remains F-009 AC-007.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `specs/00-governance/constitution.md`
- `CONTEXT.md`
- `DESIGN.md`
- `specs/02-architecture/system-context.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/observability.md`
- `specs/05-quality/test-strategy.md`
- `specs/05-quality/performance-and-resilience.md`
- `specs/06-delivery/runbooks/pilot-launch.md`
- `specs/07-traceability/feature-register.md`
- `specs/04-features/F-009-frontend-delivery/acceptance.md`
- `specs/04-features/F-009-frontend-delivery/implementation-log.md`
- `specs/04-features/F-009-frontend-delivery/test-plan.md`
- `specs/04-features/F-010-shared-node-operations/spec.md`
- `specs/04-features/F-010-shared-node-operations/plan.md`
- `specs/04-features/F-010-shared-node-operations/tasks.md`
- `specs/04-features/F-010-shared-node-operations/test-plan.md`
- `specs/04-features/F-010-shared-node-operations/acceptance.md`
- `specs/04-features/F-010-shared-node-operations/implementation-log.md`
- `specs/04-features/F-010-shared-node-operations/ux.md`
- `.devnotes/P9-post-impl-REVIEW/F-010-P10-readiness.md`
- `.devnotes/P9-post-impl-REVIEW/ID-A.md`
- `.devnotes/P9-post-impl-REVIEW/ID-A-runnable-stack.md`
- `.devnotes/P9-post-impl-REVIEW/ID-A-api-proxy-and-admin-seed.md`
- `.devnotes/P9-post-impl-REVIEW/ID-A-node-ops-contract-gate.md`
- `.devnotes/P9-post-impl-REVIEW/ID-A-p9-carry-forward-gates.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `frontend/next.config.ts`
- `frontend/src/lib/api/client.ts`
- `frontend/src/state/auth-store.ts`
- `frontend/tests/foundation.test.mjs`
- `context_engine/app.py`
- `context_engine/config.py`
- `tests/test_foundation_auth.py`
- `.references/code/context-engine/docker-compose.yml`

## Product DNA Locks

- Use canonical terms: Administrator, Member, Runtime Node, Node Environment, Usage Event, Knowledge Domain, Source Document, Evidence, Citation.
- P10 first creates a current-repo runnable stack gate. It does not complete full P9.
- The first gate owns Postgres service startup, Alembic migration, FastAPI service startup, Next frontend startup, admin auth smoke, and safe launch evidence.
- The frontend stays thin. Browser code may call only Context Engine API/SSE paths and may not learn database, Docker, runtime, storage, provider, controller, or node targets.
- FastAPI owns auth, sessions, admin bootstrap, health, safe errors, and API truth.
- Postgres is necessary but not sufficient. A healthy database is not a healthy app.
- Stock `postgres:16` is the first-gate database target; old AGE/vector custom image work is deferred until evidence requires it.
- The canonical frontend fixture uses production build/start mode; `next dev` is a local convenience only.
- P10 first-gate proof is HTTP smoke against listening services. Playwright remains F-009 AC-007.
- Worker containers are deferred for the first auth/proxy gate.
- Old Context Engine compose is evidence only. Do not copy stale entrypoints, env names, ports, Redis, status-poller, deployment-control, or runtime-control concepts.
- KISS/YAGNI: no Redis/RQ/Celery, generic event bus, generic workflow/job platform, production secret orchestrator, or operator dashboard before the approved contracts require them.
- Logs/Usage/Runtime Node/storage UI must wait for API-001 and DATA-001 patches.
- P9 carry-forward is foundation only: route shell, safe API client, cookie auth store, storage allowlist, and rail proof.

## Recommended Build Shape

```text
P10 runnable stack, first gate

local env / ignored env file
  -> postgres
       stock postgres:16
       owns current DATA-001 schema
       health gates migration
  -> migrate
       runs Alembic to head using CONTEXT_ENGINE_DATABASE_URL
  -> api
       starts context_engine.app:create_app
       validates config encryption
       seeds/rotates Administrator from env
       serves health and /api/v1 auth
  -> frontend
       runs production build/start mode
       serves P9 foundation shell
       proxies /api/v1/* and /health/* to FastAPI
  -> stack smoke
       HTTP only for first gate
       proves DB, migration, API health, admin login, /auth/me, frontend proxy

future P10 operator surfaces
  -> blocked until API-001 + DATA-001 define safe DTOs
```

## A. Contract / Data / API Gates

### A1. Does the runnable foundation need public API shape changes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no public API shape change for T-010 through T-040 | Lowest entropy; uses P1 health/auth and P9 proxy; avoids contract churn | Smoke may reveal implementation bugs but not new product behavior | `GET /health/ready`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` |
| Option 2: add deployment-specific auth/bootstrap endpoints | Makes smoke explicit | Expands public API for a deployment concern | `/api/v1/admin/bootstrap` |
| Option 3: frontend-local mock login | Quick demo | Violates backend authority and hides the real proxy failure | local user object in browser |

Recommendation: Option 1. The runnable foundation must not patch public API or data contracts unless implementation discovers a mismatch with existing P1 health/auth behavior.

User decision: accepted Option 1.

Patch F-010 implementation evidence with:

```text
No public API/DATA shape change for T-010 through T-040.
Existing endpoints used:
  GET /health/live
  GET /health/ready
  POST /api/v1/auth/login
  GET /api/v1/auth/me
```

Patch P10 smoke with:

```text
assert health live succeeds
assert health ready succeeds
assert admin login succeeds
assert login response has no token/password/hash
assert /api/v1/auth/me succeeds with the cookie
```

### A2. Do Runtime Node, logs, usage, or storage summaries need DTOs before UI?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: contract first, UI second | Matches CON-000, API-001, DATA-001, QA-002, DESIGN.md | Delays operator dashboard visuals | typed Runtime Node status DTO |
| Option 2: inactive placeholders only | Can show reserved ownership without inventing behavior | Easy to misread as shipped controls | absent or unavailable Settings section |
| Option 3: build UI from raw runtime/log data | Fastest to see something | Leaks private infrastructure and violates P10 scope | raw log tail, browser cost math |

Recommendation: Option 1 for any working surface. Option 2 is allowed only for absent or clearly inactive reserved sections. Do not build working Logs/Usage/Runtime Node/storage UI in the first P10 gate.

Patch API-001 with, before UI:

```text
routes:
  Runtime Node read endpoints
  Node Environment read/action endpoints
  scoped log read endpoints
  usage/cost read endpoints
  storage summary read endpoints

rules:
  administrator/operator authorization
  safe error envelope
  pagination/filtering where lists exist
  no browser-supplied private targets
  no raw log/source/prompt/answer/provider/runtime payloads
```

Patch DATA-001 with, before UI:

```text
typed tables or explicit computed-only formulas for:
  Runtime Node identity/status
  Node Environment lifecycle
  Usage Event measurements
  storage summaries
  scoped log metadata

closed enums:
  lifecycle states
  usage source: reported | estimated | unavailable
  operation outcome/status
```

Open decision: exact DTOs for Runtime Node/logs/usage/storage are deferred to F-010 T-100. Owner patch targets: API-001 and DATA-001.

### A3. Does admin seed change user/session DTOs?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no DTO change; seed through env and existing P1 auth | Matches current backend and API-001 | Needs local env discipline | `CE_ADMIN_USERNAME`, `CE_ADMIN_PASSWORD` |
| Option 2: add bootstrap response fields | More explicit startup diagnostics | Risks leaking credential/auth internals | `seeded: true` on login response |
| Option 3: frontend-defined admin account | Quick local demo | Violates backend-owned auth/session model | browser hard-coded Administrator |

Recommendation: Option 1. Admin seed is backend startup behavior, not a new public contract.

User decision: accepted Option 1.

Patch runbook/env guidance with:

```text
Required local inputs:
  CE_ADMIN_USERNAME
  CE_ADMIN_PASSWORD

Rules:
  values supplied by local environment or ignored env file
  no committed working values
  smoke output does not print password, password hash, session token, or cookie value
```

No API-001 or DATA-001 patch is needed for the first P10 admin seed gate.

## B. Runtime / Controller / Private Gates

### B1. Is any browser-visible field a database/Docker/runtime/storage/provider target?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no browser-visible private targets | Preserves thin browser and QA-002 | Requires backend-owned diagnostics | frontend only sees safe API status |
| Option 2: expose safe opaque node IDs after contracts | Enables future operator workflows | Needs API/DATA/authz/audit patches | `runtimeNodeId` as server-issued opaque id |
| Option 3: expose raw service targets for local debugging | Easy for developers | Violates AGENTS, GOV-001, ARCH-002, QA-002, and F-010 | container name, socket, database target |

Recommendation: Option 1 for runnable foundation. Option 2 only after T-100 contracts. Option 3 is rejected.

User decision: accepted Option 1.

Patch P10 smoke/safety audit with:

```text
scan frontend bundle/config output and smoke evidence for:
  database target details
  Docker endpoint details
  runtime/controller target details
  storage target details
  provider target details
```

Patch implementation-log if any service must know a private target:

```text
private target stays server/container environment only
no browser DTO, log, screenshot, fixture, or spec evidence contains it
```

### B2. Are old deployment-control or status-poller containers approved current boundaries?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no; exclude them from first P10 fixture | Matches F-010 and KISS/YAGNI | Later worker/operator behavior needs separate proof | no status-poller service |
| Option 2: copy old services unchanged | Faster compose parity | Stale entrypoints/env names and private boundary drift | old status-poller/deployment-control |
| Option 3: add current replacements after contracts/tests | Allows future operations | More work and not needed for auth smoke | contracted Runtime Node controller service |

Recommendation: Option 1 for T-010 through T-040. Option 3 can be considered only after a later contract patch. Option 2 is rejected.

User decision: accepted Option 1.

Patch F-010 implementation-log T-000 with old compose deltas:

```text
old app.main:create_app -> current context_engine.app:create_app
old DATABASE_URL -> current CONTEXT_ENGINE_DATABASE_URL
old API default port -> P10 API port
old Redis/RQ assumptions -> not approved
old status-poller -> not approved
old deployment-control/socket access -> not approved
old runtime URL/container settings -> private and not browser/API surface
```

## C. Worker / Concurrency / Idempotency Gates

### C1. Does P10 need current worker loop containers to prove login/auth?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: no worker in first auth stack | Smallest stack that fixes the proxy failure | Upload/index/delete workflows remain unproven in this gate | postgres + migrate + api + frontend |
| Option 2: optional worker decided at T-050 | Lets P10 extend after foundation | Needs current entrypoints and tests | `worker` service after proof |
| Option 3: copy old worker/status services now | Looks complete | Stale module paths and queue assumptions | old Redis-backed worker |

Recommendation: Option 1 for T-010 through T-040. Use T-050 to explicitly defer or implement current workers.

User decision: accepted Option 1 for the first gate.

Patch F-010 implementation-log with:

```text
Worker services are not required for the minimal frontend/backend auth smoke.
T-050 will either:
  defer worker containers for this phase, or
  add only current repo worker entrypoints with tests.
```

### C2. If worker services are added, do current repo entrypoints and tests exist?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: defer until current entrypoints are named and tested | Safe and aligned with F-010 | No background processing service in first stack | implementation-log deferral |
| Option 2: add current worker service after proof | Supports richer flows | Expands P10 beyond the first gate | current Postgres-backed worker loop |
| Option 3: reuse old worker command | Fastest copy | Wrong module path, old queue assumptions | old `app.workers.worker` |

Recommendation: Option 1 unless T-050 produces a current entrypoint, tests, and acceptance need. Option 3 is rejected.

User decision: accepted Option 1. T-050 records explicit deferral for the first runnable-stack proof.

Patch T-050 evidence with one of:

```text
Deferred:
  no worker process needed for P10 auth/proxy smoke
  background document/index/delete workflows remain outside first runnable-stack proof

Implemented:
  current worker command
  current dependencies
  tests proving source prep/index/delete behavior through Postgres leases
```

## D. Delete / Redaction / Destructive-State Gates

### D1. Does stack cleanup delete volumes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: preserve by default, explicit destructive cleanup | Safest local operator behavior | Requires clear runbook wording | `stop` vs separate reset procedure |
| Option 2: delete volumes on normal stop | Keeps local state clean | Data loss risk | stop command removes database |
| Option 3: never document cleanup | Avoids destructive guidance | Leaves users guessing and causes stale-state bugs | no reset instructions |

Recommendation: Option 1. Normal stop preserves local state. Destructive cleanup must be a separate, clearly labeled runbook step.

Patch runbook with:

```text
Stop:
  stops services
  preserves local database and generated state

Reset:
  explicitly destructive
  removes local database/generated state
  requires a clear warning before the command
```

Patch acceptance evidence with whether smoke ran from:

```text
clean state
existing state
explicit reset state
```

## E. Storage / Private Data Gates

### E1. Do examples include only placeholders?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: placeholders only in committed files | Meets QA-002 | Developer must create local values | `<set locally>` |
| Option 2: commit convenient local defaults | Easy first run | Creates credential drift and unsafe evidence | working admin password |
| Option 3: no env example | Avoids leakage | Harder for operators | missing required vars |

Recommendation: Option 1. Use placeholders in committed docs/examples and local ignored values for real runs.

Patch env guidance with:

```text
CONTEXT_ENGINE_DATABASE_URL=<set locally>
CE_ADMIN_USERNAME=<set locally>
CE_ADMIN_PASSWORD=<set locally>
CE_SESSION_COOKIE_SECURE=<set locally>
CONFIG_ENCRYPTION_KEY=<set locally>
CONTEXT_ENGINE_API_BASE=<set locally when frontend proxy target differs>
```

Patch safety scan to fail on:

```text
working credential-looking values
provider key-looking values
session token-looking values
password hash-looking values
```

### E2. Does smoke output include raw paths, stack traces, prompt/source/answer text, or payloads?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: smoke emits safe summaries only | QA-002/QA-003 compliant | Less debug detail in artifacts | service, check, pass/fail, safe id |
| Option 2: capture full container logs as evidence | Useful debugging | High leakage risk | raw trace, private target, payload |
| Option 3: no smoke artifact | Avoids leakage | Weak acceptance evidence | pass/fail only in console |

Recommendation: Option 1. Debug detail stays local; committed acceptance evidence stores safe summaries.

Patch smoke output contract with:

```text
allowed:
  check name
  service name
  pass/fail
  safe HTTP status
  safe error code
  request id
  elapsed ms

forbidden:
  request/response bodies except safe auth user/session DTO checks
  cookie value
  password or hash
  raw exception text
  host/private target details
  prompt/source/answer text
  provider or runtime payload
```

Patch safety scan over:

```text
compose/deployment fixture
env examples
runbook
smoke output
acceptance evidence
screenshots if any
```

## F. Authz / Roles Gates

### F1. Is Administrator bootstrap env-driven and not committed?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: env-driven seed/rotate on API startup | Matches current backend and tests | Requires local setup | `CE_ADMIN_USERNAME`, `CE_ADMIN_PASSWORD` |
| Option 2: admin create CLI for first run | Explicit operator step | More tooling, still needs secret handling | `create-admin` command |
| Option 3: committed default account | One-command demo | Violates QA-002 and creates bad habit | default working credentials |

Recommendation: Option 1. Current backend already seeds/rotates Administrator from env in app startup; P10 must prove it through the running service.

Patch P10 smoke with:

```text
start API with local env-provided admin values
POST /api/v1/auth/login
assert Administrator role in safe user DTO
assert response omits token/password/hash
GET /api/v1/auth/me with HttpOnly cookie
```

Patch runbook with:

```text
Admin bootstrap values are required for auth smoke.
Values are supplied locally and are not committed.
Changing CE_ADMIN_PASSWORD rotates the seeded Administrator password on next startup.
```

### F2. Do member/admin UI differences rely on backend authorization, not hidden controls alone?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: backend authz is final; UI visibility is usability | Matches AGENTS and API-001 | Requires route tests for operator surfaces | member gets 403 on admin route |
| Option 2: hide controls and trust UI | Simple | Security bug if endpoint remains callable | no backend check |
| Option 3: no member tests until operator UI | Less work now | Can regress later | skipped 403 coverage |

Recommendation: Option 1. First P10 auth smoke proves admin login; future operator surfaces must include member 403 tests. Do not build working admin/operator controls without backend checks.

Patch future operator UI test plan with:

```text
unauthenticated -> 401
Member -> 403
Administrator/operator role -> allowed when contract permits
denied admin/operator attempts are safe and audited where required
```

For the runnable-stack foundation, do not claim admin/member UI acceptance beyond login/authenticated shell proof.

## G. Test / Evidence Gates

### G1. Does smoke hit actual listening services instead of in-process clients only?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: actual listening services | Proves the real failure class | Slower and needs process/container orchestration | API service port and frontend service port |
| Option 2: in-process TestClient only | Fast and deterministic | Does not prove proxy or port alignment | FastAPI app in memory |
| Option 3: manual browser-only check | Realistic | Hard to repeat and weak CI evidence | user opens login page |

Recommendation: Option 1. In-process auth tests remain useful but do not satisfy P10 AC-001 through AC-004.

User decision: accepted Option 1.

Patch smoke script with checks:

```text
postgres health
alembic head from clean database
API live health through service port
API ready health through service port
admin login through service port
/api/v1/auth/me through service port with cookie
frontend /login through frontend service port
frontend proxy route reaches API
```

### G2. Does frontend `/login` prove proxy alignment?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: HTTP smoke against frontend proxy | Directly proves `ECONNREFUSED` is gone | Does not prove all browser interactions | call same-origin `/api/v1/auth/me` through frontend |
| Option 2: Playwright login flow | Stronger user proof | More setup, may need browser install | fill login form and assert shell |
| Option 3: API-only login smoke | Proves backend only | Misses original proxy failure | direct API auth call |

Recommendation: Option 1 is required for first P10. Option 2 is deferred to F-009 AC-007 unless later contracted P10 UI surfaces require it. Option 3 alone is insufficient.

User decision: accepted Option 1; Playwright is out of the first P10 runnable-stack proof.

Patch F-010 acceptance with exact evidence:

```text
frontend /login loaded
frontend same-origin /api/v1/auth/me reached API
frontend same-origin /api/v1/auth/login reached API
no connection refused failure
```

Resolved: P10 uses HTTP smoke for AC-001 through AC-004. Browser automation remains F-009 AC-007.

### G3. Does safety scan cover compose/env/runbook/smoke evidence?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Option 1: scan all committed deployment/evidence files | Strong QA-002 coverage | Needs allowlist for env var names and policy words | compose, env example, runbook, smoke output |
| Option 2: scan source code only | Catches some leaks | Misses acceptance artifacts | frontend scan only |
| Option 3: manual review only | Flexible | Weak repeatability | reviewer eyeballs output |

Recommendation: Option 1. Allow env variable names and policy category words; fail concrete private values and raw diagnostic artifacts.

Patch T-070 safety scan with:

```text
inputs:
  deployment fixture files
  env examples
  runbook docs
  smoke evidence files
  acceptance evidence rows
  screenshots if generated

allowed:
  env var names
  route names
  safe request ids
  safe status/error codes
  policy category words

fail:
  working credentials
  token-looking values
  password hashes
  private host paths
  raw stack traces
  raw request/response bodies
  raw prompt/source/answer text
  raw provider/runtime payloads
  browser-visible database/Docker/runtime/storage/provider targets
```

## Contract Patch Order For Junior Dev

1. Confirm T-000 old compose deltas and record them in `specs/04-features/F-010-shared-node-operations/implementation-log.md`.
2. Implement T-010 as one combined compose/local fixture with stock `postgres:16`.
3. Patch or create the launch runbook/env guidance with placeholder-only required values.
4. Add Postgres and migration fixture.
5. Add FastAPI service using `context_engine.app:create_app` and current env names.
6. Implement T-030 as production Next build/start in compose; document `next dev` only as optional local workflow.
7. Add frontend launch/service aligned to API proxy.
8. Add HTTP stack smoke for actual listening services.
9. Add safety scan over compose/env/runbook/smoke evidence.
10. Record T-050 worker container deferral for the first runnable-stack proof.
11. Update F-010 `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
12. Stop. Patch API-001 and DATA-001 only before later Logs/Usage/Runtime Node/storage UI/API work.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| Old `DATABASE_URL` is used for current services | Current config reads `CONTEXT_ENGINE_DATABASE_URL`; old env name hides broken startup. | Use current env names from F-010 and `context_engine/config.py`. |
| API service starts `app.main:create_app` | That is the old reference entrypoint, not this repo. | Use `context_engine.app:create_app`. |
| Redis/RQ/Celery appears in the first fixture | F-010 rejects stale queue/workflow infra for the runnable foundation. | Add only `postgres`, `migrate`, `api`, and `frontend` unless an approved spec changes scope. |
| Custom AGE/vector Postgres image appears in the first fixture without migration evidence | The first gate needs auth/proxy proof, not graph/index storage assumptions. | Use stock `postgres:16`; patch only if clean migration fails. |
| Compose runs `next dev` as canonical evidence | Dev server behavior is not the repeatable P10 gate. | Use production build/start in compose; document dev mode separately. |
| Playwright is required for P10 AC-001 through AC-004 | It adds setup cost without proving more than HTTP proxy smoke for this failure class. | Keep P10 first gate to HTTP smoke; Playwright stays F-009 AC-007. |
| Status-poller or deployment-control is copied from reference compose | These are old boundaries with private runtime-control risk. | Record old-compose delta; do not copy the services. |
| A committed file contains a working admin password or provider key-looking value | Violates QA-002 and pollutes evidence. | Use placeholders in committed files and local ignored values for real runs. |
| Smoke passes API health but never hits frontend proxy | It misses the original failure mode. | Prove `/login` and same-origin `/api/v1` proxy reach FastAPI. |
| Smoke uses only an in-process client | It does not prove listening ports, compose wiring, or proxy alignment. | Run against actual services. |
| Browser-visible config includes database, Docker, runtime, storage, provider, or controller target detail | Violates browser-thin boundary and F-010. | Browser gets only same-origin API/SSE paths and safe DTOs. |
| P9 is marked implemented after P10 stack starts | P9 still has blocked chat/documents/graph/visual/SSE gates. | Update only the specific F-009 evidence actually proven. |
| Logs/Usage/Runtime Node UI appears before API-001/DATA-001 patches | Invents product behavior and leaks private boundary risk. | Contract first, UI second. |
| Normal stop deletes local database volumes | Destructive behavior must be explicit and separately labeled. | Preserve by default; reset is a named destructive step. |
| Safety scan ignores runbook/smoke evidence | Leaks often land in docs and artifacts, not only code. | Scan deployment files, env examples, runbook, smoke output, and acceptance evidence. |

## Context And ADR Notes

`CONTEXT.md` does not need a patch for the first P10 runnable-stack gate. It already defines Runtime Node, Node Environment, Usage Event, Administrator, and Member.

No ADR is needed for the first P10 gate. The decision is already governed by F-010, RUN-001, ARCH-002, QA-002, and the constitution: build a current minimal stack and reject stale reference compose drift.

Consider an ADR only if P10 chooses a hard-to-reverse deployment model beyond the approved local fixture, adds a new worker platform, chooses production secret orchestration, or introduces Runtime Node/Node Environment persistence that materially changes API/DATA ownership.

## QA

- Readiness question IDs covered: A1, A2, A3, B1, B2, C1, C2, D1, E1, E2, F1, F2, G1, G2, G3.
- Open decisions still blocking coding: none for T-010 through T-040. T-100 Runtime Node/logs/usage/storage DTOs remain open before any operator UI.
- Forbidden-string scan result: no concrete token value, working credential, host path, raw stack trace, raw source text, prompt/answer payload, or raw provider/runtime payload should appear. Policy words and env var names are intentional.
- Output path written: `.devnotes/P9-post-impl-REVIEW/F-010-P10-reconciled-design-gates.md`.
- Style parity confirmed: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes, QA.
