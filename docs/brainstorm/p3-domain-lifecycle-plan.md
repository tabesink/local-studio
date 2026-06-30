# Context Engine — P3: Knowledge Domains + Private Runtime Lifecycle (caveman)

**Goal:** One authoritative domain registry. Admin create/start/stop/inspect/hard-delete one isolated empty LightRAG runtime per domain.
**Depends:** P1, P2.
**Reads:** P0 (domain state machine §3.1; controller boundary §4; deletion=202 async §10; fencing §11; embedding immutable §8; no runtime artifacts §6; provider-secret injection §7).
**Style:** caveman.

---

## 0. Build target

```text
Admin client / curl / tests
  -> CE API (require_admin, DomainLifecycleService, DomainAvailabilityResolver)
     -> Postgres (domains, domain_operations)
     -> private DomainControllerClient
        -> control network -> Domain Lifecycle Controller
           (narrow Docker access, per-domain workspace/log root, per-domain LightRAG DB,
            fixed create/start/stop/remove/inspect, bounded HTTP health probe)
           -> private runtime network -> one pinned LightRAG runtime per started domain
              (no host port, isolated workspace/log root, isolated storage DB)
```

Proves:

```text
admin login -> create domain w/ valid embedding profile
-> controller provisions empty workspace/log + empty runtime DB
-> start -> controller verifies private health
-> member sees available domain
-> stop -> member no longer sees it
-> hard delete -> container/DB/workspace/logs/domain row/operations gone
-> domain ID reusable as new isolated instance
```

### Phase boundary

```text
P3 owns: domain registry, empty runtime lifecycle, runtime health observation,
  member-safe availability, hard delete.
P3 not: documents, source files, parsing, indexing, retrieval, evidence, chat,
  provider execution, browser UI, archive/restore.
  (One delete-completion worker IS in P3 — see §3. No generic jobs/queue framework.)
```

### P2 compatibility

P2 stays sole owner of provider creds, model profiles, parser pick, private resolution. P3 stores only `embedding_profile_id`. Never stores/returns/mounts: credential, ciphertext, endpoint, model JSON, LLM snapshot, embedding key, runtime secret name, browser runtime config, domain.env, generated compose. Create validates profile = existing embedding + privately resolvable via TrustedRuntimeResolver, then discards resolved config immediately. No provider request. Empty P3 runtime = health-only bootstrap. Create/start/stop/status/delete never contact a provider. (Provider secret injection arrives P5 — P0 §7.)

---

## 1. Decisive simplifications

```text
1.1 One domain state axis: stopped | running | deleting. Nothing else persisted.
1.2 Work != domain state. In-flight lifecycle -> domain_operations row.
1.3 Health = observation. Persist only last_health_checked_at + last_health_failure_code. Derive healthy/unhealthy/unknown.
1.4 Availability derived: running AND no active op AND health healthy. DomainAvailabilityResolver = sole owner. Never store `available`.
1.5 Create provisions internally; no `provisioning` state. stopped = non-serving (doesn't claim storage exists).
1.6 Stop removes ephemeral container, keeps workspace/log + runtime DB. No drifting stopped container.
1.7 Delete -> one safe intermediate `deleting` (irreversible partial-delete fence). Terminal = row absence. No `archived`.
```

---

## 2. Core rules

```text
1. P1 sessions + roles unchanged. P2 config unchanged.
2. Domain write/status-detail/op-history routes require_admin.
3. Members call only safe available-domain listing. anon 401, member 403 on admin routes.
4. Domain = unit of runtime isolation + future doc/retrieval/evidence scope.
5. Create selects exactly one existing embedding profile (purpose=embedding, resolves locally).
6. Domain stores only embedding_profile_id. No provider config copy.
7. Embedding profile IMMUTABLE from create (P0 §8). Referenced profile can't mutate/delete while domain references it.
8. After hard delete, reference gone -> profile mutable/deletable under P2 rules.
9. Domain ID admin-supplied, immutable while row exists, path-safe, NOT from display name.
10. Display name = human metadata only. Never determines paths/names/authz.
11. Browser payload = public domain ID + display name + (admin: embedding profile ID). Never runtime_instance_id.
12. runtime_instance_id = server-generated private UUID. Domain ID reused only after successful hard delete -> new instance ID.
13. Runtime names/paths/DB names derive from validated domain ID + runtime_instance_id only (P0 §6).
14. Runtime containers: no published host port.
15. Browser never reaches LightRAG/controller/Docker/storage/runtime logs. API never mounts docker.sock. Controller alone mounts it.
16. Controller accepts fixed actions only. Rejects arbitrary image/command/mount/network/port/env/DB/URL/shell.
17. Availability = running container + successful bounded private health probe. Docker status alone != health. LightRAG health alone != authorization.
18. No background poller. Status refresh bounded + on demand.
19. One active operation max per domain. No conflicting action while active op exists.
20. No queue table/retry framework/event bus/repair loop. One delete-completion worker only (claims running delete ops; §3).
21. start ensures empty storage exists. No prepare/repair/recreate action.
22. delete = hard delete. No archive/restore/purge variant.
23. P3 makes no provider call, creates no document/source/vector/graph/evidence/query data.
```

---

## 3. Runtime topology

| Container | Job | Public | docker.sock | host .data | provider creds |
|---|---|---|---|---|---|
| postgres | app DB + per-domain LightRAG DBs | No | No | No | No |
| migrate | alembic once | No | No | No | No |
| api | auth, admin domain API, registry, availability | local dev only | No | No | No |
| worker | completes durable domain-delete operations | No | No | No | No |
| domain-controller | fixed lifecycle + health probe | No | Yes | Yes | No |
| ce-lr-* | one empty private runtime per started domain | No | No | matching root | No |

### Why the worker exists now (review correction)

`202 deletion_pending` needs a durable process that finishes cleanup after the API request exits — otherwise a crash/restart mid-delete strands a `deleting` domain forever. Add the one approved worker in P3 (not later). It is the SAME single worker P4 extends with preparation and P5 extends with indexing. No queue table, no operations framework.

Worker responsibilities in P3:

```text
scan running delete operations (domain.state=deleting + domain_operations.type=delete, status=running)
  -> controller remove(domain_id, runtime_instance_id, operation_id, generation)
  -> verify runtime container/DB/workspace/log absence
  -> delete domain row (cascades operations)
```

Create/start/stop stay synchronous (bounded controller call in the API). Only delete is worker-completed:

| Action | Executor | Response |
|---|---|---|
| Create | API, bounded controller call | synchronous success |
| Start | API, bounded controller call | synchronous success |
| Stop | API, bounded controller call | synchronous success |
| Delete | API records `deleting` + delete op; worker completes cleanup | `202 deletion_pending` |

Controller removal stays idempotent via `runtime_instance_id` + `control_generation` (§9), so worker re-runs are safe across restarts.

Networks:

```text
browser -> app network -> CE API -> control network -> Controller
  -> runtime network -> LightRAG runtime(s) -> storage network -> Postgres
```

API: no socket, no .data mount, no direct LightRAG route. Controller: no host port, private DNS only, socket + data-root mount. Runtime: no ports, private runtime network only, mounts only matching workspace/log root.

Controller = one narrow privilege boundary, not orchestration service. Fixed actions: provision, start, stop, remove, inspect.

### Controller auth token

```text
DOMAIN_CONTROLLER_AUTH_TOKEN
headers: X-Domain-Control-Token, X-Request-ID, X-Domain-Operation-ID
```

In API + controller env only. Never browser-visible/logged. Constant-time compare. Private network only. Controller has no published port, accepts no browser session/cookie.

**Token proves API->controller caller identity. Token is NOT lifecycle fencing.** runtime_instance_id + control_generation protect stale actions. Deployment contract doc: `docs/security/domain-controller-auth-token.md` (generation, compose injection, rotation, non-logging, startup-fail-when-missing).

---

## 4. LightRAG compatibility gate (before service build)

Pin exact upstream revision/image digest. Prove provider-free health-only empty runtime:

```text
empty workspace + empty DB + no document + no credential + no provider request
controller: start -> probe approved private health -> healthy response -> stop/remove.
```

Allowed: thin pinned image, fixed startup command, fixed empty-storage settings, fixed health expectation, private network wiring. Not allowed: custom LightRAG lifecycle API, WebUI exposure, fake provider key, provider test/SDK, fork workaround.

Chosen revision can't do provider-free health-only runtime -> pick compatible pin. Never add fake credentials/provider calls.

---

## 5. Storage boundary

```text
.data/lightrag/domains/<domain-id>--<instance-fingerprint>/
  ├── workspace/   (runtime; future LightRAG state)
  └── logs/        (runtime/controller; no browser log UI)
```

No `.data/lightrag/deleted/` root. No generated env/compose/manifest/archive. (P0 §6.)

runtime_instance_id = server UUID, stored only in domains, never public. RuntimeNamingPolicy derives all resources from validated domain_id + runtime_instance_id:

```text
workspace: .data/lightrag/domains/fatigue--a1b2c3d4/
container: ce-lr-fatigue-a1b2c3d4
database:  ce_lr_a1b2c3d4
```

Respect Docker/Postgres length limits + short deterministic fingerprint. Instance identity exists so old delayed delete/start never touches new domain after ID reuse.

Per-domain LightRAG DB: one internal Postgres server, one private DB per runtime instance. Name derived internally; caller can't submit. DB URL never stored in domains / returned by API. Controller-only DB root supplies connectivity, creates/drops DB. No per-domain user/password. One controller-held runtime DB role enough for one host + 5–10 users.

---

## 6. State model

```ts
type DomainState = "stopped" | "running" | "deleting";
type DomainOperationType = "create" | "start" | "stop" | "delete";
type DomainOperationStatus = "running" | "succeeded" | "failed";
```

Old-state collapse: provisioning->stopped+create op | starting->stopped+start op | stopping->running+stop op | failed->failed op + last stable state | archived->row absent.

State/health/availability matrix:

```text
stopped + any         -> available No
running + none + healthy -> Yes
running + none + unhealthy/stale -> No
running + stop op     -> No
deleting              -> No
row absent            -> No
```

Valid actions:

```text
create: absent -> stopped + create op -> stopped
start:  stopped -> stopped + start op -> running on health success | stopped on failure (after cleanup)
stop:   running -> running + stop op -> stopped
delete: stopped|running -> deleting + delete op -> row absence
delete retry: deleting + no running op -> deleting + delete op -> row absence
```

Idempotency: start when running+healthy -> current domain, no new container. stop when stopped -> current domain, no controller call. delete when deleting+active op -> 409 domain_busy. delete when deleting+failed/no op -> resume. deleted domain -> 404. create same ID after successful delete -> allowed, new instance.

Forbidden: deleting->start/stop/create, running->create, any action while op running, row-absence->any.

---

## 7. DB model — migration 0003_domain_lifecycle

### domains

```ts
type Domain = {
  id: string;                  // public PK; ^[a-z0-9][a-z0-9-]{1,62}$
  runtimeInstanceId: string;   // UUID, private, unique, never API output
  displayName: string;         // trimmed 1..120, unique while row exists
  embeddingProfileId: string;  // FK model_profiles.id; immutable
  state: "stopped" | "running" | "deleting";
  controlGeneration: number;   // increments before each controller action
  lastHealthCheckedAt: string | null;
  lastHealthFailureCode: string | null;  // safe category only
  createdAt; createdByUserId; updatedAt; updatedByUserId;
};
```

```text
PK id, UNIQUE runtime_instance_id, UNIQUE display_name,
FK embedding_profile_id -> model_profiles.id ON DELETE RESTRICT,
FK created_by/updated_by -> users.id,
INDEX state, INDEX embedding_profile_id, INDEX last_health_checked_at,
CHECK control_generation >= 0
```

### domain_operations

Domain-specific table. No generic operation abstraction (P0 §3).

```ts
type DomainOperation = {
  id: string;                  // UUID
  domainId: string;            // FK domains.id ON DELETE CASCADE
  runtimeInstanceId: string;   // private correlation, never API output
  controlGeneration: number;
  type: "create" | "start" | "stop" | "delete";
  status: "running" | "succeeded" | "failed";
  actorUserId; requestId; safeErrorCode: string | null;
  startedAt; completedAt: string | null;
};
```

```text
PK id, FK domain_id -> domains.id ON DELETE CASCADE, FK actor_user_id -> users.id,
INDEX (domain_id, started_at DESC), INDEX request_id,
UNIQUE INDEX uq_domain_operations_one_running ON (domain_id) WHERE status='running',
CHECK (status='running' AND completed_at IS NULL) OR (status<>'running' AND completed_at IS NOT NULL)
```

No JSON payload, stdout/stderr, runtime address/path, provider/secret, raw exception, retry counter. Successful hard delete cascades op rows.

Migration must NOT: create default domain, write paths, create runtime DB, call Docker, create archive/tombstone tables. After 0001+0002 on blank Postgres.

---

## 8. Hard-delete contract (202 async — P0 §10)

```text
DELETE /api/v1/admin/domains/{domain_id}  -> 202 deletion_pending
```

Success (eventual) = all true: runtime container absent, runtime DB absent, workspace/log root absent, domain row absent, domain_operations rows absent.

Flow:

```text
BEGIN
  SELECT domain FOR UPDATE
  reject active non-delete op (409 domain_busy)
  if stopped/running: state=deleting
  increment control_generation
  insert delete op=running
COMMIT
-> return 202 deletion_pending

(WORKER completes — runs in the worker process, survives API restart:)
  claim running delete op (FOR UPDATE SKIP LOCKED)
  controller remove(domain_id, runtime_instance_id, operation_id, generation)
BEGIN
  lock domain by id + instance + generation
  controller success:
    DELETE FROM domains WHERE id=:id AND runtime_instance_id=:instance  -- cascades operations
COMMIT

GET domain after complete -> 404
```

The completion runs in the worker, not the API request. API returns `202` immediately after recording `deleting` + the delete op; the worker scans running delete ops and finishes. If the API (or worker) restarts mid-delete, the op is still `running` and the worker re-claims it on next loop — controller remove is idempotent, so re-running is safe. This is what makes `202` honest.

P3 standalone has no sources, so removal is controller-only. P4/P5 add source purge before controller remove (P0 §10). Domain row never deletes while owned artifacts remain.

Chat redaction hook (P7 + P0 §10): once P7 exists, domain delete also calls `ChatService.redact_for_domain(domain_id)` as part of this flow, before the domain row is deleted — redacts derived answers in GROUNDED turns for that domain (direct/general turns untouched), keeps user questions. One direct call, no event bus. Not present in P3-only build; wired when P7 lands.

Controller remove: validate ID + instance UUID -> find matching managed labels -> stop+remove matching container -> terminate connections to matching LightRAG DB -> drop matching DB -> recursively delete matching workspace/log root -> verify absence -> safe removed status.

Partial fail: retain row state=deleting, mark delete op=failed (safe code), no member availability, no start/stop/create. Admin repeats DELETE to resume. No rollback/archive/restore/recreate.

---

## 9. Fencing + stale reconciliation (P0 §11)

Three controls: runtime_instance_id, control_generation, one active op (partial unique index).

Controller action envelope (browser never provides):

```json
{"domainId":"fatigue","runtimeInstanceId":"private UUID","operationId":"private UUID","controlGeneration":7}
```

Controller derives container name/labels, workspace/log root, runtime DB name, network, pinned image, fixed port, health endpoint, timeouts. Targets only resources with BOTH labels:

```text
context-engine.domain-id=<id>
context-engine.runtime-instance-id=<instance>
```

API finalization guard:

```sql
UPDATE domains SET ...
WHERE id=:id AND runtime_instance_id=:instance AND control_generation=:generation;
```

No matching row -> stale result -> discard, don't mutate new domain.

Bounds: `DOMAIN_LIFECYCLE_TIMEOUT_SECONDS=90`. API client timeout exceeds by small margin. Controller must not continue after deadline. No background continuation/retry.

Reconcile on access only (no poller):

```text
no active op -> continue.
active op age <= timeout -> 409 domain_busy.
active op age > timeout -> controller inspect matching instance:
  postcondition confirmed -> finalize success.
  proven not complete -> mark failed, preserve observed stable state.
  unavailable/ambiguous -> keep running, return runtime_unavailable, hold conflicting actions.
```

Bounded reconciliation, not autonomous repair.

---

## 10. Private controller contract

```text
POST   /internal/v1/domains/{id}/provision
POST   /internal/v1/domains/{id}/start
POST   /internal/v1/domains/{id}/stop
DELETE /internal/v1/domains/{id}
GET    /internal/v1/domains/{id}/status
```

All require token + X-Request-ID + X-Domain-Operation-ID. Body = trusted identity/generation fields only.

Safe response:

```ts
type RuntimeStatus = {
  runtimeState: "absent" | "running";
  healthState: "unknown" | "healthy" | "unhealthy";
  observedAt: string;
  failureCode: "container_missing" | "startup_timeout" | "connection_refused"
    | "health_timeout" | "health_http_error" | "health_invalid_response"
    | "runtime_operation_failed" | "storage_remove_failed" | null;
};
```

Never include: container ID, inspect JSON, stdout/stderr, Docker error, runtime URL, private DNS, path, DB name/URL, provider data, credential, raw health response.

Behavior: provision -> ensure workspace/log + DB, never starts runtime. start -> ensure provisioned, remove stale matching container, create matching private container from pinned image, attach runtime network, mount only matching root, no host port, start, bounded health probe; success->running/healthy, failure->stop/remove->absent/unhealthy. stop -> stop+remove matching container -> absent. remove -> see §8. status -> inspect matching container; absent->absent/unknown; running->probe->healthy/unhealthy.

Safety: validate ID+instance before derivation; require matching labels; no host port; no mount broader than matching root; controller never reads/writes app DB, never reads provider/model tables, never decrypts creds, never calls provider, never writes domain.env/compose; safe DTO only.

---

## 11. Status + availability

| Signal | Owner |
|---|---|
| domain state | app DB |
| active op | app DB |
| runtime existence/running | controller |
| private health probe | controller |
| availability | DomainAvailabilityResolver |

Refresh (no poller):

```text
Admin GET status: bounded controller status, persist health when running, reconcile missing runtime when running.
Member GET /domains: query running + no running op; stale health candidate -> bounded controller status; return only current available.
```

Reconciliation:

```text
running + controller absent -> stopped, failure_code=container_missing.
running + running/healthy -> preserve running, write success timestamp.
running + running/unhealthy -> preserve running, write safe failure code + timestamp.
stopped + controller running -> don't expose availability, failure_code=runtime_drift, next start removes stale runtime.
```

No automatic stop/restart from status endpoint.

Unavailable domain absent from member list. Member submits known unavailable domain later -> typed `domain_unavailable`, no private detail.

---

## 12. Public API

```text
/api/v1/admin/domains   (require_admin)
/api/v1/domains         (member)
```

Admin routes:

```text
POST   /admin/domains                 create + provision empty domain
GET    /admin/domains                 list current domains
GET    /admin/domains/{id}            safe admin summary
GET    /admin/domains/{id}/status     refresh/read safe status
POST   /admin/domains/{id}/start      ensure/start runtime
POST   /admin/domains/{id}/stop       stop/remove runtime container
DELETE /admin/domains/{id}            irreversible hard delete -> 202
GET    /admin/domains/{id}/operations safe lifecycle history
```

No routes for: includeArchived, deleted-domain view, restore, archive, permanent-delete variant, PATCH domain, replace embedding profile, runtime URL/port, runtime logs, Docker command, repair/recreate/rebuild, upload/documents, LightRAG passthrough.

Member route `GET /api/v1/domains` (authenticated) returns only available:

```json
{"domains":[{"id":"fatigue","displayName":"Fatigue Analysis","available":true}]}
```

Never returns embedding profile, health failure, op history, state, instance ID, container identity, host/port, path/DB, config.

Create request:

```json
{"id":"fatigue","displayName":"Fatigue Analysis","embeddingProfileId":"uuid"}
```

Validation: id `^[a-z0-9][a-z0-9-]{1,62}$`. displayName trimmed required max 120. embeddingProfileId = UUID, existing, purpose=embedding, resolver accepts. Reject fields: runtimeInstanceId, controlGeneration, hostPort, baseUrl, workspace, database, provider, modelId, apiKey, parser, retrievalMode, topK.

Safe admin response:

```json
{"id":"fatigue","displayName":"Fatigue Analysis","embeddingProfileId":"uuid","state":"running",
 "health":{"state":"healthy","checkedAt":"...","failureCode":null},
 "available":true,"activeOperation":null,"createdAt":"...","createdByUserId":"uuid","updatedAt":"..."}
```

runtimeInstanceId + controlGeneration never appear. Create/start/stop return `{operationId, domain}`. Hard delete returns 202 deletion_pending.

Error map:

```text
401 unauthenticated | 403 forbidden | 404 not_found | 409 conflict (dup ID/name, busy, bad action)
422 validation_failed | 422 configuration_unavailable (embedding can't resolve) |
422 configuration_invalid (wrong purpose) | 503 runtime_unavailable | 500 internal_error
```

Never return raw Docker/LightRAG/DB/provider errors, paths, URLs, stacks, secrets.

---

## 13. Service ownership

```text
DomainLifecycleService    create/start/stop/delete orchestration, DB state, op rows, fencing
DomainAvailabilityResolver available-domain list + enforcement
DomainRepository          domain reads/mutations
DomainOperationRepository op rows
DomainControllerClient    token-auth internal calls, safe DTO mapping
TrustedRuntimeResolver    private embedding-profile validation (P2)
DomainRuntimeController   naming, Docker, storage, health probe
RuntimeNamingPolicy       internal resource derivation
```

Flow: route -> require_admin -> DomainLifecycleService -> DB txn (lock+fence+op) -> DomainControllerClient -> controller -> DB txn (guarded finalization) -> safe DTO / 202.

Forbidden: route->socket/filesystem/compose/provider-decrypt/raw-health. controller->app DB/browser auth. member route->direct controller/runtime URL.

---

## 14. Repo layout (add)

```text
docker/lightrag-runtime.Dockerfile
backend/
├── alembic/versions/0003_domain_lifecycle.py
├── app/
│   ├── api/v1/{admin_domains.py, domains.py}
│   ├── core/{config.py, domain_policy.py}
│   ├── db/models/domains.py
│   ├── db/repositories/{domains.py, domain_operations.py}
│   ├── schemas/domains.py
│   ├── services/{domain_availability.py, domain_controller_client.py, domain_lifecycle.py}
│   ├── worker/{__main__.py, delete_completion.py}   # single worker; P4/P5 extend same process
│   └── runtime_controller/{app.py, docker_gateway.py, health_probe.py, runtime_naming.py, storage_provisioner.py}
│   └── tests/{integration/, unit/, compose/}
└── docs/{api/phase-3-contract.md, security/domain-controller-auth-token.md}
.data/   # gitignored, controller-owned
```

Do not add: manifest JSON, compose/domain.env generator, provider secret cache, Docker access in API, Redis/queue table, status poller, generic operations framework, archive/restore, runtime-log UI, K8s/service mesh/event bus/workflow engine. (The single delete-completion worker is allowed — §3 — but no queue/broker behind it.)

---

## 15. Deps + env

Controller deps only: `docker`, `httpx`. Worker reuses the app/Postgres stack (no new dep — claims via `FOR UPDATE SKIP LOCKED`). Do not add Docker SDK to API package, compose wrapper, K8s SDK, queue/broker, provider SDK, log aggregation, retry framework.

```dotenv
CONTEXT_DATA_ROOT=./.data                    # controller only, gitignored
DOMAIN_CONTROLLER_AUTH_TOKEN=replace-with-long-random
DOMAIN_CONTROL_URL=http://domain-controller:8020
DOMAIN_LIFECYCLE_TIMEOUT_SECONDS=90
DOMAIN_RUNTIME_HEALTH_TIMEOUT_SECONDS=5
DOMAIN_STATUS_FRESH_SECONDS=15
LIGHTRAG_RUNTIME_IMAGE=context-engine-lightrag:approved-pin   # never latest
LIGHTRAG_RUNTIME_CONTAINER_PORT=9621
LIGHTRAG_RUNTIME_HEALTH_PATH=/health
LIGHTRAG_RUNTIME_DATABASE_URL=postgresql://lightrag_runtime:change-me@postgres:5432/postgres  # controller only
```

Keep P1/P2 settings. Do not add per-domain port/base-url/workspace/env/secret/model-JSON vars or NEXT_PUBLIC_*.

---

## 16. Compose

Static services: postgres, migrate, api, worker, domain-controller. Runtime containers dynamic — never in root compose. `worker`: no public port, no Docker socket, no .data mount; Postgres + control-network access to call the controller for delete completion.

Controller: no published port, `${CONTEXT_DATA_ROOT}:/data`, `/var/run/docker.sock:/var/run/docker.sock`, control+runtime+storage networks. API: no socket, no .data mount, control network to controller only.

Dynamic runtime: name from RuntimeNamingPolicy; labels managed=true + domain-id + runtime-instance-id; network context-engine-runtime; no ports; mounts matching workspace+logs roots only; env = fixed upstream bootstrap + derived DB name, no provider creds in P3.

Checks: API no socket, controller no host port, runtime no host port, only controller mounts .data, no archive/deleted root, no generated compose/domain.env, runtime image pinned.

---

## 17. Build order

```text
Step 0 pin/prove empty runtime: approved pin, thin image, fixed empty bootstrap, real Docker smoke.
  Prove provider-free start, private health success, stop/remove success.

Step 1 schema/policy: ID validator, instance UUID gen, RuntimeNamingPolicy, three-state model,
  domain_operations + partial one-active index, embedding-profile reference guard, 0003 migration.
  Check: blank migration works, safe IDs only, deterministic instance-scoped naming, profile can't mutate/delete.

Step 2 narrow controller: app, token validation, fixed routes, per-instance in-memory action lock,
  Docker gateway, storage provisioner, health probe, safe DTO, fake adapters for tests.
  Check: bad token rejected, bad ID/instance rejected, arbitrary image/path/env/port/command rejected,
  old instance can't match new instance resources.

Step 3 create/read/operations: repos, create flow, safe admin list/read/history, embedding resolver validation.
  Check: create -> stopped + create op, workspace/log + DB exist, no container, no provider call.

Step 4 start/status/member availability: controller start/status, start flow, health mapping,
  DomainAvailabilityResolver, member list.
  Check: healthy runtime visible to member, unhealthy/stale absent, no host port, no provider call.

Step 5 worker + stop/hard delete/reconcile: worker delete-op claim loop, stop removes container,
  hard-delete records 202 + worker completes, deleting retry, stale inspect/settlement, guarded finalization.
  Check: hard delete removes DB/container/workspace/logs/domain row/operations,
  delete completes through the worker AND survives API restart mid-delete,
  same ID -> new instance, old instance can't touch new.

Step 6 contract proof: OpenAPI snapshot, unit/integration/compose smoke, README, P3 contract, auth-token contract.
  Run pytest + compose up.
```

---

## 18. Tests

### Unit

```text
ID validation safe lowercase only | instance UUID private/unique/not-DTO |
naming deterministic + instance can't collide | create -> stopped+op |
start stopped->running only after health | failed start cleaned up, stays stopped, safe op error |
stop removes runtime->stopped | delete fences first, absence -> row delete |
delete retry resumes | deleted domain no read/status/start/stop/ops route |
recreate same ID -> new instance | old action can't target recreated instance |
one active op blocks conflict | late finalizer generation-mismatch can't overwrite |
stale reconcile settles confirmed, ambiguous stays busy | availability = running+no op+fresh healthy |
referenced embedding profile can't mutate/delete | safe error mapping | token validation | no provider call
```

### Integration

```text
1. seed admin + member. 2. valid embedding profile. 3. anon admin 401. 4. member admin 403.
5. member /domains empty. 6. create domain. 7. one stopped row + create op.
8. start healthy -> member sees. 9. health failure removes visibility. 10. stop -> member loses it.
11. delete running/stopped -> 202. 12-16. verify container/DB/workspace/logs/domains row/operations absent.
17. GET deleted domain/status/operations 404. 18. recreate same ID new instance.
19. old-instance action can't alter new. 20. partial delete leaves deleting; retry finishes.
21. referenced embedding PATCH/DELETE = 409 before delete. 22. profile eligible after hard delete.
23. X-Request-ID present. 24. OpenAPI no private instance/resource/secret field. 25. provider mock no call.
```

### Compose smoke

```text
fresh .data -> compose starts pg/migrate/api/worker/controller -> API no socket -> controller no host port ->
create fatigue -> start fatigue -> docker port = no host mapping -> private health ok -> member sees ->
delete fatigue (202) -> worker completes -> container absent -> runtime DB absent -> matching .data root absent ->
domains/operations rows absent -> no archive root -> recreate fatigue ok.
restart api mid-delete -> worker still finishes the deleting domain (op stays running, re-claimed).
```

Not tested now: documents, parser, source artifacts, LightRAG doc APIs, ingestion/indexing, retrieval/evidence/chat, provider execution/failover, runtime log viewer, status poller, archive/restore, multi-host.

---

## 19. Security checklist

```text
[ ] P1 auth/session unchanged. [ ] P2 config unchanged. [ ] API no Docker socket.
[ ] Controller no host port. [ ] Token compare constant-time. [ ] Browser can't reach controller/LightRAG/Docker.
[ ] Controller fixed actions only. [ ] Caller can't choose image/command/path/port/network/DB/env.
[ ] Every resource derives from validated ID + private instance. [ ] Runtime no public port.
[ ] No provider secret/config in domains/operations/.data/API/logs. [ ] No generated compose/domain.env.
[ ] No provider call. [ ] Availability = running + fresh health + no active op.
[ ] Delete verifies container/DB/root absence before completion. [ ] Successful delete removes all rows + runtime DB + workspace + logs.
[ ] No archive/tombstone/restore. [ ] Old instance can't target reused ID. [ ] Referenced embedding profile can't mutate/delete.
[ ] Controller never accesses app DB/provider config.
```

---

## 20. Common mistakes

| Mistake | Why bad | Correct |
|---|---|---|
| keep archived after hard-delete | hidden second deletion model | successful delete removes row |
| keep archive root "just in case" | retains data/complexity | recursively remove matching root |
| keep failed lifecycle state | failure = op result | stable state + failed op |
| persist available | drift-prone duplicate | derive in resolver |
| persist health enum | duplicates observation | timestamp + safe failure code |
| generic operations framework | one use case | domain_operations table |
| delete DB row before external resources | loses retry/fence anchor | deleting until absence verified |
| reuse ID with ID-only resources | old request hits new domain | instance-scoped identity |
| API mounts socket | host risk | controller only |
| publish runtime ports | bypass auth/conflicts | private network only |
| sync 204 delete | API lies about async cleanup | 202 deletion_pending (P0 §10) |
| add repair/recreate | expands lifecycle | stop then start; start ensures storage |
| poller/worker now | no workload | on-demand bounded status |

---

## 21. Definition of done

```text
Admin: create empty domain w/ one embedding profile, inspect safe state/status/history,
  start, stop, hard delete runtime + domain.
Member: sees only available domains, can't manage/inspect internals.
System: one Postgres registry, three states (stopped/running/deleting), one domain-specific op table,
  health observation only, availability derived, one private Docker-privileged controller,
  one private runtime/workspace/DB per active instance, no browser/direct runtime access, no public port,
  no manifest/generated compose/domain.env, no provider secret in artifacts, no provider call,
  true hard delete (202 async), no archive/tombstone/restore, same ID reusable after delete, tests green.
```

## Final boundary

```text
P3: admin -> domain registry -> embedding profile reference -> empty private runtime/storage ->
  start/stop/status -> member-safe availability -> irreversible hard delete.
Not P3: documents -> parsing -> source artifacts -> indexing -> retrieval/evidence/chat ->
  browser UI -> provider execution -> jobs/workers -> archive/restore -> complex operations platform.
```
