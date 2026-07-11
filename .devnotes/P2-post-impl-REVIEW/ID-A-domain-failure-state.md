# ID-A — Domain failure state (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md).

**Question:** When start/stop/delete fails, where does error info live?

---

### Decision

**No extra `state` on `domains`.** No `error`, `failed`, `unhealthy` column on domain row.

Failure → **`domain_operations.error_code`** + **`domain_operations.error_message`**.

---

### Why

| Bad (old / rejected) | Good (greenfield) |
|----------------------|-------------------|
| `domains.health_status` persisted | Computed at read — see [ID-A-health-availability.md](./ID-A-health-availability.md) |
| `domains.error_message` | Op row owns terminal failure |
| Domain `state = error` | Domain `state` stays closed enum: `stopped` \| `running` \| `deleting` only |

Domain row = **lifecycle position**. Op row = **what happened on last action**.

---

### Where errors show up

```text
POST /admin/domains/{id}/start fails
        │
        ▼
domain_operations row:
  operation_type = start
  status         = failed
  error_code     = domain_runtime_unavailable   (safe machine code)
  error_message  = "Runtime did not become ready."  (safe human text)
        │
        ▼
domains row:
  state unchanged (e.g. still stopped)
  NO error columns written
```

Admin sees failure via:

- `GET /admin/domains/{id}/operations` — history with `errorCode` / `errorMessage`
- `GET /admin/domains/{id}/status` — `activeOperation` while op queued/running; terminal fail in ops list
- HTTP error on sync create/start/stop — `ApiError` envelope (same safe codes)

---

### Rules for juniors

- Never add `error_message` or `health_status` to `domains` migration.
- On op terminal failure: set `status = failed`, fill `error_code` + `error_message`, set `finished_at`.
- Safe messages only — no stack traces, paths, URLs, provider payloads (AGENTS.md rule 7).
- Domain `state` transitions only on success path (e.g. start succeeds → `running`; start fails → stay `stopped`).

---

### One-line summary

**Domain row has no failure fields — failed ops write `error_code` / `error_message` on `domain_operations`; domain `state` stays `stopped` / `running` / `deleting` only.**
