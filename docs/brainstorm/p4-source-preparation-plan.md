# Context Engine — P4: Source Documents + Flat Canonical Preparation (caveman)

**Goal:** Admin uploads source docs into a domain. System retains immutable original, prepares in background, stores flat ordered blocks + images, exposes safe admin progress/outline.
**Depends:** P1 auth, P2 parser config, P3 domains/runtime.
**Reads:** P0 (one source worker §5; source state §3.2; parser_kind §9; deletion §10; fencing §11; upload-fail cleanup §12; limits §14).
**Style:** caveman. P4 does NOT call LightRAG.

---

## 0. Flow

```text
upload original -> retain unchanged -> prepare in background -> normalize parser output
  -> store flat ordered source blocks -> store extracted images -> safe admin progress + outline
```

Later: P5 blocks -> LightRAG indexing. P6 retrieval evidence -> block IDs -> navigation.

---

## 1. Final decisions

```text
one domain -> 0..many source docs.
one source doc -> one immutable original, one frozen parser_kind, one prep lifecycle,
                  many ordered blocks, 0..many images.
No persisted document tree. No CanonicalDocument row. No SourceNode table. No SourceLocator type.
```

Why: SourceDocument already = root. Ordered blocks + section path already give order, page provenance, section context, P5 index input, P6 evidence links. Node tree adds parent links/orphan checks/node APIs/joins -> no current need -> remove.

---

## 2. Scope

Build: multiple docs/domain, immutable originals, Docling adapter, Reducto adapter, one parser-neutral temp DTO, flat block storage, image extraction/storage, Postgres worker queue, retry, cancel, hard delete, safe admin list/status/outline APIs, domain-delete source cleanup.

Do not build: LightRAG upload/index/query, embeddings, vectors, KG, retrieval, chat, citations, member source viewer, original/image download, revisions, overwrite/replace, folders, annotations, archive/restore, Redis/RQ/Celery/Temporal, generic jobs/workflow framework, parser-native output, local semantic fallback.

---

## 3. Terms

| Term | Meaning |
|---|---|
| Source document | one uploaded file (PDF, DOCX) |
| Original | exact uploaded file, never modify |
| Parser | Docling or Reducto |
| PreparedSource | temporary parser-neutral result, never DB entity |
| Source block | stable ordered source content unit |
| Source image | extracted figure linked to one block |
| Operation | one upload/retry prep attempt |
| Generation | number blocking stale worker publish |

```text
SourceBlock != embedding chunk != LightRAG node != retrieval result != evidence.
P4: stable source content. P5: IndexUnit render. P6: retrieval evidence.
```

---

## 4. Runtime shape

```text
Admin -> CE API (require_admin, validate upload, source CRUD routes)
  -> Postgres (documents, operations, blocks, images)
  -> SourceStore (originals, staging, prepared images)
  <- Source Preparation Worker (resolve parser config, Docling/Reducto, normalize, validate, write images)
Later P5: Worker -> LightRAG
```

Rule: API = fast work. Worker = slow work. API never parses. Worker never handles browser auth. (One worker — P0 §5.)

---

## 5. Flat canonical contract

Both adapters return one temp format:

```ts
type PreparedSource = {
  title: string | null;
  pageCount: number | null;
  blocks: PreparedBlock[];
  images: PreparedImage[];
};
type PreparedBlock = {
  localId: string;            // adapter-only, before DB IDs
  sourceOrder: number;
  kind: "text" | "table" | "figure";
  markdown: string;
  headingLevel: number | null;
  pageStart: number | null;
  pageEnd: number | null;
  sectionPath: string[];
};
type PreparedImage = {
  localId: string;
  parentBlockLocalId: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  stagedRelativePath: string;
};
```

Do not store: Docling JSON, Reducto JSON, parser-native nodes, parser task IDs, provider request IDs, parser file URLs, work folders, raw parser errors, parser config JSON, credentials.

Blocks = three kinds only: text, table, figure. Other content via Markdown: heading->text+headingLevel, list->md list, code->fenced, equation->md/LaTeX, caption->figure md. Every block stores: source order, kind, markdown, optional heading level, page range, section path.

Images: extracted images only. No table exports, page renders, thumbnails, bounding boxes, OCR overlays. Image inherits page/section from parent block.

No persisted tree. Admin outline derives from heading blocks. No source_nodes, no parent IDs, no tree validator.

---

## 6. Validation

Run after adapter returns PreparedSource. Reject:

```text
zero blocks | duplicate local IDs | sourceOrder not unique | not contiguous from 0 |
empty markdown | unknown kind | headingLevel outside 1..6 | headingLevel on table/figure |
bad page range | unsafe section path | image parent missing | parent not figure |
image outside staging | unsupported MIME | image hash mismatch | too many blocks | images too large
```

Rule: all blocks/images publish, or none. Invalid -> fail operation + delete staging.

---

## 7. Lifecycle

```ts
type SourceDocumentState = "pending" | "prepared" | "deleting";
type PreparationStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
type PreparationStage = "queued" | "parsing" | "normalizing" | "materializing" | "finalizing";
```

```text
pending:  original exists, no valid prepared output yet.
prepared: local blocks/images exist, NOT indexed in LightRAG.
deleting: hard delete started, only delete retry allowed.
```

Do not add doc states uploading/parsing/failed/cancelled/retrying/indexed — work belongs in operation rows.

```text
no source -> upload -> pending
  pending -> worker succeeds -> prepared
  pending -> worker fails -> pending + failed op
  pending -> worker cancelled -> pending + cancelled op
  pending|prepared -> delete -> deleting -> row absent
```

---

## 8. Storage layout (extend P3)

```text
.data/lightrag/domains/<domain-id>--<instance>/
  ├── source/<source-document-id>/
  │     ├── original/source.bin
  │     ├── staging/<operation-id>/images/
  │     └── prepared/<operation-id>/images/
  ├── workspace/   # LightRAG only
  └── logs/        # runtime/controller only
```

Ownership: source/ = API + worker. workspace/ = LightRAG only. logs/ = P3 controller only. API/worker access source/ only, never workspace/ or logs/. LightRAG never mounts source/. Browser sees no path. SourceStore owns all path creation. Caller never submits file path / storage key / folder name / asset path / runtime path.

---

## 9. DB — migration 0004_source_documents_and_preparation

### source_documents

```text
id UUID PK
domain_id FK -> domains.id
state
original_filename
original_mime_type
original_byte_size
original_sha256
parser_kind                    -- docling | reducto  (P0 §9; replaces parser_profile_id + revision)
prepared_schema_version
preparation_generation
title
page_count
prepared_at
created_at, created_by_user_id, updated_at, updated_by_user_id
```

```text
INDEX domain_id, INDEX state, INDEX parser_kind
UNIQUE (domain_id, original_sha256)
CHECK original_byte_size > 0
CHECK preparation_generation >= 0
```

Hash uniqueness: same original twice/same domain -> reject. Same filename different file -> allowed. Delete source -> row gone -> may re-upload.

**Parser freeze (corrected):** store `parser_kind` only — snapshot active parser at upload. Do NOT store parser_profile_id, parser_config_revision, parser secret, parser endpoint, raw parser config. Credential value may rotate; parser_kind + non-secret settings stay frozen for retry. Retry resolves current credential privately via TrustedRuntimeResolver.

### source_preparation_operations

```text
id UUID PK
source_document_id FK -> source_documents.id
preparation_generation
status
stage
safe_error_code
cancel_requested_at
claimed_at, lease_expires_at, started_at, completed_at
actor_user_id, request_id, created_at, updated_at
```

```sql
CREATE UNIQUE INDEX uq_source_preparation_one_active
ON source_preparation_operations (source_document_id)
WHERE status IN ('queued','running');
```

No retry counter, stdout, parser payload, raw exception, provider task ID, source path, secret.

### source_blocks

```text
id UUID PK
source_document_id FK
source_order
kind
markdown
heading_level
page_start
page_end
section_path
created_at
```

```text
UNIQUE (source_document_id, source_order)
CHECK markdown <> ''
CHECK source_order >= 0
CHECK heading_level IS NULL OR heading_level BETWEEN 1 AND 6
CHECK page_start IS NULL OR page_start > 0
CHECK page_end IS NULL OR page_end >= page_start
```

### source_images

```text
id UUID PK
source_document_id FK
source_block_id FK -> source_blocks.id
mime_type, byte_size, sha256, relative_storage_key, created_at
UNIQUE relative_storage_key
CHECK byte_size > 0
```

All child rows cascade-delete with source document.

---

## 10. Upload flow

```text
POST /api/v1/admin/domains/{domain_id}/sources   multipart/form-data  file: binary
```

**Multi-step. Order matters.**

```text
1. require_admin.
2. Load domain. Reject state=deleting.
3. Stream upload into private intake staging. Calc SHA-256 + byte size. Detect MIME + verify signature.
4. Resolve active parser server-side. Snapshot as parser_kind.
5. Check parser supports MIME.
6. Insert source document + queued operation. UNIQUE(domain_id, sha256) blocks duplicates.
7. Promote staged original -> source/<source-id>/original/source.bin
8. Return safe source + operation DTO.
```

Failure handling (P0 §12):

```text
DB insert fails  -> remove intake staging.
Original promotion fails -> remove source row + operation -> never leave orphan row pointing at missing file.
```

Do not parse in request.

---

## 11. Worker flow

Postgres queue. Claim:

```sql
SELECT id FROM source_preparation_operations
WHERE status='queued' ORDER BY created_at
FOR UPDATE SKIP LOCKED LIMIT 1;
```

Worker A claims task 1, B skips it, B claims task 2 -> no duplicate work.

```text
1. Claim queued op.
2. Mark running + lease expiry.
3. Check cancellation.
4. Resolve frozen parser config privately (parser_kind + current credential).
5. Parse immutable original.
6. stage=normalizing.
7. Adapter returns PreparedSource.
8. Validate.
9. stage=materializing.
10. Write images -> staging/<op-id>/images.
11. Check cancellation.
12. Promote staging -> prepared/<op-id>.
13. stage=finalizing.
14. Publish blocks/images in one DB transaction.
15. Mark source prepared.
16. Mark op succeeded.
```

Failure: op=failed + safe error code, source stays pending, remove op staging/prepared folder. No auto retry.

---

## 12. Retry, cancel, stale protection

`preparation_generation` blocks old results. upload->1, retry->+1, cancel->+1, delete->+1.

Publish only when:

```text
source state=pending AND source generation = op generation
AND op status=running AND cancel_requested_at IS NULL
```

Late op at old generation -> DB guard rejects -> op removes its files.

Retry: source pending + latest op failed/cancelled + no queued/running -> generation+1, new queued op, reuse original + same source row.

Cancel: queued -> mark cancelled immediately. running -> set cancel_requested_at, generation+1, worker exits at next check (before parser, after parser, before image write, before DB publish).

Worker crash (lease expired): cancel requested -> cancelled. else -> failed, safe_error_code=worker_lost. Worker checks expired leases before claiming next. No separate poller. No auto retry.

---

## 13. Hard delete

```text
DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}
```

Verify source_id belongs to domain_id.

```text
1. Lock source row.
2. Verify belongs to domain.
3. Queued op? -> mark cancelled.
4. Running op? -> return 409 source_busy.
5. state=deleting, generation+1.
6. Remove full source folder.
7. Verify folder absent.
8. Delete source row (cascades blocks/images/operations).
9. Chat redaction (P7 + P0 §10): call ChatService.redact_for_source(source_id) -> redact derived answers in cited GROUNDED turns, keep questions. Not present in P4-only build; wired when P7 lands.
10. Return 204.
```

(P4 sources are local-only — not yet indexed. P5 extends this: indexed source -> 202 + remote cleanup first, P0 §10. Redaction call moves into the worker completion step in P5.)

Delete failure: stays deleting, no retry/replacement/outline read, admin repeats DELETE. No rollback/archive/restore.

---

## 14. Domain delete integration

Domain delete purges all sources first.

```text
domain state=deleting -> reject source upload/retry -> list domain sources:
  queued source work -> cancel
  running source work -> request cancel -> return source_busy
  no active source work -> hard-delete each source
-> remove runtime/DB/workspace/logs -> delete domain row
```

Rule: domain row never deletes while source folders remain. No generic hooks/event bus. One direct call:

```text
DomainLifecycleService -> SourceDocumentPurgeService.purge_all_for_domain()
```

---

## 15. Admin API

All require_admin.

```text
POST   /admin/domains/{id}/sources                       upload one source
GET    /admin/domains/{id}/sources                       list safe summaries
GET    /admin/domains/{id}/sources/{sid}                 summary/progress
GET    /admin/domains/{id}/sources/{sid}/outline         derived heading outline
GET    /admin/domains/{id}/sources/{sid}/operations      safe prep history
POST   /admin/domains/{id}/sources/{sid}/retry           retry failed/cancelled prep
POST   /admin/domains/{id}/sources/{sid}/cancel          cancel active prep
DELETE /admin/domains/{id}/sources/{sid}                 hard delete source
```

No routes: member source access, original/image download, raw parser output, parser config, parser task status, source replace, LightRAG upload/status, embedding/vector/graph data.

Safe outline response:

```json
{"sourceDocumentId":"uuid","title":"Fatigue Report",
 "outline":[{"sourceOrder":0,"headingLevel":1,"markdown":"Results","pageStart":3,"pageEnd":3,"sectionPath":["Results"]}],
 "summary":{"pages":42,"blocks":691,"tables":17,"figures":12,"images":12}}
```

No full raw document text yet.

---

## 16. Parser contract

```python
class ParserAdapter(Protocol):
    def supports(self, mime_type: str) -> bool: ...
    async def prepare(self, *, original_file, runtime_config, work_dir, deadline, cancellation) -> PreparedSource: ...
```

Docling: worker runs locally, map output -> PreparedSource, delete temp files, never persist Docling JSON. Reducto: worker resolves Reducto config privately, adapter calls provider, waits until deadline, maps -> PreparedSource, never persist task ID/payload/file URL.

Safe error codes:

```text
unsupported_source_type, source_too_large, source_unreadable, parser_unavailable,
parser_timeout, parser_rejected_source, parser_invalid_output, canonical_validation_failed,
image_write_failed, worker_lost, cancelled, preparation_failed
```

Never return stack trace, raw parser response, provider request ID, credential, endpoint, path, native payload.

---

## 17. Repo layout

```text
backend/
├── alembic/versions/0004_source_documents_and_preparation.py
├── app/
│   ├── api/v1/admin_sources.py
│   ├── source/
│   │   ├── models.py        # PreparedSource DTOs
│   │   ├── validation.py    # validate_prepared_source()
│   │   ├── repository.py    # source/operation/block/image DB
│   │   ├── service.py       # upload/retry/cancel/delete/read
│   │   ├── store.py         # source paths + file ops
│   │   ├── worker.py        # claim/run/settle
│   │   └── parsers/{docling.py, reducto.py}
│   └── tests/{unit/, integration/, compose/}
└── .data/lightrag/domains/<domain>--<instance>/{source/, workspace/, logs/}
```

Do not add: source_nodes.py, canonical_documents table, source_locator table, document_versions/revisions, archive/, generic_jobs/operations, Redis/RQ/Celery, local_vector_store, semantic_chunks, LightRAG client.

---

## 18. Env + compose

```dotenv
SOURCE_PREPARATION_TIMEOUT_SECONDS=900
SOURCE_PREPARATION_LEASE_SECONDS=960
SOURCE_PREPARATION_IDLE_SLEEP_SECONDS=1
MAX_SOURCE_UPLOAD_BYTES=52428800
MAX_SOURCE_BLOCKS=50000
MAX_SOURCE_IMAGE_BYTES=524288000
PREPARED_SOURCE_SCHEMA_VERSION=1
```

Static services: postgres, migrate, api, domain-controller, source-preparation-worker.

Worker rules: no public port, no Docker socket, no LightRAG network access, source folder access only, Postgres access, provider egress only when Reducto selected. Run non-root, restricted source mount, no workspace/log mount (P0 §14 security).

---

## 19. Build order

```text
Step 1 schema + storage: 0004 migration, four tables, SourceStore, path containment, hash duplicate guard.
Step 2 PreparedSource contract: DTOs + validator + fixture tests.
Step 3 parser adapters: Docling, Reducto, safe error mapping, temp-folder cleanup.
Step 4 worker: Postgres claim loop, lease recovery, stage updates, cancel checks, generation guard,
  staging->prepared promotion, atomic DB publish, orphan staging cleanup at startup.
Step 5 admin API: upload, list, summary, outline, operations, retry, cancel, hard delete, typed errors.
Step 6 domain delete: purge_all_for_domain(), domain source fence, domain delete retry behavior.
Step 7 proof: OpenAPI snapshot, recovery runbook, unit/integration/compose tests.
```

---

## 20. Test gate

```text
Docling fixture -> valid PreparedSource. Reducto fixture -> valid PreparedSource.
Both adapters -> same block/image schema.
Two different docs / same domain -> allowed. Same file twice -> blocked by domain + SHA-256.
Failed parse -> manual retry, no duplicate rows/blocks/images.
Cancel before publish -> no blocks/images.
Old worker finishes after cancel/retry/delete -> cannot mark source prepared.
Upload original-promotion failure -> source row removed (no orphan).
Delete source -> all DB rows/files gone. Delete domain -> all source folders gone before domain row gone.
No P4 LightRAG calls. No parser secret/path/native payload in API or logs.
```

---

## 21. Definition of done

```text
Admin uploads many source docs into one domain. Each original immutable.
Each source owns isolated prep lifecycle. Docling/Reducto map into same PreparedSource.
DB stores flat ordered Markdown blocks + optional images. parser_kind frozen at upload (no profile/revision).
Admin sees safe progress + derived outline. Failure supports manual retry. Cancel blocks stale publish.
Upload promotion failure leaves no orphan row. Hard delete removes source rows/files.
Domain delete removes every source first. Phase 4 makes zero LightRAG calls.
```

## Final boundary

```text
P4: source upload -> parser -> flat prepared blocks/images -> safe local lifecycle.
P5: blocks -> deterministic render -> LightRAG indexing.
P6: retrieval evidence -> source block ID -> source navigation.
```
