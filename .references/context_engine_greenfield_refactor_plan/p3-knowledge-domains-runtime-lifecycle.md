# Context Engine — Phase 3: Knowledge Domains and Private Runtime Lifecycle

**Status:** Greenfield implementation plan — hard-delete, low-entropy revision  
**Build style:** API-first. Junior-dev friendly.  
**Depends on:** Phase 1 — Trusted Application Foundation; Phase 2 — Trusted Provider, Model, and Parser Configuration.  
**Goal:** Create one authoritative Knowledge Domain registry. Admin can create, start, stop, inspect, and permanently delete one isolated, empty LightRAG runtime per domain.  
**Excluded from Phase 3:** Browser UI, documents, parsing, source artifacts, queues/workers, LightRAG document APIs, ingestion, retrieval, chat, SSE, provider discovery/tests, provider calls, runtime-log UI, status poller, archive, restore, repair/recreate/regenerate actions, Kubernetes, multi-host orchestration, legacy migration.

## Related Contract Links

- [P3 §3.2 — Networks](#32-networks)
- [P3 §3.4 — Domain controller auth token](#34-domain-controller-auth-token)
- [P3 §6 — Low-entropy domain state model](#6-low-entropy-domain-state-model)
- [P3 §8 — Hard-delete contract](#8-hard-delete-contract)
- [P3 §9 — Fencing and stale-operation reconciliation](#9-fencing-and-stale-operation-reconciliation)

---

## 0. Read This First

### Build target

```text
Admin API client / curl / tests
        ↓
Context Engine API
  ├─ require_admin
  ├─ DomainLifecycleService
  ├─ DomainAvailabilityResolver
  ├─ PostgreSQL
  │   ├─ domains
  │   └─ domain_operations
  └─ private DomainControllerClient
        ↓ internal-only control network
Domain Lifecycle Controller
  ├─ narrow Docker Engine access
  ├─ private per-domain workspace/log root
  ├─ private per-domain LightRAG database
  ├─ fixed runtime create/start/stop/remove/inspect
  └─ bounded HTTP health probe
        ↓ private runtime network
One pinned private LightRAG runtime per started domain
  ├─ no published host port
  ├─ one isolated workspace/log root
  └─ one isolated LightRAG storage database
```

### Phase 3 proves

```text
admin login
→ create domain with one valid embedding profile
→ controller provisions empty workspace/log root + empty runtime database
→ start domain
→ controller verifies private HTTP health
→ member sees available domain
→ admin stops domain
→ member no longer sees it
→ admin hard-deletes domain
→ runtime container removed
→ runtime database dropped
→ workspace/log root recursively deleted
→ domain row + lifecycle-operation rows deleted
→ domain ID may be reused as a new isolated instance
```

### Hard-delete rule

`DELETE /api/v1/admin/domains/{domain_id}` is irreversible.

Successful delete leaves no domain-owned resource:

```text
no runtime container
no runtime database
no workspace
no runtime logs
no domains row
no domain_operations rows
no archive folder
no tombstone
no restore path
```

Application-wide request logs may retain generic request telemetry under Phase 1 logging policy. They must not retain runtime paths, database names, container IDs, raw engine output, provider data, or secrets.

### Phase boundary

```text
Phase 3 owns:
  domain registry
  empty runtime lifecycle
  runtime health observation
  member-safe availability
  hard delete

Phase 3 does not own:
  documents
  source files
  parsing
  indexing
  retrieval
  evidence
  chat
  provider execution
  browser UI
  jobs/workers
  archive/restore
```

### Critical Phase 2 compatibility rule

Phase 2 remains sole owner of provider credentials, model profiles, parser selection, and private configuration resolution.

Phase 3 stores only:

```text
embedding_profile_id
```

It never stores, writes, returns, or mounts:

```text
provider credential
credential ciphertext
provider endpoint/base URL
model-profile JSON
LLM profile snapshot
embedding API key
runtime secret name
browser-visible runtime configuration
generated domain.env
generated Compose file
```

Domain creation validates that the selected profile is an existing `embedding` profile and privately resolvable through `TrustedRuntimeResolver`. Discard resolved private configuration immediately. No provider request occurs.

Empty Phase 3 runtime uses only a health-only bootstrap. Create, start, stop, status, and delete must not contact a model provider.

---

## 1. Decisive Simplifications

### 1.1 One domain state axis

Persist only stable domain facts:

```ts
type DomainState =
  | "stopped"
  | "running"
  | "deleting";
```

Do not persist:

```text
provisioning
starting
stopping
failed
archived
available
health enum
```

### 1.2 Work is not domain state

In-flight lifecycle work belongs in `domain_operations`.

```text
create/start/stop/delete in progress
→ one running domain_operations row

success/failure
→ operation result

domain state
→ last confirmed stable runtime fact
```

### 1.3 Health is observation, not lifecycle

Persist only:

```text
last_health_checked_at
last_health_failure_code
```

Derive response health:

```text
state != running
→ unknown

state == running
AND fresh check
AND failure code null
→ healthy

state == running
AND fresh check
AND failure code set
→ unhealthy

state == running
AND stale/missing check
→ unknown
```

### 1.4 Availability is derived

Never store `available`.

```text
available =
  state == running
  AND no running domain operation
  AND health is healthy
```

`DomainAvailabilityResolver` is sole server-side owner of this rule.

### 1.5 Create and provision are not separate states

Create performs internal provisioning, but no `provisioning` state exists.

```text
POST create
→ insert domain state=stopped
→ insert create operation=running
→ controller ensure storage
→ complete operation

success:
  domain remains stopped

failure:
  domain remains stopped
  create operation=failed
  start later re-runs ensure storage
```

`stopped` means non-serving. It does not claim storage currently exists.

### 1.6 Stop removes ephemeral runtime container

`stop` means:

```text
stop container
→ remove container
→ preserve workspace/log root + runtime database
→ state=stopped
```

No stopped container remains to drift.

### 1.7 Delete has one safe intermediate state

`deleting` exists only because irreversible deletion can partially complete.

```text
delete accepted
→ state=deleting
→ domain unavailable
→ only GET status or DELETE retry allowed

delete succeeds
→ physically remove resources
→ delete domain row
→ cascading delete domain_operations
→ terminal state is row absence
```

No `archived` state exists.

---

## 2. Core Rules

1. Phase 1 opaque HttpOnly DB-backed sessions and server-side role enforcement remain unchanged.
2. All domain write, status-detail, and operation-history routes require `require_admin`.
3. Members may call only safe available-domain listing.
4. Anonymous callers receive `401`; members receive `403` for every admin route.
5. A Knowledge Domain is one unit of runtime isolation, future document ownership, future retrieval isolation, and future evidence scope.
6. Domain creation selects exactly one existing embedding profile.
7. Selected profile must be `purpose=embedding` and pass `TrustedRuntimeResolver.resolve_embedding_profile(profile_id)` locally.
8. Domain stores only `embedding_profile_id`; no provider configuration copy exists.
9. Referenced embedding profile cannot mutate or delete while active domain references it.
10. After hard delete, reference disappears; profile becomes independently mutable/deletable under Phase 2 rules.
11. Domain ID is admin-supplied, immutable while domain exists, path-safe, and not derived from display name.
12. Display name is human metadata only. It never determines resource paths, container names, database names, or authorization.
13. Browser payload contains only public domain ID, display name, and embedding profile ID.
14. Runtime resource identity includes a server-generated private `runtime_instance_id`; browser never receives it.
15. Domain ID may be reused only after successful hard delete. New create gets new `runtime_instance_id`.
16. Runtime names, paths, and storage database names derive only from validated domain ID plus server-generated runtime instance ID.
17. Runtime containers have no published host port.
18. Browser never reaches LightRAG, controller, Docker Engine, storage path, database, or runtime logs.
19. API never mounts `/var/run/docker.sock`.
20. Controller alone mounts Docker Engine access.
21. Controller accepts only fixed actions. It rejects arbitrary image, command, mount, network, port, environment, database, URL, or shell input.
22. Runtime availability requires running container plus successful bounded private health probe.
23. Docker process status alone is not health.
24. LightRAG health alone is not authorization.
25. No background poller exists. Status refresh is bounded and on demand.
26. One active domain operation maximum per domain.
27. No conflicting lifecycle action starts while an active operation exists.
28. No action queue, retry worker, event bus, or autonomous repair loop exists.
29. Create/start/stop/delete are controller-idempotent for one runtime instance.
30. `start` ensures required empty storage exists. No user-facing prepare/repair/recreate action exists.
31. `delete` is hard delete. No archive, restore, purge, or permanent-delete variant exists.
32. Phase 3 makes no provider network call.
33. Phase 3 creates no document, source file, parser artifact, vector, graph, chunk, evidence, or query data.

---

## 3. Runtime Topology

### 3.1 Containers

| Container | Responsibility | Public? | Docker socket | Host `.data` | Provider credentials |
|---|---|---:|---:|---:|---:|
| `postgres` | Application DB + per-domain LightRAG databases | No | No | No | No |
| `migrate` | Alembic once | No | No | No | No |
| `api` | Auth, admin domain API, registry, availability | Local dev API only | No | No | No |
| `domain-controller` | Fixed lifecycle actions + health probe | No | Yes | Yes | No |
| `ce-lr-*` | One empty private runtime per started domain | No | No | Matching workspace/log root | No |

### 3.2 Networks

```text
browser
   ↓
public/app network
   ↓
Context Engine API
   ↓ control network only
Domain Lifecycle Controller
   ↓ private runtime network
LightRAG runtime(s)
   ↓ storage network
PostgreSQL
```

Rules:

```text
API:
  no Docker socket
  no host .data mount
  no direct LightRAG route
  no runtime network access required in Phase 3

Controller:
  no host-published port
  private service DNS only
  Docker socket + host data-root mount
  control/runtime/storage network access only

Runtime:
  no ports:
  no public proxy route
  no browser CORS exposure
  private runtime network only
  mount only matching workspace/log root
```

### 3.3 Why controller exists

Docker Engine access is host privilege. Browser-facing API must not receive it.

Controller is one narrow privilege boundary, not a general orchestration service.

Fixed actions only:

```text
provision
start
stop
remove
inspect
```

### 3.4 Domain controller auth token

Use one deployment-held internal token:

```text
DOMAIN_CONTROLLER_AUTH_TOKEN
```

Required headers:

```text
X-Domain-Control-Token
X-Request-ID
X-Domain-Operation-ID
```

Rules:

```text
present only in API + controller environment
never browser-visible
never logged
constant-time comparison
sent only over private Compose network
controller has no published port
controller accepts no browser session/cookie
```

Important:

```text
auth token proves API → controller caller identity.
auth token is not lifecycle fencing.
runtime_instance_id + operation generation protect stale actions.
```

Supporting deployment contract:

```text
docs/security/domain-controller-auth-token.md
```

Must define token generation, Compose injection, rotation procedure, non-logging rule, and startup failure when missing.

---

## 4. LightRAG Compatibility Gate

Do before domain service build.

Pin one exact upstream LightRAG revision/image digest. Prove:

```text
empty workspace
empty LightRAG database
no uploaded document
no provider credential
no provider endpoint request

controller:
  starts runtime
  probes approved private health endpoint
  receives valid healthy response
  stops/removes runtime
```

Rules:

```text
use upstream as-is
do not patch LightRAG source for Phase 3

allowed:
  thin pinned image/Dockerfile
  fixed startup command
  fixed empty storage/bootstrap settings
  fixed health expectation
  private network wiring

not allowed:
  custom LightRAG lifecycle API
  LightRAG WebUI exposure
  fake provider key
  provider test request
  provider SDK
  fork-specific controller workaround
```

If chosen revision cannot provide a provider-free health-only empty runtime:

```text
select compatible pinned revision/configuration.
do not add fake credentials or provider calls.
```

---

## 5. Storage Boundary

### 5.1 Host-visible root

```text
.data/
└── lightrag/
    └── domains/
        └── <domain-id>--<instance-fingerprint>/
            ├── workspace/
            └── logs/
```

No `.data/lightrag/deleted/` root exists.

### 5.2 Ownership

| Path | Owner | Phase 3 purpose |
|---|---|---|
| `.data/lightrag/domains/<id>--<fingerprint>/workspace/` | Private runtime | Empty runtime workspace; future LightRAG-owned state |
| `.data/lightrag/domains/<id>--<fingerprint>/logs/` | Runtime/controller | Runtime log location; no browser log UI |
| Application document source root | Phase 4 | Does not exist |
| Parser artifacts | Phase 4 | Does not exist |
| Generated runtime env file | None | Forbidden |
| Generated Compose file | None | Forbidden |
| Domain manifest JSON | None | Forbidden |
| Archive root | None | Forbidden |

### 5.3 Runtime resource identity

`runtime_instance_id` is a server-generated UUID, stored only in `domains`, never returned by public API.

`RuntimeNamingPolicy` derives all resources from:

```text
validated domain_id
+ runtime_instance_id
```

Example conceptual names:

```text
workspace root: .data/lightrag/domains/fatigue--a1b2c3d4/
container:      ce-lr-fatigue-a1b2c3d4
database:       ce_lr_a1b2c3d4
```

Exact formatting is implementation-owned. It must respect Docker/PostgreSQL length limits and use a short deterministic fingerprint where required.

Why instance identity exists:

```text
hard delete may allow domain ID reuse
old delayed delete/start request must never touch new domain resources
```

### 5.4 Per-domain LightRAG database

One internal PostgreSQL server. One private LightRAG database per runtime instance.

Rules:

```text
database name derived internally
caller cannot submit database name
DB URL never stored in domains
DB URL never returned by API
controller-only deployment DB root supplies connectivity
controller creates/drops database
no per-domain username/password
no direct user/database access
```

One controller-held runtime DB role is enough for one host and 5–10 concurrent users.

---

## 6. Low-Entropy Domain State Model

### 6.1 Persisted facts

```ts
type DomainState =
  | "stopped"
  | "running"
  | "deleting";
```

```ts
type DomainOperationType =
  | "create"
  | "start"
  | "stop"
  | "delete";

type DomainOperationStatus =
  | "running"
  | "succeeded"
  | "failed";
```

### 6.2 Old-state collapse

| Old state | New representation | Reason |
|---|---|---|
| `provisioning` | `state=stopped` + running `create` operation | Work is not enduring state |
| `stopped` | `state=stopped` | Keep stable fact |
| `starting` | `state=stopped` + running `start` operation | Work is not enduring state |
| `running` | `state=running` | Keep stable fact |
| `stopping` | `state=running` + running `stop` operation | Runtime remains present until stop confirms |
| `deleting` | `state=deleting` + running/failed delete operation | Needed to fence irreversible partial delete |
| `failed` | Failed operation + last observed stable state | Failure is result, not domain identity |
| `archived` | Row absent after hard delete | No archive product |

### 6.3 State / health / availability matrix

| Domain state | Active op | Fresh health result | Member available |
|---|---|---|---:|
| `stopped` | none | irrelevant | No |
| `stopped` | `create` / `start` | irrelevant | No |
| `running` | none | healthy | Yes |
| `running` | none | unhealthy / stale | No |
| `running` | `stop` | irrelevant | No |
| `deleting` | `delete` | irrelevant | No |
| row absent | none | none | No |

### 6.4 Valid actions

```text
create:
  absent
  → stopped + create operation
  → stopped

start:
  stopped
  → stopped + start operation
  → running on private health success
  → stopped on failure after runtime cleanup

stop:
  running
  → running + stop operation
  → stopped

delete:
  stopped | running
  → deleting + delete operation
  → row absence

delete retry:
  deleting + no running operation
  → deleting + delete operation
  → row absence
```

### 6.5 Idempotency

```text
start when running + healthy:
  return current safe domain; no new container

stop when stopped:
  return current safe domain; no controller call

delete when deleting + active operation:
  conflict domain_busy

delete when deleting + failed/no active operation:
  resume hard delete

deleted domain:
  404

create same ID after successful delete:
  allowed
  new runtime_instance_id
```

### 6.6 Forbidden moves

```text
deleting → start
deleting → stop
deleting → create
running → create
any action while operation is running
row absence → status/start/stop/delete
```

---

## 7. Database Model

Create Alembic migration:

```text
0003_domain_lifecycle
```

### 7.1 `domains`

```ts
type Domain = {
  id: string;                         // public safe ID; PK
  runtimeInstanceId: string;          // UUID; private; unique; never API output

  displayName: string;
  embeddingProfileId: string;         // FK model_profiles.id
  state: "stopped" | "running" | "deleting";

  controlGeneration: number;          // increments before each controller action
  lastHealthCheckedAt: string | null;
  lastHealthFailureCode: string | null;

  createdAt: string;
  createdByUserId: string;
  updatedAt: string;
  updatedByUserId: string | null;
};
```

Rules:

```text
id:
  ^[a-z0-9][a-z0-9-]{1,62}$
  immutable while row exists
  public ID only
  reusable only after successful hard delete

runtime_instance_id:
  server-generated UUID
  never API/browser input
  unique
  used only internal controller resource identity

display_name:
  trimmed 1..120 chars
  unique while row exists
  not path/runtime identifier

embedding_profile_id:
  required
  purpose=embedding validated in service
  immutable in Phase 3
  referenced profile cannot update/delete

state:
  starts stopped
  deleting is only non-stable cleanup state

control_generation:
  non-negative integer
  incremented while row locked before every controller action

last_health_failure_code:
  safe category only
  no raw LightRAG/Docker/database/provider/stack text
```

Required constraints/indexes:

```text
domains:
  PK id
  UNIQUE runtime_instance_id
  UNIQUE display_name
  FK embedding_profile_id -> model_profiles.id ON DELETE RESTRICT
  FK created_by_user_id -> users.id
  FK updated_by_user_id -> users.id
  INDEX state
  INDEX embedding_profile_id
  INDEX last_health_checked_at
  CHECK control_generation >= 0
```

### 7.2 `domain_operations`

Use a domain-specific table. Do not add generic operation abstraction before second real use case.

```ts
type DomainOperation = {
  id: string;                         // UUID
  domainId: string;                   // FK domains.id ON DELETE CASCADE
  runtimeInstanceId: string;          // copied private correlation; never API output
  controlGeneration: number;

  type: "create" | "start" | "stop" | "delete";
  status: "running" | "succeeded" | "failed";

  actorUserId: string;
  requestId: string;
  safeErrorCode: string | null;

  startedAt: string;
  completedAt: string | null;
};
```

Rules:

```text
one row per lifecycle attempt
one running row maximum per domain
no JSON payload
no command stdout/stderr
no runtime address/path
no provider/secret/ciphertext
no raw exception
no retry counter

successful hard delete:
  deleting domains row cascades deletion of all domain_operations rows
```

Required constraints/indexes:

```text
domain_operations:
  PK id
  FK domain_id -> domains.id ON DELETE CASCADE
  FK actor_user_id -> users.id
  INDEX domain_id + started_at DESC
  INDEX request_id
  CREATE UNIQUE INDEX uq_domain_operations_one_running
    ON domain_operations (domain_id)
    WHERE status = 'running'
  CHECK (
    (status = 'running' AND completed_at IS NULL)
    OR
    (status <> 'running' AND completed_at IS NOT NULL)
  )
```

### 7.3 Migration rules

`0003_domain_lifecycle` must:

```text
create enum/check values
create domains
create domain_operations
create FK/check/index rules
add Phase 2 embedding-profile reference protections
support development downgrade
run after 0001 + 0002 on blank PostgreSQL

must not:
  create default domain
  write filesystem paths
  create runtime database
  call Docker
  create archive/tombstone tables
```

---

## 8. Hard-Delete Contract

### 8.1 Public API semantics

```text
DELETE /api/v1/admin/domains/{domain_id}
```

Accepted:

```text
202 Accepted
```

The response contains a safe delete operation ID and the domain in `deleting` state. Completion means all are true:

```text
matching runtime container absent
matching runtime database absent
matching workspace/log root absent
domain row absent
domain_operations rows absent
```

### 8.2 Delete flow

```text
BEGIN
→ SELECT domain FOR UPDATE
→ reject active non-delete operation
→ if stopped/running:
     state=deleting
→ increment control_generation
→ insert delete operation=running
COMMIT

-> return 202 with operation_id and domain state=deleting

Domain cleanup runner/controller:
-> remove(domain_id, runtime_instance_id, operation_id, generation)

BEGIN
-> lock same domain by id + runtime_instance_id + generation
-> controller success:
     DELETE FROM domains WHERE id=:id AND runtime_instance_id=:instance
     -- cascades domain_operations
COMMIT

After completion, GET domain/status/operations returns 404.
```

### 8.3 Controller remove

```text
validate public ID + private instance UUID
→ find only matching managed container labels
→ stop matching container if present
→ remove matching container
→ terminate active connections to matching LightRAG database
→ drop matching database if present
→ recursively delete matching workspace/log root if present
→ verify absence
→ return safe removed status
```

### 8.4 Partial delete failure

```text
controller failure
→ retain domain row state=deleting
→ mark delete operation=failed with safe error code
→ no member availability
→ no start/stop/create
→ admin calls DELETE again to resume same hard delete
```

No rollback, archive, restore, or resource recreation.

### 8.5 Deletion postcondition

No delete operation completes successfully until the controller verifies target resource absence. The initial API response remains `202 Accepted`.

A new create with same ID is allowed only after row deletion completes.

---

## 9. Fencing and Stale-Operation Reconciliation

### 9.1 Why this remains necessary

Hard delete plus ID reuse creates one real stale-action risk:

```text
old delayed delete/start for domain "fatigue"
must not alter newly created "fatigue"
```

### 9.2 Three lean controls

```text
1. runtime_instance_id
   new creation gets new private resource identity

2. control_generation
   increments before every controller action
   prevents late API finalizer from overwriting newer DB truth

3. one active operation per domain
   PostgreSQL partial unique index serializes lifecycle work
```

### 9.3 Controller action envelope

Internal API receives only controller-safe fields:

```json
{
  "domainId": "fatigue",
  "runtimeInstanceId": "private UUID",
  "operationId": "private UUID",
  "controlGeneration": 7
}
```

Browser never provides these fields.

Controller derives:

```text
container name
container labels
workspace/log root
runtime database name
private network
pinned image
fixed runtime port
health endpoint
timeouts
```

Controller targets only resources with both labels:

```text
context-engine.domain-id=<domain-id>
context-engine.runtime-instance-id=<runtime-instance-id>
```

Old action cannot match resources from new instance with reused public ID.

### 9.4 API finalization guard

```text
UPDATE domains
SET ...
WHERE id = :domain_id
  AND runtime_instance_id = :runtime_instance_id
  AND control_generation = :generation;
```

No matching row means action result is stale. Discard safe result. Do not mutate new domain.

### 9.5 Controller action bounds

Use one bounded controller lifecycle timeout:

```text
DOMAIN_LIFECYCLE_TIMEOUT_SECONDS=90
```

API controller-client timeout must exceed it by small fixed margin.

Controller must not continue a lifecycle action after its deadline. No background continuation. No automatic retry.

### 9.6 Reconcile on access only

No worker/poller.

Before admin status/start/stop/delete:

```text
if no active operation:
  continue

if active operation age <= lifecycle timeout:
  return domain_busy

if active operation age > lifecycle timeout:
  controller inspect matching instance
```

Settlement:

```text
expected postcondition confirmed:
  finalize operation success

controller proves action did not complete:
  mark operation failed
  preserve observed stable domain state

controller unavailable/ambiguous:
  keep operation running
  return runtime_unavailable
  do not release conflicting actions
```

Examples:

```text
stale start + runtime healthy
→ state=running, health success, operation=succeeded

stale stop + matching container absent
→ state=stopped, operation=succeeded

stale delete + all matching resources absent
→ delete domains row; cascade operations

stale start + container absent after bounded controller deadline
→ state=stopped, operation=failed

ambiguous stale operation
→ remains busy; no guessed state
```

This is bounded reconciliation, not autonomous repair.

---

## 10. Private Controller Contract

### 10.1 Internal routes

```text
POST   /internal/v1/domains/{domain_id}/provision
POST   /internal/v1/domains/{domain_id}/start
POST   /internal/v1/domains/{domain_id}/stop
DELETE /internal/v1/domains/{domain_id}
GET    /internal/v1/domains/{domain_id}/status
```

All require:

```text
X-Domain-Control-Token
X-Request-ID
X-Domain-Operation-ID
```

Action body carries only trusted internal identity/generation fields from §9.3.

### 10.2 Controller safe response

```ts
type RuntimeStatus = {
  runtimeState: "absent" | "running";
  healthState: "unknown" | "healthy" | "unhealthy";
  observedAt: string;
  failureCode:
    | "container_missing"
    | "startup_timeout"
    | "connection_refused"
    | "health_timeout"
    | "health_http_error"
    | "health_invalid_response"
    | "runtime_operation_failed"
    | "storage_remove_failed"
    | null;
};
```

Never include:

```text
container ID
container inspect JSON
stdout/stderr
Docker error text
runtime URL
private DNS
filesystem path
database name/URL
provider data
credential
raw health response
```

### 10.3 Idempotency

```text
provision:
  ensure matching workspace/log root + database exist
  never starts runtime

start:
  ensure provisioned
  runtime healthy for same instance
  → return healthy; no second container

stop:
  matching container absent
  → return absent

remove:
  container/database/root already absent
  → return removed
```

### 10.4 Action behavior

#### `provision`

```text
validate ID + instance UUID
→ derive paths/database
→ create workspace/log root
→ create database if absent
→ return absent/unknown
```

#### `start`

```text
validate ID + instance UUID
→ ensure workspace/log root + database
→ remove stale matching container if present
→ create matching private container from pinned image
→ attach private runtime network
→ mount matching workspace/log root only
→ no host-published port
→ start
→ bounded private health probe
→ health success: return running/healthy
→ health failure: stop/remove matching container; return absent/unhealthy
```

#### `stop`

```text
validate ID + instance UUID
→ stop matching container with bounded graceful timeout
→ remove matching container
→ return absent/unknown
```

#### `remove`

See [§8.3](#83-controller-remove).

#### `status`

```text
validate ID + instance UUID
→ inspect matching container
→ absent: return absent/unknown
→ running: bounded private health probe
→ return running/healthy or running/unhealthy
```

### 10.5 Safety checks

```text
[ ] Validate domain ID and instance UUID before derivation.
[ ] Require deterministic matching labels.
[ ] No host-published runtime port.
[ ] No mount broader than matching workspace/log root.
[ ] Controller never reads/writes application DB.
[ ] Controller never reads provider/model tables.
[ ] Controller never decrypts provider credentials.
[ ] Controller never calls provider.
[ ] Controller never writes domain.env or Compose files.
[ ] Controller endpoint has no published port.
[ ] Controller exposes only safe DTO.
```

---

## 11. Status and Availability Contract

### 11.1 Sources of truth

| Signal | Owner | Use |
|---|---|---|
| Domain `state` | Application DB | Stable lifecycle fact |
| Active `domain_operations` row | Application DB | In-flight action exclusion |
| Runtime existence/running | Private controller | Process observation |
| Private health probe | Private controller | Health observation |
| Availability | `DomainAvailabilityResolver` | Member eligibility |

### 11.2 Status refresh

No poller.

```text
Admin GET status:
  invoke bounded controller status
  persist health observation when state=running
  reconcile missing runtime when state=running

Member GET /domains:
  query state=running with no running operation
  for stale health candidate:
    invoke bounded controller status
  return only current available domains
```

Expected small deployment: few active domains, 5–10 concurrent users. Bounded on-demand probe is enough.

### 11.3 Reconciliation rules

```text
DB state=running + controller absent
→ state=stopped
→ last_health_failure_code=container_missing

DB state=running + controller running/healthy
→ preserve running
→ write health success timestamp

DB state=running + controller running/unhealthy
→ preserve running
→ write safe failure code + timestamp

DB state=stopped + controller running
→ do not expose availability
→ write last_health_failure_code=runtime_drift
→ next start removes/replaces matching stale runtime
```

No automatic stop/restart action runs from status endpoint.

### 11.4 User-safe unavailable behavior

```text
unavailable domain:
  absent from member list

member later submits known unavailable domain:
  typed domain_unavailable
  no private status/error/topology detail
```

---

## 12. Public Application API

### 12.1 Route groups

```text
/api/v1/admin/domains
/api/v1/domains
```

No browser route to controller or LightRAG exists.

### 12.2 Admin routes

All require:

```python
AdminUser = Depends(require_admin)
```

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/v1/admin/domains` | Create + provision empty domain |
| `GET` | `/api/v1/admin/domains` | List current domains |
| `GET` | `/api/v1/admin/domains/{domain_id}` | Read safe admin summary |
| `GET` | `/api/v1/admin/domains/{domain_id}/status` | Refresh/read safe status |
| `POST` | `/api/v1/admin/domains/{domain_id}/start` | Ensure/start runtime |
| `POST` | `/api/v1/admin/domains/{domain_id}/stop` | Stop/remove runtime container |
| `DELETE` | `/api/v1/admin/domains/{domain_id}` | Irreversible hard delete |
| `GET` | `/api/v1/admin/domains/{domain_id}/operations` | Current-domain safe lifecycle history |

No routes for:

```text
includeArchived
deleted-domain view
restore
archive
permanent-delete variant
PATCH domain
replace embedding profile
runtime URL/host port
runtime logs
Docker command
repair/recreate/regenerate/rebuild
upload/documents
LightRAG passthrough
```

### 12.3 Member route

```text
GET /api/v1/domains
```

Requires authenticated user. Returns only available domains:

```json
{
  "domains": [
    {
      "id": "fatigue",
      "displayName": "Fatigue Analysis",
      "available": true
    }
  ]
}
```

Never returns:

```text
embedding profile
health failure
operation history
state
instance ID
container identity
host/port
path/database
provider/model/parser configuration
```

### 12.4 Create request

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "embeddingProfileId": "uuid"
}
```

Validation:

```text
id:
  ^[a-z0-9][a-z0-9-]{1,62}$

displayName:
  required after trim
  max 120 chars

embeddingProfileId:
  UUID
  existing profile
  purpose=embedding
  private resolver accepts it
```

Reject fields:

```text
runtimeInstanceId
controlGeneration
hostPort
baseUrl
workspace
database
provider
modelId
apiKey
parser
retrievalMode
topK
```

### 12.5 Safe admin response

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "embeddingProfileId": "uuid",
  "state": "running",
  "health": {
    "state": "healthy",
    "checkedAt": "2026-06-26T12:00:03Z",
    "failureCode": null
  },
  "available": true,
  "activeOperation": null,
  "createdAt": "2026-06-26T12:00:00Z",
  "createdByUserId": "uuid",
  "updatedAt": "2026-06-26T12:00:03Z"
}
```

`runtimeInstanceId` and `controlGeneration` never appear.

### 12.6 Lifecycle endpoint response

Create/start/stop return:

```json
{
  "operationId": "uuid",
  "domain": { "...safe admin domain..." }
}
```

Delete request returns:

```json
{
  "operationId": "uuid",
  "domain": { "...safe admin domain...", "state": "deleting" }
}
```

HTTP status is `202 Accepted`. Completion is observed by polling until the domain returns `404`.

### 12.7 Error map

| HTTP | Code | Use |
|---:|---|---|
| 401 | `unauthenticated` | Missing/invalid session |
| 403 | `forbidden` | Member hits admin route |
| 404 | `not_found` | No current domain row |
| 409 | `conflict` | Duplicate active ID/display name, domain busy, incompatible action |
| 422 | `validation_failed` | Bad body/malformed ID |
| 422 | `configuration_unavailable` | Selected embedding profile cannot resolve |
| 422 | `configuration_invalid` | Wrong profile purpose/incompatible |
| 503 | `runtime_unavailable` | Controller unavailable/action failed safely |
| 500 | `internal_error` | Unexpected safe failure |

Never return raw Docker/LightRAG/database/provider errors, paths, runtime URLs, stack traces, or secrets.

---

## 13. Service Ownership

| Module | Owns | Does not own |
|---|---|---|
| `DomainLifecycleService` | Create/start/stop/delete orchestration, DB state, operation rows, fencing | Docker, direct storage DDL, provider decryption |
| `DomainAvailabilityResolver` | Available-domain list and enforcement | Lifecycle mutation |
| `DomainRepository` | Domain reads/mutations | Auth, controller, path logic |
| `DomainOperationRepository` | Domain operation rows | Generic jobs platform |
| `DomainControllerClient` | Token-authenticated internal calls, safe DTO mapping | User auth, DB state |
| `TrustedRuntimeResolver` | Private embedding-profile validation | Domain/runtime mutation |
| `DomainRuntimeController` | Naming, Docker, storage, health probe | App DB, users, provider config |
| `RuntimeNamingPolicy` | Internal resource derivation | Browser input parsing |
| Alembic | Schema | Runtime provisioning |

Correct flow:

```text
route
→ require_admin
→ DomainLifecycleService
→ DB transaction: lock + fence + operation
→ DomainControllerClient
→ private controller
→ DB transaction: guarded finalization
-> safe DTO / 202 delete accepted
```

Forbidden:

```text
route → Docker socket
route → filesystem
route → generated Compose/domain.env
route → provider decrypt
route → raw health response
controller → application DB
controller → browser auth
member route → direct controller/runtime URL
```

---

## 14. Repository Layout

```text
context-engine/
├── .env.example
├── docker-compose.yml
├── docker/
│   └── lightrag-runtime.Dockerfile
├── backend/
│   ├── alembic/
│   │   └── versions/
│   │       └── 0003_domain_lifecycle.py
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── admin_domains.py
│   │   │   └── domains.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── domain_policy.py
│   │   ├── db/
│   │   │   ├── models/domains.py
│   │   │   └── repositories/
│   │   │       ├── domains.py
│   │   │       └── domain_operations.py
│   │   ├── schemas/domains.py
│   │   ├── services/
│   │   │   ├── domain_availability.py
│   │   │   ├── domain_controller_client.py
│   │   │   └── domain_lifecycle.py
│   │   ├── runtime_controller/
│   │   │   ├── app.py
│   │   │   ├── docker_gateway.py
│   │   │   ├── health_probe.py
│   │   │   ├── runtime_naming.py
│   │   │   └── storage_provisioner.py
│   │   └── tests/
│   │       ├── integration/
│   │       ├── unit/
│   │       └── compose/
│   └── docs/
│       ├── api/phase-3-contract.md
│       └── security/domain-controller-auth-token.md
└── .data/                             # gitignored, controller-owned
```

Do not add:

```text
domain manifest JSON
compose generator
domain.env generator
provider secret cache
Docker access in API
worker/Redis/queue
status poller
generic operations framework
archive/restore subsystem
runtime-log UI
Kubernetes/service mesh/event bus/workflow engine
```

---

## 15. Dependencies and Environment

### 15.1 Controller dependencies only

```text
docker
httpx
```

Do not add Docker SDK to API package, Compose wrapper, Kubernetes SDK, worker/queue stack, provider SDK, log aggregation, generic retry framework, or filesystem abstraction.

### 15.2 `.env.example`

```dotenv
# Controller only: gitignored host root.
CONTEXT_DATA_ROOT=./.data

# API + controller only.
DOMAIN_CONTROLLER_AUTH_TOKEN=replace-with-long-random-value
DOMAIN_CONTROL_URL=http://domain-controller:8020

# Bounded lifecycle/status actions.
DOMAIN_LIFECYCLE_TIMEOUT_SECONDS=90
DOMAIN_RUNTIME_HEALTH_TIMEOUT_SECONDS=5
DOMAIN_STATUS_FRESH_SECONDS=15

# Exact approved runtime revision/image. Never latest.
LIGHTRAG_RUNTIME_IMAGE=context-engine-lightrag:approved-pin
LIGHTRAG_RUNTIME_CONTAINER_PORT=9621
LIGHTRAG_RUNTIME_HEALTH_PATH=/health

# Controller only. Never stored per domain.
LIGHTRAG_RUNTIME_DATABASE_URL=postgresql://lightrag_runtime:change-me@postgres:5432/postgres
```

Keep Phase 1/2 settings unchanged.

Do not add:

```dotenv
LIGHTRAG_DOMAIN_PORT=
LIGHTRAG_DOMAIN_BASE_URL=
LIGHTRAG_DOMAIN_WORKSPACE=
LIGHTRAG_DOMAIN_ENV=
LIGHTRAG_PROVIDER_SECRET=
LIGHTRAG_MODEL_PROFILE_JSON=
NEXT_PUBLIC_DOMAIN_CONTROL_URL=
NEXT_PUBLIC_LIGHTRAG_*
```

---

## 16. Compose Rules

### 16.1 Static services

```text
postgres
migrate
api
domain-controller
```

Runtime containers are dynamic. They never appear in root Compose.

### 16.2 Controller

```text
no published port
${CONTEXT_DATA_ROOT}:/data
/var/run/docker.sock:/var/run/docker.sock
control + runtime + storage networks
```

### 16.3 API

```text
no Docker socket
no `.data` mount
control network access to controller only
```

### 16.4 Dynamic runtime

```text
name:
  derived by RuntimeNamingPolicy

labels:
  context-engine.managed=true
  context-engine.domain-id=<id>
  context-engine.runtime-instance-id=<private UUID>

network:
  context-engine-runtime

ports:
  none

mounts:
  matching workspace root only
  matching logs root only

environment:
  fixed upstream bootstrap/storage values
  derived DB name
  no provider credentials in Phase 3
```

### 16.5 Compose checks

```text
[ ] API has no Docker socket.
[ ] Controller has no host-published port.
[ ] Runtime has no host-published port.
[ ] Only controller mounts `.data`.
[ ] No archive/deleted root exists.
[ ] No generated Compose/domain.env exists.
[ ] Runtime image is pinned.
```

---

## 17. Build Order

### Step 0 — Pin/prove empty runtime

Build:

```text
approved upstream revision/image digest
thin pinned runtime image or exact image reference
fixed empty workspace/storage bootstrap
actual Docker smoke test
```

Prove:

```text
provider-free start
private health success
stop/remove success
```

### Step 1 — Low-entropy schema/policy

Build:

```text
domain ID validator
runtime instance UUID generation
RuntimeNamingPolicy
three-state domain model
domain_operations table
partial one-active-operation index
embedding-profile reference guard
0003 migration
```

Check:

```text
blank migration works
safe IDs only
resource naming is deterministic and instance-scoped
referenced embedding profile cannot mutate/delete
```

### Step 2 — Narrow controller

Build:

```text
controller app
auth-token validation
fixed internal routes
per-instance in-memory action lock
Docker gateway
storage provisioner
health probe
safe DTO
fake adapters for tests
```

Check:

```text
bad token rejected
bad ID/instance UUID rejected
arbitrary image/path/env/port/command rejected
old instance cannot match new instance resources
```

### Step 3 — Create/read/operations

Build:

```text
DomainRepository
DomainOperationRepository
create flow
safe admin list/read/operation history
embedding resolver validation
```

Check:

```text
create creates stopped domain + successful create op
workspace/log root + DB exist
no runtime container exists
no provider call
```

### Step 4 — Start/status/member availability

Build:

```text
controller start/status
start flow
health observation mapping
DomainAvailabilityResolver
member list
```

Check:

```text
healthy runtime appears to member
unhealthy/stale runtime absent from member list
no host port
no provider call
```

### Step 5 — Stop/hard delete/reconcile

Build:

```text
stop removes runtime container
hard-delete remove action
deleting retry flow
stale-operation inspect/settlement
guarded finalization
```

Check:

```text
hard delete removes DB/container/workspace/logs/domain row/operations
same public ID can create new instance
old instance action cannot touch new instance
```

### Step 6 — Contract proof

Build:

```text
OpenAPI snapshot
unit/integration/Compose smoke tests
README lifecycle section
P3 API contract
domain-controller auth-token contract
```

Run:

```bash
pytest
docker compose up --build
```

---

## 18. Tests

### 18.1 Unit tests

| Test | Must prove |
|---|---|
| Domain ID validation | Safe lower-case IDs only |
| Runtime instance generation | UUID private, unique, not public DTO |
| Runtime naming | Same ID+instance derives same resources; different instance cannot collide |
| Create | `stopped` + operation; provision success/failure behavior |
| Start | `stopped → running` only after health success |
| Failed start | Runtime cleaned up; domain remains stopped; safe operation error |
| Stop | Runtime removed; domain becomes stopped |
| Delete | Fences first; successful resource absence deletes DB row |
| Delete retry | `deleting` failed operation resumes safely |
| Deleted domain | No read/status/start/stop/operations route remains |
| Recreate same ID | New instance identity/resources |
| Old action isolation | Old instance remove/start cannot target recreated instance |
| One active operation | Partial unique index blocks conflict |
| Late finalizer | Generation mismatch cannot overwrite new state |
| Stale reconcile | Settles confirmed result; ambiguous remains busy |
| Availability | Running + no active op + fresh healthy only |
| Profile reference guard | Active referenced embedding profile cannot mutate/delete |
| Safe error mapping | No raw controller/provider details |
| Token validation | Missing/wrong token rejected |
| No provider call | Provider client absent/unused |

### 18.2 Integration tests

```text
1. Seed admin + member.
2. Configure valid embedding profile.
3. Anonymous admin routes = 401.
4. Member admin routes = 403.
5. Member /domains initially empty.
6. Admin creates domain.
7. DB has one stopped row + create operation.
8. Start healthy runtime; member sees domain.
9. Health failure removes member visibility.
10. Stop removes runtime; member no longer sees domain.
11. Delete running or stopped domain.
12. Verify container absent.
13. Verify runtime database absent.
14. Verify workspace/log root absent.
15. Verify domains row absent.
16. Verify domain_operations rows absent.
17. GET deleted domain/status/operations = 404.
18. Recreate same domain ID succeeds with new instance.
19. Old-instance controller action cannot alter new instance.
20. Delete partial failure leaves deleting; retry finishes.
21. Referenced embedding profile PATCH/DELETE = 409 before delete.
22. Same profile becomes eligible after domain hard delete.
23. Every response includes X-Request-ID.
24. OpenAPI exposes no private instance/resource/secret field.
25. Provider HTTP mock receives no call.
```

### 18.3 Actual Compose smoke test

```text
fresh .data
→ Compose starts postgres/migrate/API/controller
→ API has no Docker socket
→ controller has no host port
→ create fatigue
→ start fatigue
→ docker port runtime returns no host mapping
→ private health succeeds
→ member sees fatigue
→ delete fatigue
→ container absent
→ runtime DB absent
→ matching .data root absent
→ domains/domain_operations rows absent
→ no archive/deleted root exists
→ recreate fatigue succeeds
```

### 18.4 Not tested now

```text
documents
parser execution
source artifacts
LightRAG document APIs
ingestion/indexing
pipeline status
retrieval/evidence/chat
provider execution/failover
runtime log viewer
status poller
archive/restore
multi-host orchestration
```

---

## 19. Security Checklist

```text
[ ] Phase 1 auth/session unchanged.
[ ] Phase 2 trusted config unchanged.
[ ] API has no Docker socket.
[ ] Controller has no host-published port.
[ ] Controller token validation is constant-time.
[ ] Browser cannot reach controller/LightRAG/Docker directly.
[ ] Controller accepts fixed actions only.
[ ] Caller cannot choose image/command/path/port/network/DB/env.
[ ] Every resource derives from validated ID + private instance ID.
[ ] Runtime uses no public port.
[ ] No provider secret/config in domains, operations, `.data`, API, or logs.
[ ] No generated Compose/domain.env.
[ ] No provider call.
[ ] Availability requires running + fresh health + no active operation.
[ ] Delete verifies container/database/root absence before completion.
[ ] Successful delete removes DB rows, operation rows, runtime database, workspace, logs.
[ ] No archive/tombstone/restore data exists.
[ ] Old instance cannot target new reused ID.
[ ] Referenced embedding profile cannot mutate/delete.
[ ] Controller never accesses application DB or provider config.
```

---

## 20. Risks and Lean Controls

| Risk | Lean control | Recovery |
|---|---|---|
| Upstream startup changes | Pin revision + empty-runtime smoke test | Select compatible pin |
| API-to-Docker privilege | Socket controller-only | Safe runtime error |
| Resource injection | Derive all resources internally | Reject invalid input |
| Runtime alive but unusable | Private HTTP health required | Hide from member |
| State drift after crash | One active op + generation guard + on-access inspect | Settle confirmed fact only |
| Delayed old action after ID reuse | Private runtime instance ID + resource labels | Old action cannot match new resource |
| Partial hard delete | `deleting` + DELETE retry | Resume removal; never rollback |
| Provider config leakage | No runtime config artifact | Keep Phase 2 ownership |
| Operations overbuild | Domain-specific table; no generic framework | Extend only after second real use case |

---

## 21. Common Mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| Keep `archived` after hard-delete decision | Hidden second deletion model | Successful delete removes row |
| Keep archive root “just in case” | Retains data/complexity | Recursively remove matching root |
| Keep `failed` lifecycle state | Failure is operation result | Stable state + failed operation |
| Persist `available` | Drift-prone duplicate fact | Derive in resolver |
| Persist health enum | Duplicates observation semantics | Timestamp + safe failure code |
| Use generic operations framework | One use case only | `domain_operations` table |
| Delete DB row before external resources | Loses retry/fencing anchor | `deleting` until absence verified |
| Reuse ID with ID-only resources | Old request can hit new domain | Instance-scoped resource identity |
| Let API mount Docker socket | Host-level risk | Controller only |
| Publish runtime ports | Bypass app auth/port conflicts | Private network only |
| Add repair/recreate action | Expands lifecycle | Stop then start; start ensures storage |
| Return raw errors | Leaks topology | Typed safe errors only |
| Add poller/worker now | No workload need | On-demand bounded status |

---

## 22. Final Definition of Done

```text
Admin:
  create empty domain with one embedding profile
  inspect safe state/status/history while domain exists
  start runtime
  stop runtime
  hard delete runtime + domain

Member:
  sees only available domains
  cannot manage domains or inspect internals

System:
  one Postgres domain registry
  three domain states only: stopped/running/deleting
  one domain-specific operation table
  health as observation only
  availability derived only
  one private Docker-privileged controller
  one private runtime/workspace/database per active instance
  no browser/direct runtime access
  no public runtime port
  no manifest/generated Compose/domain.env
  no provider secret in artifacts
  no provider call
  true hard delete
  no archive/tombstone/restore
  same public ID safely reusable after delete
  tests green
```

## Final Boundary

```text
Phase 3:
admin
→ domain registry
→ embedding profile reference
→ empty private runtime/storage
→ start/stop/status
→ member-safe availability
→ irreversible hard delete

Not Phase 3:
documents
→ parsing
→ source artifacts
→ indexing
→ retrieval/evidence/chat
→ browser UI
→ provider execution
→ jobs/workers
→ archive/restore
→ complex operations platform
```
