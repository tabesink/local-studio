# ID-A — `domain_operations` table shape (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md). Concurrency: [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md).

**Question:** Generic `jobs` table or something else?

---

### Decision

**Dedicated `domain_operations`.** Mirror P4 prep-ops spirit — typed **lifecycle** ops for domains, not DEC-005 generic jobs.

**Not in this table:** document upload / prep / pipeline (F-004 `source_preparation_operations`). Concurrency + admin toast for blocked second op: [ID-A-domain-concurrency.md](./ID-A-domain-concurrency.md).

---

### Enums (CHECK constraints)

**`operation_type`:** `create` | `start` | `stop` | `delete`

**`status`:** `queued` | `running` | `succeeded` | `failed` | `cancelled`

Closed enums in migration + SQLAlchemy — no free-text kind strings.

---

### Table sketch

```text
domains ──────< domain_operations
                - id (UUID PK)
                - domain_id FK → domains.id ON DELETE CASCADE
                - operation_type
                - status
                - control_generation_at_start
                - requested_by_user_id (nullable)
                - message, error_code, error_message
                - lease_owner, lease_expires_at  (delete only — see concurrency doc)
                - started_at, finished_at, created_at, updated_at
```

| Column | Notes |
|--------|--------|
| `control_generation_at_start` | Copy of `domains.control_generation` when op inserted — stale worker fence |
| `message` | Safe operator text; not stack trace |
| `error_code` / `error_message` | Terminal failure only — [ID-A-domain-failure-state.md](./ID-A-domain-failure-state.md) |
| `lease_*` | Delete async worker claim only |

Index: `(domain_id, created_at DESC)` for ops list.

---

### P3 sync vs async

| Op | Who runs | HTTP | Op row |
|----|----------|------|--------|
| create | API sync | 201 | written same request |
| start | API sync | 200 | written same request |
| stop | API sync | 200 | written same request |
| delete | worker async | 202 | queued → running → terminal |

Create/start/stop still get op rows — **audit + history**, not background jobs table.

Delete stays `running` until worker finishes; lease columns used there only (YAGNI for sync ops).

---

### vs old server

| Old | Greenfield |
|-----|------------|
| Generic `jobs` with `resource_type=domain` | `domain_operations` FK to `domains` |
| `domain_create`, `domain_start`, … string kinds | CHECK enum `create`/`start`/… |
| Metadata JSON blob | Typed columns |

**Do not** reuse `jobs` repository for domain lifecycle.

---

### API surface

`GET /admin/domains/{domain_id}/operations` → safe DTO:

```json
{
  "operations": [{
    "id": "op-uuid",
    "operationType": "start",
    "status": "succeeded",
    "message": "Domain started.",
    "errorCode": null,
    "errorMessage": null,
    "startedAt": "...",
    "finishedAt": "...",
    "createdAt": "..."
  }]
}
```

Omit from public DTO unless P9 needs: `controlGenerationAtStart`, `leaseOwner`, `requestedByUserId`.

---

### One-line summary

**Typed `domain_operations` table — four op types, five statuses, audit row for every lifecycle action; delete alone is async with lease columns.**
