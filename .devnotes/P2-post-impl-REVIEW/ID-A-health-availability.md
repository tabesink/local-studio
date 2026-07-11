# ID-A — Health / availability (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md). Failures on ops: [ID-A-domain-failure-state.md](./ID-A-domain-failure-state.md).

**Question:** Is `available` a DB column? Where does health live?

---

### Decision

**NOT columns on `domains`.** No `health_status`, no `available`, no persisted health enum.

Service **computes at read time**. One fn — do not duplicate logic.

---

### Formula (single source)

```text
domain_available(domain) =
  domain.state == "running"
  AND NOT exists active domain_operation (status IN queued|running)
  AND controller_health(domain.runtime_instance_id) == healthy
```

```text
domains                          service layer
┌──────────────────┐            ┌─────────────────────────┐
│ state            │───────────►│ domain_available()      │
│ runtime_instance │  (private) │ + active op query       │
│ (no health col)  │            │ + controller health TTL │
└──────────────────┘            └───────────┬─────────────┘
                                            │
                                            ▼
                              DTO field: available: true|false
```

Health probe itself → ID-B (controller contract, cache TTL). P3 only defines **computed** `available` on DTOs.

---

### Who sees what

| Route | `available` in response? | Rule |
|-------|--------------------------|------|
| `GET /admin/domains` | yes, per row | all domains listed; `available` computed |
| `GET /admin/domains/{id}` | yes | same |
| `GET /admin/domains/{id}/status` | yes | lean poll slice |
| `GET /domains` (member) | only `true` rows returned | see [ID-A-member-domains-list.md](./ID-A-member-domains-list.md) |

Admin may see `state: stopped` + `available: false`. Member route **omits** row entirely — not `available: false`.

---

### Why not persist

- Health stale seconds after write → lying column
- Same truth for API + worker → one fn import
- DATA-001 / P3 explicit omit: `health_status`, `available` on table

Old server persisted manifest health enum — **do not port**.

---

### Implement order

1. `domain_available(domain, session)` in one service module
2. DTO mappers call it — never hardcode `available: true`
3. Grep tests: no `health_status` column; admin DTO has computed `available`
4. Wire controller health when ID-B lands; until then stub returns unhealthy → `available: false` for running domains OK in tests

---

### Red flags in PR

- Migration adds `available` or `health_status` on `domains`
- Frontend computes availability from `state` alone
- Copy-paste availability check in route + worker

---

### One-line summary

**`available` is computed at read from `state` + no active op + fresh controller health — never stored on `domains`.**
