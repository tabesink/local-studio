# ID-A — Contract + data (P3 blockers)

Working doc for F-003 T-010/T-020 gate. Canonical target: patch `specs/03-contracts/data/context-engine-data.md` + `specs/03-contracts/api/context-engine-v1.md` before code.

Sources grilled: `F-003-P3-review.md`, `.references/code/server`, greenfield specs, `context_engine/models.py`, fencing-token pattern (Postgres conditional update — industry standard for stale worker rejection).

**Related docs (same ID-A set)**

| Doc | Scope |
|-----|--------|
| [ID-A-embedding-profile-storage.md](./ID-A-embedding-profile-storage.md) | FK + immutability explainer for `domains.embedding_profile_id` |
| [ID-A-model-catalog-and-defaults.md](./ID-A-model-catalog-and-defaults.md) | Seeded OpenAI defaults, full model catalog, admin Settings selection, LightRAG KG LLM wiring |
| [ID-A-domain-failure-state.md](./ID-A-domain-failure-state.md) | Failures on `domain_operations`, not extra domain state |
| [ID-A-health-availability.md](./ID-A-health-availability.md) | Computed `available` — no health columns on `domains` |
| [ID-A-domain-operations-table.md](./ID-A-domain-operations-table.md) | `domain_operations` shape, enums, sync vs async |
| [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md) | Partial unique index, delete lease columns, fail-fast 409 + admin toast |
| [ID-A-id-reuse-after-delete.md](./ID-A-id-reuse-after-delete.md) | Hard delete, slug reuse, fencing tokens |
| [ID-A-member-domains-list.md](./ID-A-member-domains-list.md) | Member `GET /domains` — available rows only |

---

## Lean winner (recommend adopt)

```text
2 typed tables (no JSON meta)
+ closed enums + CHECK constraints
+ one partial unique index (one active op per domain)
+ control_generation fence on domains row
+ computed availability (never persisted column)
+ strict camelCase DTOs (match P2)
+ member list = available rows only
```

**Why leanest / low entropy**

| Rejected | Why |
|----------|-----|
| Generic `jobs` table | DEC-005, P0 — wrong owner |
| `lightrag_domains` + manifest JSON | Extra truth source; forbidden manifest table |
| `meta` JSON on `domains` | DATA-001 bans generic JSON settings; drift magnet |
| Persist `health_status` / `available` | P3 — computed only |
| Host port / runtime URL columns | FR-003 / AC-006 |
| Separate fence counter table | Overkill for single-worker pilot; `domains.control_generation` enough |
| UUID public domain id | Product uses slug (`fatigue`) in URLs |

Old server useful for: id regex, embedding validation flow, naming suffix idea — **not** table shape.

---

## Grill tree — decisions resolved

```text
Public domain identity?
  -> slug `id` (admin-chosen at create), not UUID
  -> regex ^[a-z0-9][a-z0-9_-]{1,62}$  (from old server)

Embedding profile storage?
  -> FK column `embedding_profile_id` NOT NULL on `domains`
  -> validate via TrustedRuntimeResolver at create
  -> lock immutability: FK presence blocks profile PATCH/DELETE (already in API-001 P2)
  -> admin picks embedding from seeded catalog at domain create (default OpenAI) — see ID-A-model-catalog-and-defaults.md

Domain failure state?
  -> NO extra domain state
  -> failure lives on `domain_operations.error_code` / `error_message`

Health / availability?
  -> NOT columns on `domains`
  -> service computes at read time

Operations table shape?
  -> dedicated `domain_operations` (mirror P4 prep ops spirit, not generic jobs)
  -> types: create | start | stop | delete
  -> status: queued | running | succeeded | failed | cancelled

Concurrency?
  -> partial unique index: max 1 active (queued|running) op per domain
  -> second lifecycle request: 409 domain_operation_in_progress (fail fast, no queue)
  -> admin UI: toast explaining why second op blocked (see ID-A-domain-concurrency.md)
  -> delete async: lease columns on delete op row only
  -> scope: domain lifecycle only — not F-004 source prep/pipeline ops

ID reuse after delete?
  -> row hard-deleted -> same slug allowed
  -> new row: new `runtime_instance_id`, `control_generation = 1`
  -> stale worker: mismatch on `runtime_instance_id` OR `control_generation` -> no-op / reject

Member GET /domains?
  -> filter server-side: only rows passing availability rule
  -> do NOT return stopped domains with `available: false` (old server wrong)
```

---

## A1 — `domains` table (recommended DATA-001 patch)

| Column | Type | Rule |
|--------|------|------|
| `id` | `String(64)` PK | Admin slug; regex `^[a-z0-9][a-z0-9_-]{1,62}$`; CHECK in migration |
| `display_name` | `String(120)` NOT NULL | Safe label; default to `id` if omitted in API |
| `state` | `String(16)` NOT NULL | CHECK `stopped`, `running`, `deleting` only |
| `embedding_profile_id` | `String(36)` NOT NULL | FK → `model_profiles.id`; must reference `profile_kind = embedding` |
| `runtime_instance_id` | `String(36)` NOT NULL | Server UUID; **never** in API/logs/DTOs |
| `control_generation` | `Integer` NOT NULL DEFAULT 1 | Fence; see lifecycle below |
| `created_at` | `DateTime` NOT NULL | Service timestamp (match P1/P2: timezone=False) |
| `updated_at` | `DateTime` NOT NULL | Service timestamp |

**Indexes**

- PK on `id`
- FK index on `embedding_profile_id`

**Explicitly omit**

- `health_status`, `error_message`, `available`, `meta` JSON, paths, ports, URLs, container ids

### `control_generation` lifecycle

```text
CREATE domain
  runtime_instance_id = new uuid
  control_generation = 1

DELETE accepted (state -> deleting)
  control_generation += 1        # invalidates in-flight ops/worker on old gen
  insert delete op with control_generation_at_start = new value

Worker/controller commit
  UPDATE ... WHERE id = ? AND control_generation = ? AND runtime_instance_id = ?

DELETE complete
  remove domain row (+ cascade ops)

CREATE same slug again
  fresh row, new runtime_instance_id, control_generation = 1
```

Pattern matches fencing-token guidance: resource row owns monotonic int; stale writer gets 0 rows updated.

---

## A2 — `domain_operations` table (recommended DATA-001 patch)

| Column | Type | Rule |
|--------|------|------|
| `id` | `String(36)` PK | UUID |
| `domain_id` | `String(64)` NOT NULL | FK → `domains.id` ON DELETE CASCADE |
| `operation_type` | `String(16)` NOT NULL | CHECK `create`, `start`, `stop`, `delete` |
| `status` | `String(16)` NOT NULL | CHECK `queued`, `running`, `succeeded`, `failed`, `cancelled` |
| `control_generation_at_start` | `Integer` NOT NULL | Copy of `domains.control_generation` when op created |
| `requested_by_user_id` | `String(36)` NULL | FK → `users.id`; NULL = worker/system |
| `message` | `String(500)` NULL | Safe operator message; no stack traces |
| `error_code` | `String(64)` NULL | Safe machine code on terminal failure |
| `error_message` | `String(500)` NULL | Safe human message on terminal failure |
| `lease_owner` | `String(64)` NULL | Worker id for delete ops only |
| `lease_expires_at` | `DateTime` NULL | Delete worker claim expiry |
| `started_at` | `DateTime` NULL | When status → running |
| `finished_at` | `DateTime` NULL | Terminal timestamp |
| `created_at` | `DateTime` NOT NULL | |
| `updated_at` | `DateTime` NOT NULL | |

**Indexes**

- `(domain_id, created_at DESC)` list ops
- **Partial unique** `uq_domain_operations_one_active ON (domain_id) WHERE status IN ('queued','running')`

**Active operation** = row with `status IN ('queued','running')`. Blocks start/stop/delete + availability.

**P3 sync vs async**

| Op | Who runs | HTTP |
|----|----------|------|
| create | API sync | 201 |
| start | API sync | 200 |
| stop | API sync | 200 |
| delete | API enqueue + worker | 202 |

Create/start/stop: op row still written for audit/history — transitions in same request.

Delete: op stays `running` until worker finishes; lease columns used here only (YAGNI for sync ops).

---

## A3 — `POST /admin/domains` (recommended API-001 patch)

Strict body (`extra=forbid`), camelCase like P2.

**Request**

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "embeddingProfileId": "550e8400-e29b-41d4-a716-446655440000"
}
```

| Field | Required | Rule |
|-------|----------|------|
| `id` | yes | slug regex |
| `displayName` | no | 1–120 chars; default `id` |
| `embeddingProfileId` | yes | must exist, embedding kind, provider ready; from seeded catalog; preselect OpenAI default — see [ID-A-model-catalog-and-defaults.md](./ID-A-model-catalog-and-defaults.md) |

**Response `201`**

```json
{
  "domain": {
    "id": "fatigue",
    "displayName": "Fatigue Analysis",
    "state": "stopped",
    "embeddingProfileId": "550e8400-e29b-41d4-a716-446655440000",
    "available": false,
    "createdAt": "2026-06-30T12:00:00Z",
    "updatedAt": "2026-06-30T12:00:00Z"
  }
}
```

No `runtimeInstanceId`, paths, ports, provider secrets.

---

## A4 — Admin list / detail / operations DTOs

### Shared `DomainAdminSummary`

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "state": "stopped",
  "embeddingProfileId": "550e8400-e29b-41d4-a716-446655440000",
  "available": false,
  "createdAt": "2026-06-30T12:00:00Z",
  "updatedAt": "2026-06-30T12:00:00Z"
}
```

`available` computed (admin sees false for stopped/unhealthy/active-op/deleting).

### `GET /admin/domains`

```json
{ "domains": [ /* DomainAdminSummary[] */ ] }
```

### `GET /admin/domains/{domain_id}`

```json
{ "domain": { /* DomainAdminSummary */ } }
```

Detail = summary in P3 (no extra private fields). Avoid old-server admin payload bloat.

### `GET /admin/domains/{domain_id}/operations`

```json
{
  "operations": [
    {
      "id": "op-uuid",
      "operationType": "start",
      "status": "succeeded",
      "message": "Domain started.",
      "errorCode": null,
      "errorMessage": null,
      "startedAt": "2026-06-30T12:01:00Z",
      "finishedAt": "2026-06-30T12:01:05Z",
      "createdAt": "2026-06-30T12:01:00Z"
    }
  ]
}
```

Omit `controlGenerationAtStart`, `leaseOwner`, `requestedByUserId` from API unless P9 needs — keeps DTO safe + small.

---

## A5 — Error codes (recommended)

Use existing `ApiError` envelope. Safe messages only.

| Situation | HTTP | `code` |
|-----------|------|--------|
| Bad slug / validation | 422 | `validation_error` + `fields` |
| Duplicate slug | 409 | `domain_id_conflict` |
| Unknown domain | 404 | `domain_not_found` |
| Bad/missing embedding profile | 400 | `embedding_profile_invalid` |
| Profile not found | 404 | `embedding_profile_not_found` |
| Wrong state (start while deleting, etc.) | 409 | `domain_state_conflict` |
| Active op in progress | 409 | `domain_operation_in_progress` — safe `message` for admin toast; no queue; see [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md) |
| Delete accepted | 202 | n/a (success body) |
| Controller/worker failure | 502 | `domain_runtime_unavailable` |
| Member on admin route | 403 | `forbidden` |
| Unauthenticated | 401 | `unauthenticated` |

Drop old-server `lightrag_domain_port_conflict` — no host ports in greenfield.

---

## A6 — `GET /admin/domains/{domain_id}/status`

Lean status slice for future UI polling — **not** full detail.

```json
{
  "domain": {
    "id": "fatigue",
    "displayName": "Fatigue Analysis",
    "state": "running",
    "available": true
  },
  "activeOperation": {
    "id": "op-uuid",
    "operationType": "delete",
    "status": "running",
    "message": "Removing runtime resources."
  }
}
```

`activeOperation`: object or `null`. No health enum persisted — `available` already folds running + no active op + fresh health (health check itself lives in service/controller; see ID-B).

Admin UI uses `activeOperation` for lifecycle button disable + toast copy when a second op hits 409 — see [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md).

---

## A7 — `GET /domains` (member + admin)

Per P3 reference + PROD-004:

| Role | Route | Returns |
|------|-------|---------|
| Member | `GET /domains` | **Only** available domains |
| Admin | `GET /admin/domains` | All domains + computed `available` |

**Member response**

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

Member list omits stopped/deleting/unavailable rows entirely — not `available: false` rows.

Admin may use member route too (PROD-004: admin has member actions) — same filter on `GET /domains`; full lifecycle on admin routes.

---

## Availability computation (single fn — do not duplicate)

```text
domain_available(domain) =
  domain.state == "running"
  AND NOT exists active domain_operation
  AND controller_health(domain.runtime_instance_id) == healthy
```

One server function. API + worker import it. Never copy into frontend.

---

## Entity diagram

```text
model_profiles (seeded catalog — see ID-A-model-catalog-and-defaults.md)
      ^
      | embedding_profile_id (immutable after create; admin selects at create)
      |
   domains ──────< domain_operations
   - id (slug)
   - state
   - runtime_instance_id  (private)
   - control_generation   (private in DTO)

runtime_settings.active_synthesis_profile_id
      └──► LightRAG LLM_MODEL (KG index) + P7 chat synthesis (v1 same profile)
```

---

## Junior dev — do this order

```text
1. Read this file + ID-A-embedding-profile-storage.md + ID-A-model-catalog-and-defaults.md + F-003-P3-review.md A-section
2. Patch DATA-001 P3 field tables (copy A1/A2)
3. Patch API-001 P3 DTO section (copy A3–A7)
4. Patch F-002 / ADR for model catalog seed + admin selection (copy from ID-A-model-catalog-and-defaults.md)
5. Migration T-010: match DATA-001 exactly — no extra columns
6. Models: mirror P2 style (CheckConstraint, no JSON)
7. Repository: domain_available() + active-op guard in one service module
8. DTO mappers: explicit allowlist fields — grep test forbidden keys
9. Do NOT port: jobs table, manifest, domain.env, host_port
```

**Red flags in PR**

- `meta` JSON column on `domains`
- `health_status` persisted
- `host_port` / `base_url` in any response
- Member route returns stopped domains
- Generic `jobs` reuse
- Second source of truth file on disk for domain state

**Tests to write with T-010/T-020**

- slug regex + duplicate id
- partial unique index rejects second active op
- control_generation mismatch update returns 0 rows
- admin DTO snapshot: no `runtimeInstanceId`, `path`, `url`, `port`
- member list excludes stopped domain

---

## Still needs ID-B / fixture (not A)

| Item | Owner doc |
|------|-----------|
| Controller health probe TTL | ID-B |
| Fresh health cache TTL | ID-B |
| Runtime PG naming formula | ID-E (private, not DB column) |

A contract complete when DATA-001 + API-001 patched and reviewed — then T-010 unblocked.

---

## Next grill session

ID-B controller internal contract — or sign off A patches into `specs/03-contracts/` first.
