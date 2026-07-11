# ID-A — Member `GET /domains` (junior dev explainer)

Part of **ID-A** working set. Parent: [ID-A.md](./ID-A.md). Availability rule: [ID-A-health-availability.md](./ID-A-health-availability.md).

**Question:** Member list shows stopped domains with `available: false`?

---

### Decision

**No.** Server filters — return **only** rows passing availability rule.

Do **not** return stopped / deleting / unhealthy / active-op domains with `available: false`. **Omit row entirely.**

---

### Routes compared

| Role | Route | Returns |
|------|-------|---------|
| Member | `GET /domains` | available domains only |
| Admin | `GET /admin/domains` | all domains + computed `available` |

PROD-004: admin has member actions too — admin on `GET /domains` gets **same filter** as member. Full lifecycle → admin routes.

---

### Member response shape

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

- Every returned row has `available: true` (implicit — could omit field; contract keeps it explicit)
- No `state`, no `embeddingProfileId` on member DTO — smaller surface
- Stopped domain → **not in array** — not `{ "available": false }`

---

### Filter implementation

```text
GET /domains
        │
        ▼
Load candidate domains (or query with state=running prefilter)
        │
        ▼
For each: domain_available(domain) ?
        │
   yes ─┴─► include in response
   no  ───► skip (do not serialize)
```

Reuse same `domain_available()` as admin DTO — one fn, no divergent rules.

Availability = running + no active op + healthy controller — see [ID-A-health-availability.md](./ID-A-health-availability.md).

---

### Old server wrong

Old member/registry paths could surface domains user cannot use (stopped/unhealthy) sometimes with flags. Greenfield: **if not available, member never sees it**.

---

### Red flags in PR

- Member list includes `state: stopped`
- Member list has entries with `available: false`
- Frontend filters availability — must be server-side
- Member DTO leaks admin fields (`embeddingProfileId`, internal ids)

---

### Tests

- Stopped domain → member list count 0 for that id
- Running + healthy + no active op → appears
- Running + active delete op → omitted
- Admin list same fixture still includes stopped row with `available: false`

---

### One-line summary

**Member `GET /domains` returns only domains where `domain_available()` is true — unavailable rows excluded, not flagged false.**
