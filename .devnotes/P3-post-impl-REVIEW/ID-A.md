# ID-A - Source Document contract and preparation ownership (P4 blockers)

Working doc for F-004 T-010 through T-050. Canonical patch targets: `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/api/context-engine-v1.md`, and a PreparedSource contract note in `specs/04-features/F-004-source-documents-preparation/spec.md` before implementation.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, F-003 docs and tests, F-004 docs, API-001, DATA-001, ARCH-001 through ARCH-004, QA-001, QA-002, P3 implementation, `.references/context_engine_fullstack_impl_docs/phase_plan/P4_source_documents_preparation.md`, and `.references/code/context_engine/app/document_processing/`.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-source-tables.md](./ID-A-source-tables.md) | `source_documents`, preparation ops, blocks, images |
| [ID-A-source-api-dtos.md](./ID-A-source-api-dtos.md) | P4 admin API request/response/error shapes |
| [ID-A-canonical-source-blocks.md](./ID-A-canonical-source-blocks.md) | PreparedSource to Source Blocks, no SourceChunk drift |
| [ID-A-parser-adapters.md](./ID-A-parser-adapters.md) | Docling/Reducto adapter fence and safe failures |
| [ID-A-preparation-worker.md](./ID-A-preparation-worker.md) | claim/lease/cancel/retry/all-or-none publish |
| [ID-A-delete-storage.md](./ID-A-delete-storage.md) | originals, hash duplicates, source/domain cleanup |

---

## Lean Winner

```text
4 typed P4 tables
+ closed state enums
+ source-scoped preparation operations
+ one active prep operation per source
+ preparation_generation stale-publish fence
+ immutable original hash + frozen parser_kind
+ parser adapters normalize to one PreparedSource
+ all-or-none publish of Source Blocks
+ no LightRAG call in P4
```

This is the lowest-entropy path that satisfies F-004 and keeps P5 retrieval/indexing clean.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Reuse generic `jobs` table | Constitution bans generic workflow infrastructure unless approved now |
| Persist parser-native Docling/Reducto JSON | F-004 and QA-002 forbid native parser payload persistence/exposure |
| Persist full document tree | F-004 says flat canonical Source Blocks; no persisted document tree |
| Keep old `SourceChunk` API | Product term is Source Block; evidence needs CE-owned block identity |
| Direct LightRAG ingestion during upload | P4 AC-007 says no LightRAG call |
| Browser download/source viewer | Out of P4 scope |
| Store paths/runtime URLs in API DTOs | Security and privacy violation |
| Domain-level global upload queue | Overbroad; source operation table is enough unless DATA-001 says otherwise |

---

## Grill Tree - Decisions Resolved Or Required

```text
Source root?
  -> Source Document row per uploaded file.
  -> Belongs to one Knowledge Domain.
  -> State only: pending | prepared | deleting.

Parser choice?
  -> Freeze parser_kind on upload.
  -> Retry uses same frozen parser_kind.
  -> Credentials resolved privately when worker runs.

Canonical output?
  -> PreparedSource temporary DTO.
  -> Publish source_blocks + source_images only after validation.
  -> No parser-native payload rows.

Operation ownership?
  -> source_preparation_operations owns queued/running/succeeded/failed/cancelled.
  -> Failure details live on operations.
  -> Source row does not gain extra failed/error states.

Concurrency?
  -> One active preparation operation per Source Document.
  -> preparation_generation fences stale publish/cancel/retry/delete.

Delete?
  -> Source delete blocks retrieval/indexing later by state.
  -> P4 removes local source rows/files.
  -> P5 adds remote LightRAG delete.
```

---

## A1 - DATA-001 Patch: `source_documents`

Recommended fields:

| Field | Rule |
| --- | --- |
| `id` | Opaque source id primary key |
| `domain_id` | FK to `domains.id` with domain delete purge semantics |
| `original_filename` | Safe label only; never a path |
| `content_type` | Safe declared type; backend still validates |
| `original_sha256` | Hash of immutable original |
| `original_size_bytes` | Size for validation/evidence |
| `state` | `pending`, `prepared`, `deleting` only |
| `parser_kind` | Frozen `docling` or `reducto` copied at upload |
| `preparation_generation` | Integer fence, starts at 1 |
| `created_by_user_id` | FK to `users.id`, nullable only for system imports |
| `created_at`, `updated_at` | Service timestamps |

Index/constraint recommendations:

| Constraint | Purpose |
| --- | --- |
| `(domain_id, original_sha256)` unique while source is not deleted | AC-002 duplicate guard |
| `(domain_id, created_at DESC)` | admin list |
| check state and parser enums | closed contract |

Explicitly omit: storage path, parser task id, parser URL, parser config JSON, raw parser error, provider payload, LightRAG track id, raw source text, generic metadata.

---

## A2 - DATA-001 Patch: `source_preparation_operations`

Recommended fields:

| Field | Rule |
| --- | --- |
| `id` | Opaque operation UUID |
| `source_document_id` | FK to `source_documents.id` |
| `domain_id` | FK to `domains.id` for list/filter and domain purge |
| `operation_type` | `prepare`, `retry`, `cancel`, `delete` if delete is async |
| `status` | `queued`, `running`, `succeeded`, `failed`, `cancelled` |
| `preparation_generation_at_start` | copied from Source Document |
| `requested_by_user_id` | FK to `users.id`, nullable for worker/system |
| `message` | safe operator message |
| `error_code`, `error_message` | safe terminal failure only |
| `lease_owner`, `lease_expires_at` | worker claim |
| `started_at`, `finished_at`, `created_at`, `updated_at` | timestamps |

Index recommendation: partial unique one active operation per `source_document_id` where status is `queued` or `running`.

---

## A3 - DATA-001 Patch: `source_blocks`

Recommended fields:

| Field | Rule |
| --- | --- |
| `id` | Stable UUID, not parser-native id |
| `source_document_id` | FK to source |
| `domain_id` | FK for query/delete joins |
| `source_order` | stable integer order within Source Document |
| `kind` | `text`, `table`, `figure` |
| `canonical_markdown` | Context Engine normalized block content |
| `heading_level` | nullable integer |
| `page_start`, `page_end` | nullable page range |
| `section_path` | ordered safe labels, likely structured array if contract allows |
| `created_at` | timestamp |

Do not include parser ids, raw payload blobs, bbox unless DATA-001 explicitly decides it is safe and needed for P4.

---

## A4 - DATA-001 Patch: `source_images`

Recommended fields:

| Field | Rule |
| --- | --- |
| `id` | Stable UUID |
| `source_document_id` | FK to source |
| `source_block_id` | FK to figure/table Source Block |
| `content_hash` | image bytes hash |
| `mime_type` | safe type |
| `alt_text` | nullable safe generated/parsed label if available |
| `page_number` | nullable |
| `created_at` | timestamp |

Private storage location stays out of public DTOs. If a storage key is necessary, keep it private and never expose it in API responses.

---

## A5 - API-001 Patch: P4 DTOs

Patch API-001 before route implementation:

| Endpoint | Required shape |
| --- | --- |
| `POST /admin/domains/{domain_id}/sources` | multipart fields, response `{ source, operation }` |
| `GET /admin/domains/{domain_id}/sources` | safe list DTO |
| `GET /admin/domains/{domain_id}/sources/{source_id}` | safe detail DTO |
| `GET /admin/domains/{domain_id}/sources/{source_id}/outline` | heading/page/block summary, no raw full text |
| `GET /admin/domains/{domain_id}/sources/{source_id}/operations` | safe operation history |
| `POST /admin/domains/{domain_id}/sources/{source_id}/retry` | operation response |
| `POST /admin/domains/{domain_id}/sources/{source_id}/cancel` | operation response or terminal status |
| `DELETE /admin/domains/{domain_id}/sources/{source_id}` | source delete response |

Safe source DTO should include `id`, `domainId`, `originalFilename`, `contentType`, `state`, `parserKind`, `createdAt`, `updatedAt`, and a compact block/image count only after prepared.

---

## Single-Source Rules

```text
source_prepared(source) =
  source.state == "prepared"
  AND source has one or more source_blocks

active_preparation_operation(source) =
  exists source_preparation_operations
  where source_document_id = source.id
  and status in ("queued", "running")

stale_worker_publish =
  source.preparation_generation != operation.preparation_generation_at_start
```

Do not copy these rules into frontend code.

---

## Entity Diagram

```text
domains
  |
  +-- source_documents
        |
        +-- source_preparation_operations
        +-- source_blocks
        |     |
        |     +-- source_images
        |
        +-- private original file
```

P5 reads `source_documents` and `source_blocks`; P4 does not call LightRAG.

---

## Junior Dev - Do This Order

```text
1. Patch DATA-001 field tables.
2. Patch API-001 P4 DTOs and error codes.
3. Add PreparedSource contract text to F-004 spec.
4. Add migration and SQLAlchemy models.
5. Add repository helpers for active op and generation fence.
6. Add upload service with hash duplicate guard.
7. Add worker with parser adapter fakes first.
8. Add API routes and strict DTO mapping.
9. Add source/domain delete cleanup.
10. Run test-plan.md and update acceptance/log/register.
```

---

## Red Flags In PR

- `jobs`, RQ, Redis, Celery, or generic workflow table added.
- `metadata` JSON used for product truth.
- Parser task id, provider URL, storage path, raw parser payload, or raw error in DTOs.
- Member source route added in P4.
- Source state includes `failed`.
- Retry changes `parser_kind`.
- P4 calls LightRAG.
- Source Blocks are named chunks in API/data contracts.

---

## Tests To Write

| Test | Proves |
| --- | --- |
| migration creates P4 tables with no forbidden columns | DATA-001 compliance |
| upload duplicate hash same domain returns safe 409 | AC-002 |
| same hash different domain allowed unless contract says otherwise | duplicate scope |
| failed parser leaves source pending and failed operation | AC-004 |
| retry preserves frozen parser kind | AC-005 |
| cancel prevents stale publish | generation fence |
| all-or-none publish rolls back partial blocks/images | AC-003/AC-004 |
| domain delete purges source rows/files | AC-006 |
| fake LightRAG client is never called | AC-007 |
| source DTO scan excludes private/runtime/parser fields | QA-002 |

---

## Still Needs Fixture / ADR

| Item | Owner |
| --- | --- |
| PreparedSource fixture pair: Docling and Reducto same semantic shape | F-004 test fixtures |
| Upload max size/content type policy | API-001 or QA spec |
| Stopped-vs-running domain upload eligibility | API-001 open decision |
| Source delete sync vs async response | API-001 open decision |

---

## Next Grill Session

Patch DATA-001 and API-001 from this ID-A set, then review the migration before service code.
