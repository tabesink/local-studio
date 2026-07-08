# ID-A - Contract spine (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-011-P11-readiness.md](./F-011-P11-readiness.md)

**Question:** What must exist before a junior dev implements P11 Wiki/Smart Composer code?

### Decision

Write the F-011 feature package and patch public contracts first. Do not code from the roadmap sentence or the empty folder.

Required owner docs:

```text
F-011 feature package
API-001
DATA-001
AI-001, only if generated/rewrite behavior exists
EVT-001, only if streaming exists
QA-002/QA-003 safety rules if new public or diagnostic surfaces appear
```

### Why

| Bad path | Good path |
| --- | --- |
| Guess routes from UI needs. | Contract routes before frontend wrappers. |
| Store wiki state in generic JSON. | Use typed tables and closed enums. |
| Treat draft text as browser-local product truth. | Persist Wiki Contributions through backend services. |
| Publish by updating current page content. | Create immutable Wiki Revisions. |
| Let AI prompt behavior live in components. | Backend owns prompts, model/profile choice, and safe failure behavior. |

### Exact Contract Sketch

Candidate API-001 areas to capture. Names are review targets, not approved implementation names yet:

```text
GET    /wiki/pages
GET    /wiki/pages/{page_id}
GET    /wiki/pages/{page_id}/revisions
GET    /wiki/contributions
POST   /wiki/contributions
GET    /wiki/contributions/{contribution_id}
PATCH  /wiki/contributions/{contribution_id}
POST   /wiki/contributions/{contribution_id}:submit
POST   /admin/wiki/contributions/{contribution_id}:publish
POST   /admin/wiki/contributions/{contribution_id}:reject
```

Candidate DATA-001 tables to decide:

```text
wiki_pages
  id
  slug or stable key
  title
  current_revision_id
  state
  created_at
  updated_at

wiki_revisions
  id
  wiki_page_id
  revision_number
  title
  body
  published_from_contribution_id
  published_by_user_id
  published_at

wiki_contributions
  id
  target_wiki_page_id nullable
  title
  body
  state
  created_by_user_id
  reviewed_by_user_id nullable
  created_at
  updated_at
  submitted_at nullable
  reviewed_at nullable
```

Decide separately whether evidence traceability is embedded as approved safe ids or stored in a typed join table. Do not store private Source Block ids in public DTOs.

### Implement Order

1. Create F-011 `spec.md` with user outcome, roles, flows, out-of-scope list, and acceptance criteria.
2. Create F-011 `plan.md`, `tasks.md`, `test-plan.md`, `acceptance.md`, and `ux.md`.
3. Patch API-001 with routes, DTOs, errors, roles, and safety rules.
4. Patch DATA-001 with tables, constraints, state enums, and redaction/delete behavior.
5. Patch AI-001 only if composer text is generated or rewritten.
6. Patch EVT-001 only if composer/publish actions stream progress.
7. Add migration and backend tests before UI.
8. Add frontend wrappers and components after DTOs are captured.

### Red Flags In PR

- A P11 endpoint is implemented before API-001 names it.
- A P11 table or enum is implemented before DATA-001 names it.
- `metadata` or `payload` JSON becomes the main state machine.
- `body` fields store raw source text copied from Evidence instead of curated wiki content.
- Publish mutates old revision rows.
- Tests assert only happy path and skip invalid transitions.

### Tests

- API contract snapshot includes every P11 route and safe DTO.
- Fresh migration creates tables, constraints, and indexes.
- State-machine tests reject invalid transitions.
- Publish test proves old revisions are unchanged.
- Authz tests cover Member/Admin differences.
- Safety test scans P11 DTO examples for forbidden private data.

### One-line summary

P11 starts by writing contracts; code comes after routes, tables, roles, and safety rules are explicit.
