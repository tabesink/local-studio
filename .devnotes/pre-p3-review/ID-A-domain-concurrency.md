# ID-A — Domain op concurrency (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md). Table shape: [ID-A-domain-operations-table.md](./ID-A-domain-operations-table.md).

**Question:** Two starts at once? Delete while start running? What counts as a “domain op”?

---

### Scope (what this is / is not)

**Domain ops** = lifecycle only: `create`, `start`, `stop`, `delete` on `domain_operations`.

**Not** document upload, prep, or pipeline work — those are F-004 `source_preparation_operations` (separate table, separate concurrency rules).

---

### Decision

**Partial unique index:** max **1 active op per domain**. Extra lifecycle requests **fail fast** — no FIFO queue of waiting ops.

**Active** = `status IN ('queued', 'running')`.

Delete async → **lease columns on delete op row only** (`lease_owner`, `lease_expires_at`).

---

### Partial unique index

```sql
CREATE UNIQUE INDEX uq_domain_operations_one_active
  ON domain_operations (domain_id)
  WHERE status IN ('queued', 'running');
```

```text
domain fatigue
  op A: start, running     ✓
  op B: stop, queued       ✗ INSERT → unique violation → 409 domain_operation_in_progress
```

Second active op **cannot exist** — DB enforces, not only app check. Still guard in service for friendly error.

---

### What active op blocks

- New start / stop / delete on same domain
- `domain_available()` → false while active op exists
- See [ID-A-health-availability.md](./ID-A-health-availability.md)

HTTP: `409` + `domain_operation_in_progress`.

**Not queued:** if op A is `queued` or `running`, a second start/stop/delete on that domain is rejected immediately — ops 2/3/4 do **not** wait in line.

---

### Admin UI — toast on blocked second op

When admin triggers start / stop / delete and API returns `409` + `domain_operation_in_progress`:

- Show a **toast** (warning/destructive) — never fail silently or only disable the button with no explanation.
- Copy: use the API safe `error.message` when present; otherwise a fixed string such as *“Another operation is already in progress for this domain. Wait for it to finish, then try again.”*
- Prefer including the **active op type** when the client already has it (e.g. from `GET /admin/domains/{id}/status` → `activeOperation.operationType`: “Start already in progress”, “Delete already in progress”).
- Do **not** imply a queue (“Your request was queued…”) — there is no queue.
- Optional UX hardening (same slice): disable lifecycle actions while `activeOperation` is non-null; toast still required when a race or stale UI hits the API.

P3 backend contract only; UI ships in a later domain-admin slice — but **409 handling + toast copy is a fixed product rule**, not optional polish.

---

### Lease columns (delete only)

| Column | Purpose |
|--------|---------|
| `lease_owner` | Worker id claiming delete |
| `lease_expires_at` | Claim expiry — another worker may reclaim if expired |

Sync ops (create/start/stop) → **no lease**. YAGNI.

```text
DELETE accepted (202)
  insert domain_operations: type=delete, status=queued
  domains.state → deleting
        │
        ▼
worker claims: status=running, lease_owner=..., lease_expires_at=...
        │
        ▼
worker finishes: status=succeeded, domain row hard-deleted (cascade ops)
```

---

### control_generation tie-in

Each op stores `control_generation_at_start` = snapshot when op created.

Worker commit:

```text
UPDATE domains
  SET ...
  WHERE id = ?
    AND control_generation = ?
    AND runtime_instance_id = ?
```

Mismatch → 0 rows → stale worker no-op. Full lifecycle: [ID-A-id-reuse-after-delete.md](./ID-A-id-reuse-after-delete.md).

---

### Tests

- Insert two queued ops same domain → second fails unique index
- Active op present → start returns 409
- Delete op with expired lease → reclaim path (when worker impl exists)
- UI (when domain admin slice exists): second lifecycle action → toast with `domain_operation_in_progress`; no queue messaging

---

### One-line summary

**One queued/running lifecycle op per domain (fail-fast 409, admin toast explains why); delete ops alone use lease columns; document/pipeline ops are a different system.**
