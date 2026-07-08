# Context Engine — Lean Per-Domain Runtime and Storage Boundary

**Status:** Greenfield architecture decision and coding-agent implementation plan  
**Scope:** Per-domain filesystem layout, LightRAG runtime persistence and logs, Docker mounts, lifecycle, availability, cleanup, and migration.  
**Depends on:** Knowledge Domain and Document Ingestion refactor slices.  
**Does not define:** Parser adapters, canonical document content, source artifacts, index-unit construction, or LightRAG pre-chunked ingest semantics.

---

## 1. Decision Summary

Use one host-visible root per Knowledge Domain:

```text
.data/
  domains/
    <domain-id>/
      source/
      workspace/
      logs/
```

This replaces the previous two-root model:

```text
.data/domains/<domain-id>/
.data/lightrag/<domain-id>/
```

The separate top-level LightRAG root is removed. It made delete, archive, backup, and migration span two paths without providing meaningful additional container isolation.

The real isolation boundary is the bind mount. Each LightRAG runtime receives only:

```text
.data/domains/<domain-id>/workspace/  → /workspace
.data/domains/<domain-id>/logs/       → /var/log/lightrag
```

It does not receive the parent domain root, `source/`, another domain’s directory, `.data/logs/`, `.data/archive/`, or the Docker socket.

### Final ownership

```text
.data/domains/<domain-id>/source/
  Context Engine owns:
  original source file, canonical manifest, parser artifacts, tables, figures,
  images, and source-aware index units.

.data/domains/<domain-id>/workspace/
  LightRAG owns:
  vector/KV/graph data, LightRAG document status, caches, and retrieval internals.

.data/domains/<domain-id>/logs/
  LightRAG owns:
  bounded runtime file logs only.

.data/logs/
  Context Engine owns:
  bounded global API, worker, and lifecycle logs.

Application database
  Context Engine owns:
  domain lifecycle, document metadata, index-profile lock, LightRAG document
  bindings, and existing generic audit/operation records.
```

### What remains deliberately removed

| Removed | Why functionality is preserved |
|---|---|
| Separate `.data/lightrag/<domain-id>/` root | `workspace/` and `logs/` are mounted directly; sibling roots add cleanup coordination but no extra security. |
| Per-domain `runtime/` directory | Runtime configuration is derived at start from database state and one static deployment template. |
| Persisted `runtime.json` | Domain ID and locked profile are canonical; a second runtime file becomes stale state. |
| Generated Compose file per domain | Use one static template and derive domain-specific values in memory during start. |
| Runtime-binding table | Runtime service/workspace names derive deterministically from domain ID. |
| Persistent `tmp/upload`, `tmp/parse`, `tmp/handoff` trees | The original source is durable before work begins; incomplete work can restart from source and generic operations state. |
| `recovery/` directory | Database state plus `source/` and `workspace/` are sufficient recovery inputs. |
| Dedicated lifecycle table | Reuse existing generic operations/audit records. |
| Continuous healthy-domain poller | Use on-demand health probes with a short cache and single-flight de-duplication. |
| New deployment microservice | Keep the existing private Docker-control boundary only if it already exists; do not create another service. |

### What is retained after this revision

| Retained | Specific risk prevented |
|---|---|
| Per-domain `logs/` directory | Keeps LightRAG runtime diagnostics host-visible and separate by domain. |
| LightRAG built-in file rotation | Prevents a busy domain’s runtime logs from growing without bound. |
| Docker stdout/stderr rotation | Prevents duplicate Docker-managed logs from accumulating outside `.data/`. |
| Global Context Engine logs | Preserves API/worker/lifecycle diagnostics without adding per-domain copies. |
| Thin private Docker-control boundary | Prevents browser-facing API processes from receiving Docker socket access. |

---

## 2. Final Filesystem Tree

```text
.data/
  domains/
    <domain-id>/
      source/                    # required; Context Engine only
        original/                # immutable uploaded source
        derived/                 # manifest, assets, and index-unit records
      workspace/                 # required; LightRAG runtime only
      logs/                      # required; LightRAG runtime only
        <runtime-log>
        <runtime-log>.1
        <runtime-log>.2
        ...

  logs/                           # optional; global Context Engine logs
    lifecycle.jsonl
    api.jsonl
    worker.jsonl

  archive/                        # deferred; created only for explicit archive retention
    <domain-id>-<timestamp>/
```

The actual LightRAG log filename is an implementation detail of the pinned LightRAG image. Context Engine requires only that the pinned runtime writes its rotating file logs under `/var/log/lightrag`, which is the mounted `logs/` directory.

Do not prescribe LightRAG subdirectories inside `workspace/`. LightRAG’s workspace remains opaque to Context Engine.

### Directory classification

| Path | Classification | Owner | Purpose |
|---|---|---|---|
| `.data/domains/<id>/` | Required | Context Engine | One validated host-visible root per Knowledge Domain. |
| `source/original/` | Required | Context Engine | Original source retained for preview, traceability, and deterministic reprocessing. |
| `source/derived/` | Required | Context Engine | Canonical manifest, parser assets, and index-unit persistence. |
| `workspace/` | Required | LightRAG | Opaque per-domain retrieval persistence. |
| `logs/` | Required | LightRAG | Rotated runtime file logs only. |
| `.data/logs/` | Optional | Context Engine | Small global JSONL logs keyed by domain/document/operation ID. |
| `.data/archive/` | Deferred | Context Engine deletion policy | Explicit archive disposition only; not required for permanent delete. |
| Any persistent `runtime/` directory | Removed | N/A | Runtime configuration is derived, not stored per domain. |
| Any persistent `tmp/` directory | Removed | N/A | Only durable source and derived data belong in the domain root. |

---

## 3. Ownership and Docker Mount Matrix

### Filesystem ownership

| Path | Writer | Reader | Canonical owner |
|---|---|---|---|
| `source/original/` | Context Engine API / source-preparation worker | Authorized source-preview route / worker | Context Engine |
| `source/derived/` | Parser/index-unit preparation worker | Context Engine API / worker | Context Engine |
| `workspace/` | This domain’s LightRAG runtime | Same runtime; controlled migration tool only | LightRAG |
| `logs/` | This domain’s LightRAG runtime | Restricted administrator diagnostics | LightRAG |
| `.data/logs/` | Context Engine API/worker/lifecycle logic | Restricted administrator diagnostics | Context Engine |
| `.data/archive/` | Explicit archive/delete operation | Restricted administrator recovery workflow | Context Engine |

### Container mounts

| Process | Required mount | Access | Must not mount |
|---|---|---|---|
| LightRAG runtime for domain `D` | `.data/domains/D/workspace/ → /workspace` | Read/write | `source/`, any other domain root, `.data/logs/`, archive, Docker socket |
| LightRAG runtime for domain `D` | `.data/domains/D/logs/ → /var/log/lightrag` | Read/write | Parent domain root; other logs; Docker socket |
| Context Engine API | `.data/domains/ → /data/domains` | Read/write, trusted server process | Docker socket |
| Source-preparation worker | `.data/domains/ → /data/domains` | Read/write, trusted server process | Docker socket |
| Private deployment-control boundary | Docker socket plus static deployment template | Docker control only | Domain `source/` and raw document files |
| Browser | None | None | All host paths, runtime containers, logs, secrets, and Docker endpoints |

The API and worker may see all domain roots because they are trusted application processes. Their domain authorization and validated path helpers remain mandatory. They must not write to `workspace/` in ordinary operation.

### Required LightRAG runtime shape

```yaml
services:
  lightrag-domain:
    image: <pinned-image-digest>
    environment:
      WORKING_DIR: /workspace
      LOG_DIR: /var/log/lightrag
      LOG_LEVEL: INFO
      VERBOSE: "False"
      LIGHTRAG_PERFORMANCE_TIMING_LOGS: "false"
      LOG_MAX_BYTES: "10485760"
      LOG_BACKUP_COUNT: "5"
      # Provider credentials are injected at runtime and never written to this file.
    volumes:
      - type: bind
        source: /host/project/.data/domains/<domain-id>/workspace
        target: /workspace
      - type: bind
        source: /host/project/.data/domains/<domain-id>/logs
        target: /var/log/lightrag
    logging:
      driver: local
      options:
        max-size: "10m"
        max-file: "3"
```

Before implementation, validate the pinned LightRAG image honors `LOG_DIR`, `LOG_MAX_BYTES`, and `LOG_BACKUP_COUNT` in its server runtime. If it does not, configure its supported file logger through the narrow pinned runtime overlay rather than introducing a sidecar or external log collector.

---

## 4. Minimal Runtime Model

Do not create a dedicated runtime-binding table or persist runtime JSON.

```ts
type KnowledgeDomain = {
  id: string;
  name: string;
  slug: string;

  lifecycle: "stopped" | "starting" | "running" | "deleting";

  indexProfileId: string;
  indexProfileFingerprint: string;
  indexProfileLockedAt: string | null;

  createdAt: string;
  createdByUserId: string;
  updatedAt: string;
};
```

Derive runtime details from the stable domain ID:

```ts
const domainRoot = `.data/domains/${domain.id}`;
const workspaceRoot = `${domainRoot}/workspace`;
const logRoot = `${domainRoot}/logs`;

const workspaceKey = `domain_${domain.id}`;
const composeProjectName = `ce_${domain.id.replaceAll("-", "")}`;
```

Do not store these derived values unless a verified deployment constraint proves they cannot be reconstructed.

### Canonical state

| Concern | Canonical source |
|---|---|
| Domain identity and lifecycle | Application database |
| Index profile and lock | Application database |
| Source document and LightRAG document binding | Application database |
| Original source and derived artifacts | `source/` plus database references |
| LightRAG vectors/graph/status persistence | `workspace/` and LightRAG API |
| Runtime availability | Lifecycle plus bounded private health probe |
| Lifecycle history and safe errors | Existing generic operations/audit records |
| LightRAG runtime logs | Domain `logs/` directory, subject to retention policy |
| Generated Docker configuration | Static deployment template plus in-memory derived values |

No generated Compose file, runtime JSON, or directory tree is a second mutable domain registry.

---

## 5. Logging and Retention Policy

## 5.1 Design principles

1. Runtime logs are useful administrator diagnostics, but they are not the primary status system.
2. Context Engine availability, generic operation records, and safe typed error codes remain the primary UI-facing operational contract.
3. Logs must be bounded by size **and** have a simple age policy.
4. No log collector, sidecar, scheduled service, or observability platform is introduced.
5. Logs must never be sent to the browser as raw content.
6. Logs must never contain provider secrets, JWTs, database passwords, original document contents, full prompts, or full retrieved context by default.

## 5.2 LightRAG runtime logs

Configure the pinned LightRAG runtime at:

```text
LOG_DIR=/var/log/lightrag
LOG_LEVEL=INFO
VERBOSE=False
LIGHTRAG_PERFORMANCE_TIMING_LOGS=false
LOG_MAX_BYTES=10485760
LOG_BACKUP_COUNT=5
```

### Retention rule

| Dimension | Rule |
|---|---|
| Active runtime log | One active file, capped at 10 MiB before rotation. |
| Rotated runtime logs | Retain at most five backups. |
| Maximum retained runtime file-log footprint | Approximately 60 MiB per domain: active log plus five 10 MiB backups. |
| Age policy | Delete rotated runtime logs older than 30 days. Never externally delete the active log while its runtime is running. |
| Prune trigger | Run `pruneDomainLogs(domainId)` during Start before the runtime begins, and after Stop. |
| Domain delete | Archive or delete the entire domain `logs/` directory with the domain root. |
| Performance logging | Disabled unless a time-limited diagnostic investigation requires it. |

The rotation count gives a hard storage ceiling even if a runtime remains active for months. The 30-day age check removes old rotated files without a new scheduled service. A quiet long-running domain may retain one active log file longer than 30 days, but it remains capped at 10 MiB; this is an intentional tradeoff to avoid touching an open log file from outside the runtime.

### `pruneDomainLogs` rule

`pruneDomainLogs(domainId)` is a small existing-lifecycle helper, not a worker or daemon.

It may delete only:

```text
.data/domains/<domain-id>/logs/<rotated-log-file>
```

when all conditions are true:

1. the path was produced by the validated domain-root helper;
2. it is inside that domain’s `logs/` directory;
3. it is a rotated file, not the active current log;
4. it is older than 30 days;
5. it is not a symlink.

It must not inspect, parse, or alter LightRAG log contents.

## 5.3 Docker stdout/stderr logs

LightRAG may still write to stdout/stderr. Docker persists those logs separately from the mounted `logs/` folder.

Therefore, set a per-container Docker logging cap:

```yaml
logging:
  driver: local
  options:
    max-size: "10m"
    max-file: "3"
```

This keeps Docker-managed stdout/stderr logs bounded to approximately 30 MiB per runtime container. Docker owns these files; Context Engine must not open, copy, rotate, or delete them directly.

The mounted LightRAG file logs and Docker stdout/stderr logs have distinct purposes:

| Log stream | Purpose | Primary access |
|---|---|---|
| Mounted `logs/` file logs | Retained domain diagnostics tied to the domain root | Controlled administrator diagnostics |
| Docker local-driver logs | Short, Docker-native troubleshooting stream | Host operator through `docker logs` |

## 5.4 Context Engine global logs

Keep only global structured JSONL logs:

```text
.data/logs/
  lifecycle.jsonl
  api.jsonl
  worker.jsonl
```

Retention:

| Log | Rule |
|---|---|
| `lifecycle.jsonl` | Rotate daily; retain 90 days. |
| `api.jsonl` | Rotate daily; retain 30 days. |
| `worker.jsonl` | Rotate daily; retain 30 days. |
| Existing generic operation/audit records | Retain 90 days by default; they contain safe metadata, not raw logs. |

Use the application’s existing logging configuration or its existing maintenance path. Do not add a separate log database, log agent, collector, or cleanup service.

## 5.5 Archive log retention

Archive is deferred and not part of ordinary deletion.

When an administrator explicitly chooses archive:

```text
.data/domains/<domain-id>/
  → .data/archive/<domain-id>-<timestamp>/
```

The archived domain retains its `logs/` directory for **30 days** by default. After that, delete the archive root unless an administrator has selected a longer documented retention policy.

Permanent deletion removes the `logs/` directory with the rest of the domain root.

---

## 6. Lifecycle Behavior

### Create

```text
1. Require administrator authorization.
2. Create the domain record in lifecycle = stopped.
3. Create:
   .data/domains/<id>/source/original/
   .data/domains/<id>/source/derived/
   .data/domains/<id>/workspace/
   .data/domains/<id>/logs/
4. Record the existing generic create operation/audit event.
```

No runtime container starts during create.

**Idempotent:** yes. Existing verified directories are reused; unexpected path conflicts fail safely.

### Start

```text
1. Require lifecycle = stopped.
2. Run pruneDomainLogs(domainId).
3. Ask the private deployment-control boundary to start the static LightRAG template
   with domain-specific values derived in memory.
4. Perform one bounded private health probe.
5. On success: lifecycle = running.
6. On failure: stop/down the partial runtime, return lifecycle = stopped,
   and record a safe failed operation.
```

**Idempotent:** yes. Starting an already healthy `running` runtime returns its current state. Partial failed start is cleaned before retry.

### Stop

```text
1. Stop/down the derived domain runtime.
2. Confirm health no longer succeeds.
3. Run pruneDomainLogs(domainId).
4. Set lifecycle = stopped.
5. Preserve source, workspace, and logs for restart.
```

**Idempotent:** yes. Stopping an already stopped runtime succeeds.

### Restart

Restart remains:

```text
Start after Stop.
```

Do not create a separate restart lifecycle action.

### Delete

```text
1. Set lifecycle = deleting and fence new queries, uploads, retries, and starts.
2. Let the Document Ingestion slice delete the bound LightRAG logical document/index data
   while the runtime is still available.
3. Stop/down the runtime.
4. Confirm the workspace and logs are no longer mounted by a running container.
5. Permanently remove `.data/domains/<id>/`, including `logs/`.
6. Remove domain/document metadata last.
7. Complete the existing generic delete operation/audit event.
```

**Idempotent:** yes. Each step verifies whether its target is already complete or absent.

### Archive

Archive is not a default lifecycle action. It is an explicit administrator-selected deletion disposition:

```text
.data/domains/<id>/
  → .data/archive/<id>-<timestamp>/
```

It is not a fifth domain state and must never be labelled permanent deletion.

### Partial failure recovery

| Failure | Safe state | Recovery |
|---|---|---|
| LightRAG index delete fails | `deleting` | Retry upstream cleanup; retain source, workspace, and logs. |
| Runtime stop fails | `deleting` | Do not move/remove domain root; retry stop. |
| Filesystem removal fails after stop | `deleting` | Retry filesystem removal only. |
| Database cleanup fails after root removal | `deleting` | Retry metadata finalization using existing operation/audit state. |
| Start probe fails | `stopped` | Record safe failure; retry Start. |

No recovery directory or custom lifecycle state machine is required.

---

## 7. Availability and Diagnostics

Keep public availability small:

```ts
type DomainAvailability =
  | "stopped"
  | "starting"
  | "available"
  | "unavailable"
  | "deleting";
```

`available` means:

- domain lifecycle is `running`; and
- an approved bounded private LightRAG health/readiness probe succeeded.

It does not claim a document is ready or a query will succeed. Document readiness remains owned by the Document Ingestion and query-eligibility slices.

### Probe policy

- Probe during Start.
- Probe on demand for a domain card/detail page when cached result is older than 10–30 seconds.
- Allow only one in-flight probe per domain.
- Do not run a permanent healthy-domain poller.
- The query path performs its own bounded upstream check; UI availability is not authorization.

### Primary admin diagnostics

Use existing generic operation/audit records:

```text
domainId
documentId, when applicable
action
status
safeErrorCode
correlationId
startedAt
completedAt
```

Raw LightRAG logs are supplemental and admin-only. The UI receives safe status and typed error categories, never raw stack traces, host paths, source text, provider bodies, or credentials.

---

## 8. Simplification Review

| Decision | Retain / remove | Risk prevented or debt removed |
|---|---|---|
| Unified domain root | Retain | One-root archive/delete/migration; avoids cross-root partial cleanup. |
| `source/`, `workspace/`, `logs/` | Retain | Clear ownership and narrow mounts without extra top-level root complexity. |
| Per-domain LightRAG logs | Retain | Supports diagnosis of indexing/provider/runtime issues after the fact. |
| LightRAG built-in log rotation | Retain | Hard per-domain log-size ceiling. |
| Docker log cap | Retain | Prevents stdout/stderr logs accumulating separately outside `.data/`. |
| Separate sibling LightRAG root | Remove | No additional meaningful isolation beyond exact workspace/log mounts. |
| Per-domain runtime files | Remove | Static template plus DB-derived values avoids stale generated state. |
| Runtime binding table | Remove | ID-derived service/workspace values prevent duplicate state. |
| Persistent temp/recovery directories | Remove | Source and generic operation state are sufficient recovery inputs. |
| Raw log viewer, log tailer, sidecar | Remove | Adds operational machinery without changing core status. |
| Domain-local raw LightRAG logs as core status source | Remove | Availability and operations remain reliable without reading logs. |
| Global Context Engine logs | Retain, bounded | Supports support/debugging without duplicating logs per domain. |
| Archive root | Defer | Only needed when explicit retention/recovery is a real product requirement. |
| On-demand probe cache | Retain | Gives useful UI availability without continuous polling. |
| Thin private Docker-control boundary | Retain | Keeps Docker socket out of public API/browser processes. |

### Honest tradeoffs

1. **One active runtime log may be older than 30 days.** It is intentionally left alone while the runtime is active to avoid external mutation of an open file. Rotation keeps it capped at 10 MiB.

2. **LightRAG file logging is a pinned-version compatibility requirement.** Validate its runtime logger during integration. If the pinned image does not honor the documented variables, add the smallest private configuration patch to direct its existing logger to `/var/log/lightrag`; do not add a log sidecar.

3. **Docker log files are not inside `.data/`.** Docker owns them. Their per-container logging cap prevents hidden unbounded growth; use `docker logs` only for operator-level troubleshooting.

4. **Archive is deferred.** Permanent delete is the initial product behavior. Archive requires explicit administrator intent and retention policy.

---

## 9. Migration Outline

### Step 1 — Inventory current storage

Verify the active v1 implementation for:

- source uploads, parser artifacts, and index units;
- LightRAG workspaces, named volumes, and bind mounts;
- generated Compose/env/runtime files;
- LightRAG and Docker stdout/stderr log behavior;
- domain deletion and archive paths;
- database domain/runtime records.

Do not assume any container directory is persistent without confirming its backing volume or host bind mount.

### Step 2 — Add unified-root support

For one pilot domain:

```text
.data/domains/<pilot-id>/
  source/original/
  source/derived/
  workspace/
  logs/
```

Add validated path helpers, static-template deployment logic, LightRAG file-log configuration, and Docker logging caps without changing its live runtime yet.

### Step 3 — Migrate while stopped

| Existing artifact | Target | Action |
|---|---|---|
| Original source | `source/original/` | Copy/move with checksum validation |
| Manifest/assets/index units | `source/derived/` | Copy if compatible; otherwise rebuild from source |
| LightRAG workspace/volume | `workspace/` | Copy/move only after runtime stop |
| Per-domain generated config | None | Regenerate at next Start; do not migrate secrets |
| Runtime logs | `logs/` | Copy only if meaningful; begin new rotation policy after cutover |
| Temporary files | None | Discard |
| Docker stdout/stderr logs | Docker-owned | Do not migrate; apply per-container cap to recreated runtime |

### Step 4 — Validate pilot

1. Start with the static deployment template and the new workspace/log mounts.
2. Confirm LightRAG writes a rotating log file beneath `logs/`.
3. Confirm LightRAG health and expected workspace persistence.
4. Confirm retrieval and source evidence mapping.
5. Confirm runtime can mount only `workspace/` and `logs/`.
6. Stop and restart; verify retrieval and logs persist.
7. Confirm file rotation and Docker stdout/stderr caps.
8. Test deletion against a non-production copy.
9. Keep prior storage read-only until success is recorded.

### Rollback point

Before old paths/volumes are removed:

```text
stop new runtime
→ restore old workspace mount and database configuration
→ verify retrieval baseline
→ retain new root for diagnosis
```

Do not let old and new layouts coexist indefinitely after pilot success.

---

## 10. Explicit Non-Goals

Do not add:

- Kubernetes, service mesh, object-storage migration, or distributed workflow infrastructure;
- a second retrieval engine, vector database, graph database, or semantic fallback;
- an event bus, monitoring service, logging agent, log sidecar, or log database;
- browser Docker access, browser LightRAG access, or raw runtime-log viewing;
- generated per-domain Compose files, runtime JSON files, or secret-bearing env files;
- persistent temporary/recovery directories;
- automatic repair, recreate, purge, or rebuild actions;
- generic filesystem browsing over `.data/`;
- archive-by-default behavior.

---

## Final Recommendation

Use this unified root:

```text
.data/
  domains/
    <domain-id>/
      source/
      workspace/
      logs/
```

This remains the leanest safe boundary.

`source/` is Context Engine-only. `workspace/` and `logs/` are the only directories mounted into that domain’s private LightRAG container. Runtime log rotation plus an age prune on safe lifecycle boundaries prevents log accumulation without a scheduled cleanup service, collector, or log platform.

The decisive security boundary is the exact bind mount—not a separate sibling top-level directory.
