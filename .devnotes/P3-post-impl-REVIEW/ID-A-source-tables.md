# ID-A - Source tables (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** What data shape must exist before P4 Source Document code starts?

### Decision

Block implementation until DATA-001 defines detailed P4 tables. The current contract names the tables and state machines, but it does not define columns, constraints, indexes, operation fencing, duplicate hash scope, or delete semantics.

Use four typed tables:

| Table | Owns |
| --- | --- |
| `source_documents` | uploaded file identity, domain ownership, state, frozen parser kind, hash, generation fence |
| `source_preparation_operations` | queued/running/succeeded/failed/cancelled prep history and leases |
| `source_blocks` | stable citable canonical units |
| `source_images` | private image metadata tied to figure/table blocks |

### Why

| Bad | Good |
| --- | --- |
| copy old `documents` + JSON metadata | typed Source Document contract |
| store parser-native tree/chunks | publish Source Blocks only |
| generic `jobs` table | source-owned preparation operations |
| failed source state | pending source + failed operation |
| path or parser URL columns | private storage and parser details stay private |

### Exact Contract Sketch

`source_documents`:

| Field | Rule |
| --- | --- |
| `id` | opaque primary key |
| `domain_id` | FK to `domains.id` |
| `original_filename` | safe display label |
| `content_type` | safe declared type |
| `original_sha256` | immutable file hash |
| `original_size_bytes` | upload size |
| `state` | `pending`, `prepared`, `deleting` |
| `parser_kind` | frozen `docling` or `reducto` |
| `preparation_generation` | stale worker fence |
| `created_by_user_id` | requester FK |
| `created_at`, `updated_at` | timestamps |

`source_preparation_operations`:

| Field | Rule |
| --- | --- |
| `source_document_id` | FK |
| `domain_id` | FK |
| `operation_type` | `prepare`, `retry`, `cancel`, maybe `delete` |
| `status` | `queued`, `running`, `succeeded`, `failed`, `cancelled` |
| `preparation_generation_at_start` | copied fence |
| `lease_owner`, `lease_expires_at` | worker claim |
| `message`, `error_code`, `error_message` | safe only |

`source_blocks`:

| Field | Rule |
| --- | --- |
| `id` | stable UUID |
| `source_document_id`, `domain_id` | FKs |
| `source_order` | stable integer |
| `kind` | `text`, `table`, `figure` |
| `canonical_markdown` | normalized canonical content |
| `heading_level`, `page_start`, `page_end`, `section_path` | safe structure metadata |

`source_images`:

| Field | Rule |
| --- | --- |
| `id` | stable UUID |
| `source_document_id` | FK |
| `source_block_id` | FK to figure/table block |
| `content_hash`, `mime_type`, `alt_text`, `page_number` | safe image metadata |

### Implement Order

```text
1. Patch DATA-001 with the tables.
2. Add migration with checks and FK constraints.
3. Add SQLAlchemy models matching DATA-001 exactly.
4. Add tests that inspect columns and forbidden omissions.
5. Add repository helpers after schema tests pass.
```

### Red Flags In PR

- `source_documents.state` includes `failed`.
- `metadata` JSON becomes required for product behavior.
- Columns named `path`, `url`, `task_id`, `payload`, `runtime`, or `provider_request`.
- Source Blocks use parser ids as primary keys.
- No partial unique constraint for one active prep operation.

### Tests

- Fresh migration creates all four P4 tables.
- `source_documents` omits path, parser payload, parser task id, LightRAG fields, and generic metadata.
- Partial unique index rejects a second queued/running preparation op for the same source.
- Stale `preparation_generation` update affects zero rows.

### One-line Summary

P4 needs typed Source Document tables first; copying old document/job/chunk tables creates contract drift.
