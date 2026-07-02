---
type: id-a
phase: P5
feature: F-005
status: active
layer:
  - data
  - api
spec: specs/04-features/F-005-lightrag-indexing-eligibility/spec.md
contract: DATA-001
audience: junior-dev
lifecycle: review
tags:
  - phase/p5
  - feature/f-005
  - type/id-a
  - review/id-a
  - layer/data
  - layer/api
  - contract/data
  - status/active
---

# ID-A — Source Index Fields And API Patch

Parent: [[ID-A LightRAG Indexing Contract]]

**Question:** What contract shape is missing before P5 can add index state?

### Decision

Patch DATA-001 and API-001 before implementation. DATA-001 currently names `source_documents.index_*` and the source index state enum, but it does not define field-level columns, constraints, defaults, lease fields, or DTO exposure rules. API-001 lists P5 retry/cancel routes, but it does not define their request/response/error shapes.

This is a contract gap, not an implementation detail.

### Why

| Bad | Good |
| --- | --- |
| add columns in code and document later | patch DATA-001 first |
| create `source_index_operations` because responses need an operation | keep index truth on `source_documents` unless spec changes |
| expose remote ids in admin DTO | expose safe state only |
| persist rendered LightRAG input | store hash only |

### Recommended DATA-001 Patch

Pending approval, `source_documents` should gain:

| Field | Rule |
| --- | --- |
| `index_state` | enum from DATA-001 source index state machine |
| `index_generation` | nonnegative stale-work fence |
| `index_request_id` | stable idempotency key for current generation |
| `index_content_hash` | hash of rendered input |
| `index_remote_document_id` | private if required by fixture; not in DTO |
| `index_error_code`, `index_error_message` | safe terminal failure only |
| `index_lease_owner`, `index_lease_expires_at` | worker claim fields if approved |
| `index_accepted_at`, `index_ready_at`, `index_updated_at` | lifecycle timestamps |

Explicitly omit rendered input text, raw LightRAG payloads, provider payloads, storage paths, runtime URLs, generic JSON metadata, and an index history table.

### Recommended API-001 Patch

Define:

| Surface | Decision needed |
| --- | --- |
| `SourceAdminSummary` | safe index state fields and whether safe error code appears |
| `POST .../index/retry` | status code, response body, conflict codes |
| `POST .../index/cancel` | status code, response body, conflict codes |
| source delete after P5 | remote delete semantics and response status |

Prefer response bodies that return safe source state. Do not invent an operation DTO unless DATA-001 approves a durable owner.

### Implement Order

```text
1. Patch DATA-001 with exact fields.
2. Patch API-001 with DTOs and errors.
3. Add Alembic migration.
4. Add SQLAlchemy model fields/constants.
5. Update safe source DTO.
6. Update OpenAPI snapshot.
```

### Red Flags In PR

- New `index_*` code appears without contract patches.
- Index state is stored in a new mirror/history table.
- DTO includes remote runtime identity or rendered content.
- Error message uses upstream/raw text.
- Index retry/cancel returns P4 preparation operation fields.

### Tests

- Fresh migration creates approved fields and constraints.
- OpenAPI snapshot includes retry/cancel and safe source summary changes.
- Safe DTO scan rejects private index fields and forbidden strings.
- Defaults put existing prepared sources into an approved non-ready state.

### One-line Summary

P5 needs field-level API/DATA shape before code; index truth lives on Source Documents, not a new job/history system.

---

## Related

- [[ID-A LightRAG Indexing Contract]]
- [[Source Documents Table]]
- [[P4 Review Index]]

## Repo sources

- `.devnotes/P4-post-impl-REVIEW/ID-A-source-index-fields.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/api/context-engine-v1.md`
