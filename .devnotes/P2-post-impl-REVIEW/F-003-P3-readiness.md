# F-003 / P3 — Knowledge Domain + private LightRAG runtime

**Goal:** Admin creates/starts/stops/deletes empty Knowledge Domains. Each domain gets isolated private LightRAG runtime. Members list only queryable domains.

**Not in P3:** UI, source upload, indexing, provider calls, public runtime ports, API Docker socket.

---

## Big picture

```text
Browser (later P9)
    |
    |  cookie session, safe DTOs only
    v
Context Engine API  ----------------->  Postgres
    |                                      |
    |                                      +-- domains
    |                                      +-- domain_operations
    |
    +--> Worker (one process, P3: delete path only)
    |         |
    |         v
    +--> Private Domain Controller  ---->  Docker socket
              |                              |
              |                              v
              +------------------------>  LightRAG container
                                           (one per running domain)
                                           no host port published
```

**Trust rule:** Browser never sees Docker, runtime URL, paths, container ID, `runtime_instance_id`, provider secrets.

Reference: `specs/02-architecture/system-context.md`, `AGENTS.md` rule 5–6.

---

## What "Knowledge Domain" means here

Not tenant. Not user workspace. Not deployment env.

```text
Knowledge Domain
  |-- public id          (e.g. "fatigue")     -> API/URL
  |-- display name
  |-- state              stopped | running | deleting
  |-- embedding profile  locked at create
  |
  +-- private (never in API DTO)
        runtime_instance_id
        control_generation   (stale worker fence)
        workspace / logs / runtime DB on disk
        LightRAG container
```

From `CONTEXT.md`, `specs/01-product/domain-model.md`.

---

## End-to-end build order (tasks.md)

```text
T-010  DB migrations
         domains + domain_operations
         runtime_instance_id, control_generation
           |
           v
T-020  API routes
         admin CRUD/lifecycle + member GET /domains
           |
           v
T-030  Controller boundary
         token-auth internal routes
         Docker lifecycle (start/stop/delete container)
           |
           v
T-040  Worker
         async delete completion
         generation fence for stale actions
           |
           v
T-900  Run test-plan.md
T-910  Update acceptance + traceability
```

**Do not skip order.** Data/contract before consumers.

---

## Lifecycle flows

### Create (sync)

```text
Admin POST /admin/domains
  |
  +-> validate embedding profile exists (via TrustedRuntimeResolver — F-002)
  +-> insert domain row: state=stopped
  +-> assign runtime_instance_id (private)
  +-> provision empty storage/runtime DB (NO provider call, NO container yet)
  +-> insert domain_operation type=create
  |
  v
return safe admin DTO (no private fields)
```

### Start (likely sync — **not fully specified**)

```text
Admin POST .../start
  |
  +-> reject if deleting / active op / invalid state
  +-> insert operation type=start
  +-> API -> controller: start container (private network only)
  +-> state=running
  +-> operation=succeeded
  |
  v
availability can become true (see below)
```

### Stop

```text
Admin POST .../stop
  |
  +-> controller removes runtime container
  +-> state=stopped
```

Per reference P3 test gate: stop removes container.

### Availability (computed, never persisted)

```text
available =
  state == running
  AND no active domain_operation
  AND fresh private health == healthy
```

Member `GET /domains` returns **only** available domains:

```json
{ "domains": [{ "id": "fatigue", "displayName": "Fatigue Analysis", "available": true }] }
```

Admin routes show full lifecycle; still no private fields.

### Delete (async, resumable)

```text
Admin DELETE /admin/domains/{id}  -> 202
  |
  +-> lock domain
  +-> state=deleting
  +-> insert operation type=delete
  +-> worker + controller:
  |       remove container
  |       remove runtime DB
  |       remove workspace
  |       remove logs
  +-> verify absence
  +-> delete domain row + operation rows
  |
  v
later GET -> 404

Partial failure -> stays deleting
Admin repeats DELETE -> resume
```

From `.references/.../P3_knowledge_domains_runtime.md`, QA-004 delete partial failure rule.

### ID reuse + generation fence

```text
Domain "fatigue" deleted completely
  |
  v
New domain id "fatigue" allowed

Old worker/controller action with stale control_generation
  -> must NOT affect new instance
```

AC-005 + AC stale-generation tests in plan.

---

## Layer ownership (who does what)

```text
+------------------+---------------------------+
| Layer            | Owns                      |
+------------------+---------------------------+
| API route        | authz, DTO, state change  |
| Domain service   | business rules, op rows     |
| Repository       | Postgres CRUD               |
| Controller       | Docker + private health     |
| Worker           | async delete completion     |
| TrustedRuntime   | embedding profile validate  |
|   Resolver (P2)  | at create only              |
+------------------+---------------------------+
```

**Forbidden in P3:** generic workflow engine, Redis/RQ/Celery, API Docker socket, status poller service, runtime manifest tables.

DEC-005: one worker, resource-owned operation tables.

---

## Dependency gate: F-002 first

F-003 `depends_on: [F-002]`.

P3 needs:
- `model_profiles` with embedding kind + `vector_dimensions`
- `TrustedRuntimeResolver` — exists in code (`context_engine/services/runtime_config.py`)
- rule: embedding profile **immutable once domain references it**

Register says F-002 `approved`, acceptance still `not implemented`. **Finish/verify P2 before P3**, or domain-create validation has no stable foundation.

---

## Questions MUST answer before coding

Spec says product intent locked (`Open Decisions: none`). But **contracts + infra still have gaps**. Per spec + BR-012: unknown shape -> fixture-capture task -> block until evidence.

### A. Contract capture gaps (blockers)

| # | Question | Why it blocks |
|---|----------|---------------|
| A1 | Exact `domains` columns? Types, uniqueness, FK to `model_profiles`? | DATA-001 lists table name only — no field spec |
| A2 | Exact `domain_operations` columns? Op states, lease fields, error fields? | Same gap |
| A3 | `POST /admin/domains` request body? `id` format rules? Required `embeddingProfileId`? | API-001 has route list, no P3 DTOs |
| A4 | Admin list/detail/status/operations response shapes? | Frontend P9 + OpenAPI snapshot need this |
| A5 | Error codes for invalid id, duplicate id, bad profile, start while deleting, delete non-empty? | Safe envelope tests |
| A6 | `GET /admin/domains/{id}/status` — what safe fields? Active op summary? Computed availability for admin? | Named in routes, undefined in contract |
| A7 | Member route: filter unavailable only, or return all with `available: false`? | Reference says available only |

**Action:** extend `specs/03-contracts/api/context-engine-v1.md` + `data/context-engine-data.md` **before** T-020.

### B. Controller contract (blocker — no spec file yet)

| # | Question |
|---|----------|
| B1 | Controller process shape? Same repo, separate service, sidecar? |
| B2 | Internal base URL + token header name? Rotation? |
| B3 | Exact internal routes? `start`, `stop`, `remove`, `health`? Request/response bodies? |
| B4 | How API passes `runtime_instance_id` + generation to controller? |
| B5 | Deterministic runtime naming policy — exact formula? |
| B6 | Container image/tag source? Env injection at start (P0 says no `domain.env` file — how inject config)? |
| B7 | Private network: how API/worker reach runtime HTTP? Docker network name? |
| B8 | Health check: endpoint, timeout, "fresh" TTL? Unhealthy -> member hidden, admin sees what? |

**Action:** new internal contract doc (or ARCH addendum) + **manual/integration fixture** proving start/stop/delete on target Docker host.

Spec rule: *"Runtime unknowns: stop when required fixture cannot be proven."*

### C. Worker + concurrency

| # | Question |
|---|----------|
| C1 | Start/stop sync in API request, or async like delete? Reference implies sync for start/stop, async for delete — confirm |
| C2 | Worker claim/lease pattern for delete? P4 documents lease for prep ops; P3 silent |
| C3 | What counts as "active operation"? Blocks start/stop/delete/availability? |
| C4 | Create/start/stop operation terminal states — always `succeeded`/`failed`? Retry rules? |
| C5 | DB transaction boundary: never hold txn open during controller call (ARCH-004) — exact pattern per action? |

### D. Delete preconditions (P3 = "empty" domain)

| # | Question |
|---|----------|
| D1 | P3 has no sources table yet — "empty" always true? Or block delete if any op stuck? |
| D2 | Can delete `stopped` domain never started? Must cleanup storage anyway? |
| D3 | P4 adds sources — delete domain purges sources first. P3 handoff: schema ready for that FK? |

Reference P3 handoff: *"P4 can place source storage under domain instance root and block upload when deleting."*

### E. Storage layout (private)

| # | Question |
|---|----------|
| E1 | Root path env var name? Per-domain subdirectory rule? |
| E2 | Runtime DB: SQLite file? Postgres schema? Name derived how? |
| E3 | Workspace + logs paths — created at create or start? |
| E4 | Create provisions "empty storage/runtime DB" — what exactly exists before first start? |

Out of scope: persist paths in DB/API. Still need impl convention.

### F. Authz + roles

| # | Question |
|---|----------|
| F1 | All `/admin/domains/*` admin-only — confirm 403 for member |
| F2 | `GET /domains` — member + admin both? Admin sees same filtered list or all domains? |

`specs/01-product/roles-and-permissions.md`: member lists **available** domains only.

### G. Test / evidence

| # | Question |
|---|----------|
| G1 | CI has Docker socket for integration tests? Or fake controller for unit + manual gate? |
| G2 | Safe DTO snapshot list — forbidden field scan automation? |
| G3 | Fresh-upgrade migration test pattern from F-001/F-002 — reuse how? |

Each AC in `acceptance.md` needs real command output, not "planned".

---

## Acceptance criteria = your definition of done

| AC | Plain English |
|----|---------------|
| AC-001 | Create rejects bad/missing embedding profile |
| AC-002 | Start spins private runtime, **no host port** |
| AC-003 | Member list = running + healthy + no active op only |
| AC-004 | Delete removes container, runtime DB, workspace, logs, DB rows |
| AC-005 | Reuse public id only after full delete; stale gen ignored |
| AC-006 | API process has **no** Docker socket |

---

## What junior dev should read (order)

```text
AGENTS.md
CONTEXT.md
specs/04-features/F-003-knowledge-domains-runtime/spec.md
specs/04-features/F-003-knowledge-domains-runtime/plan.md
specs/03-contracts/api/context-engine-v1.md      (P3 routes)
specs/03-contracts/data/context-engine-data.md   (P3 tables — incomplete)
specs/02-architecture/system-context.md
specs/02-architecture/integration-flows.md       (INT-003)
.references/.../P3_knowledge_domains_runtime.md  (evidence, more detail)
F-002 spec + TrustedRuntimeResolver in code
```

---

## Practical start checklist

```text
[ ] F-002 verified (embedding profiles + resolver)
[ ] DATA-001 P3 field spec written
[ ] API-001 P3 DTO spec written
[ ] Controller internal contract written
[ ] Docker fixture captured on target infra
[ ] Then T-010 -> T-040 in order
[ ] Stop if any AC needs proof you cannot run
```

---

## One-line summary

P3 = **Postgres domain truth + private controller Docker + worker delete cleanup**, with **safe API surface**. Product rules mostly locked; **table fields, DTOs, controller protocol, storage layout, health semantics** still need written contracts + Docker proof before implementation — not guessing in code.

Want drill-down on one area (controller protocol, delete worker, or migration schema)? Say which.



Short answer: **partially**. Old server = useful **evidence**, not drop-in spec. Many answers **contradict** greenfield P3 (host ports, compose manifest, `domain.env`, sync delete, no controller, no generation fence).

Use old code as **reference to adapt**, not copy.

---

## Master table — old server vs P3 questions

| ID | Question | Old answers? | Answer from `.references/code/server` | Greenfield delta |
|----|----------|--------------|----------------------------------------|------------------|
| **A — Contract / data** |
| A1 | `domains` columns? | **Partial** | Table `lightrag_domains`: `id` PK `String(64)`, `display_name`, `state`, `health_status`, `error_message`, `meta` JSON, timestamps. No `embedding_profile_id` column — lives in manifest/`meta.desired_manifest`. No `runtime_instance_id`, no `control_generation`. | Need new `domains` + `domain_operations` per DATA-001; do not reuse `lightrag_domains` shape |
| A2 | `domain_operations` columns? | **Partial (different model)** | Generic `jobs` table: `kind`, `status`, `resource_type=domain`, `resource_id`, `stage`, `message`, `attempts`, `metadata`, timestamps. Ops: `domain_create`, `domain_start`, `domain_stop`, `domain_delete`, etc. | P3 wants dedicated `domain_operations`, not generic jobs |
| A3 | `POST /admin/domains` body? | **Partial** | `LightRAGDomainCreateRequest`: `domain_id` regex `^[a-z0-9][a-z0-9_-]{1,62}$`, optional `display_name`, optional `host_port`, optional `embedding_profile_id`, `make_default`. Route: `POST /admin/lightrag-domains` | Drop `host_port`, `make_default`; require `embeddingProfileId`; new path `/admin/domains` |
| A4 | Admin list/detail/status DTOs? | **Partial** | Admin via `LightRAGDomainReadService.admin_payload()`: id, display_name, host_port, status, is_healthy, available, lifecycle, metadata, reachability, etc. **Leaks** host_port, paths in metadata | New FR-003: strip runtime URL, container, paths, provider config |
| A5 | Error codes? | **Partial** | HTTP 400/404/409/502 with codes like `lightrag_domain_port_conflict`, `lightrag_domain_provider_config_missing`, `lightrag_domain_operation_failed` | Port conflict N/A in greenfield; map to API-001 safe envelope |
| A6 | Status endpoint fields? | **No dedicated route** | No `GET .../status`. Admin `GET /admin/lightrag-domains/{id}` returns full admin payload | Must define new status DTO |
| A7 | Member list filter? | **Contradicts** | `GET /lightrag/domains` returns all non-`BLOCKED` domains with `available: true/false` on each row | P3: return **only** available domains, not full list with flag |
| **B — Controller** |
| B1 | Controller process shape? | **Contradicts** | No separate controller. `LightRAGDomainService` in API process calls `SubprocessDockerComposeRunner` directly | P3: private controller + **API has no Docker socket** |
| B2 | Internal token auth routes? | **No** | None. Docker via subprocess in API | Must design new internal contract |
| B3 | Internal route list? | **Partial (in-process)** | Ops map to: `create_domain`, `up`, `down`, `remove`, `regenerate_artifacts`, `apply_provider_config` — all Python methods, not HTTP | Extract to token-auth controller HTTP |
| B4 | Pass `runtime_instance_id` + generation? | **No** | No such fields anywhere | New greenfield-only |
| B5 | Runtime naming policy? | **Yes** | `service_name=lightrag_{domain_id}`, `container_name=context_engine_lightrag_{domain_id}`, `postgres_database=lightrag_{sanitized_id}`, `postgres_user=lightrag_{sanitized_id}` where sanitized = `re.sub(r'[^a-z0-9_]', '_', id.lower())[:48]` | Reuse naming **idea**; add `runtime_instance_id` fence |
| B6 | Container image + config inject? | **Partial (forbidden pattern)** | `docker/lightrag.Dockerfile`, generated compose at `.data/lightrag/docker-compose.lightrag-domains.yml`, per-domain `domain.env` via `write_domain_env()` | P0/P3 **forbid** compose manifest + `domain.env`; need typed runtime inject at start only |
| B7 | Private network reachability? | **Partial** | Docker network `context_engine_lightrag`. Mode `host` uses `host_base_url`; mode `socket` uses `container_base_url` `http://lightrag_{id}:9621` | Greenfield: **no host port** → socket/private network only |
| B8 | Health check semantics? | **Yes (pattern)** | After start: probe `GET {base_url}/health`, 5 attempts, 1s sleep, timeout from settings. Manifest status `running` if healthy else `unhealthy`. Registry blocks `stopped`, `unhealthy`, `archived`, `error` | P3: computed availability = running + no active op + **fresh** health; do not persist health enum |
| **C — Worker / concurrency** |
| C1 | Start/stop sync or async? | **Yes** | Start/stop **sync** in request handler. Delete also **sync** in handler | P3: delete **async 202** + worker resume |
| C2 | Worker lease for delete? | **No** | Delete runs inline in API route; separate `DomainPurgeService` for permanent purge but still sync | P3 needs worker lease/resume pattern |
| C3 | Active operation blocks actions? | **Partial** | Ops tracked in `jobs` but no explicit "block start if op running" fence on domain row | Need explicit active-op gate for availability; 409 `domain_operation_in_progress`; admin toast on blocked second op (ID-A-domain-concurrency.md) |
| C4 | Operation terminal states? | **Yes (jobs model)** | `queued → running → succeeded/failed/cancelled` via `JobRepository` | Map to `domain_operations` states |
| C5 | No txn during Docker call? | **Unknown/unenforced** | Route does DB updates around sync Docker calls; no explicit txn boundary doc in code | Keep ARCH-004 rule in new impl |
| **D — Delete** |
| D1 | Empty domain precondition? | **Partial** | P3-empty: create provisions storage without sources. Old delete **also purges all domain documents** inline (`_purge_domain_documents`) | P3 P3-phase: empty only; P4 adds source purge before domain row gone |
| D2 | Delete never-started domain? | **Yes** | `remove()` drops manifest entry; archive or rmtree root under `.data/lightrag/domains/{id}` | Same cleanup idea; async + hard delete in greenfield |
| D3 | FK ready for P4 sources? | **Partial** | Documents have `lightrag_domain_id`; delete purges docs first | Align with P4 "domain delete purges sources first" |
| **E — Storage** |
| E1 | Root path env? | **Yes** | Default `.data/lightrag/domains`; config `lightrag_domains_root`, `lightrag_deploy_root` | Private env var name TBD in greenfield; pattern reusable |
| E2 | Runtime DB? | **Yes** | Per-domain Postgres DB `lightrag_{suffix}` + user via `LightRAGPostgresProvisioner`, `storage_backend=postgres`, `per_domain` mode | Same per-domain PG idea; name not in API |
| E3 | Workspace/logs created when? | **Yes** | At **create**: `ensure_domain_paths()` mkdirs `inputs/`, `rag_storage/`, `artifacts/`, `logs/` under domain root | Create provisions dirs; container at start |
| E4 | Exists before first start? | **Yes** | Create: PG provision + dirs + manifest entry + compose regen. **No container** until `up()` | Matches P3 "empty storage/runtime DB, no provider call, no container" |
| **F — Authz** |
| F1 | Admin-only admin routes? | **Yes** | `require_admin` on all `/admin/lightrag-domains/*` | Same |
| F2 | Member `GET /domains`? | **Partial** | Any authenticated user on `GET /lightrag/domains`; returns non-blocked domains (incl. stopped) | P3: members only; **available-only** filter |
| **G — Test** |
| G1 | CI Docker? | **Partial** | `docker_execution_mode` host vs socket; compose subprocess tests likely env-dependent | Fixture-capture on target infra still required |
| G2 | Safe DTO snapshots? | **Contradicts** | Member/admin payloads expose `host_port`, paths in metadata, provider artifact hints | New code must fail secret/path scan |
| G3 | Migration pattern? | **Partial** | Alembic-style tables in monolith; different schema | Reuse fresh-upgrade **process**, not schema |

---

## What old code answers well (reuse ideas)

### Domain ID validation
```10:11:.references/code/server/lightrag_deploy/models.py
    domain_id: str = Field(pattern=r"^[a-z0-9][a-z0-9_-]{1,62}$")
```

### Embedding profile validation (adapt to `TrustedRuntimeResolver`)
```9:18:.references/code/server/services/model_profile_resolver.py
    def resolve_embedding_profile(self, embedding_profile_id: str | None = None) -> AIModelProfileRow:
        if embedding_profile_id:
            profile = self.service.get_profile(embedding_profile_id)
            if profile is None:
                raise ValueError(f"Profile '{embedding_profile_id}' does not exist")
            if profile.kind != "embedding":
                raise ValueError(f"Profile '{embedding_profile_id}' is not an embedding profile")
```

Greenfield: **required** at create, no global default (old allows default embedding).

### Storage layout at create
```40:50:.references/code/server/lightrag_deploy/paths.py
    def domain_paths(self, domain_id: str) -> DomainPaths:
        safe_id = validate_domain_id(domain_id)
        root = self.settings.domains_root / safe_id
        return DomainPaths(
            root=root,
            ...
            inputs=root / "inputs",
            rag_storage=root / "rag_storage",
            ...
            logs=root / "logs",
        )
```

### Create flow (no container yet)
```70:134:.references/code/server/lightrag_deploy/service.py
    def create_domain(self, request: LightRAGDomainCreateRequest) -> LightRAGDomain:
        ...
        self._provision_domain_postgres(domain)
        self._write_domain_env(domain, paths)
        self.manifest.add_domain(domain)
        self.compose.write(self.list_domains())
        return domain
```
Skip `domain.env` + compose regen in greenfield; keep PG + dirs + stopped state.

### Health probe pattern
```560:576:.references/code/server/lightrag_deploy/service.py
    def _probe_domain_health(..., attempts: int = 5, sleep_seconds: float = 1.0):
        ...
            health = policy.probe_after_deploy(domain_id)
            if health.healthy:
                break
```
Probe target: `{base_url}/health` in `lightrag_reachability_service.py`.

---

## What old code does NOT answer (still block P3)

| Gap | Why old code useless |
|-----|---------------------|
| `runtime_instance_id` | Not present |
| `control_generation` fence | Not present |
| Private token-auth controller | Docker in API process |
| Async delete `202` + worker resume | Sync delete in route |
| `domain_operations` table | Uses `jobs` |
| Safe admin DTO (no host_port/URL/path) | Leaks infra fields |
| Member available-only list | Returns stopped domains too |
| No host port | Old **requires** host port allocation |
| No `domain.env` / compose manifest | Old **depends** on both |
| Embedding lock at domain create | Old locks at **first successful ingestion** |

---

## Architecture comparison

**Old:**
```text
Browser -> API (FastAPI)
              |
              +-> subprocess `docker compose`  (Docker socket IN API)
              +-> Postgres lightrag_domains + jobs
              +-> JSON manifest .data/lightrag/domains.json
              +-> domain.env + generated compose
```

**Greenfield P3 target:**
```text
Browser -> API
              |
              +-> Postgres domains + domain_operations
              +-> Worker (delete only in P3)
              +-> Private Controller (Docker socket HERE)
                        |
                        v
                   LightRAG container (no host port)
```

---

## Verdict for junior dev

| Category | Old server coverage |
|----------|---------------------|
| A Contract/data | ~40% — ID, create body hints, ops pattern; wrong tables/fields |
| B Controller | ~15% — naming + health only; **architecture wrong** |
| C Worker | ~25% — sync lifecycle pattern; no async delete fence |
| D Delete | ~30% — cleanup steps; wrong sync/archive model |
| E Storage | ~70% — paths, PG per domain, create-before-start |
| F Authz | ~80% — admin gate; member filter wrong |
| G Test | ~20% — patterns only |

**Bottom line:** Read old server for **domain ID rules, embedding validation, disk/PG layout, health probe, container naming**. Do **not** port compose/env/host-port/API-Docker approach. Still need greenfield contract docs for controller, `domains`/`domain_operations` fields, safe DTOs, async delete.

Want same table narrowed to **only blockers** (things that must be spec'd before T-010)? Say so.