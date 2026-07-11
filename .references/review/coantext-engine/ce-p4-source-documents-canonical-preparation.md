# Context Engine — Phase 4: Source Documents + Flat Canonical Preparation

**Status:** Greenfield implementation plan
**Build style:** API-first. Junior-dev friendly. Low entropy.
**Depends on:** Phase 1 auth; Phase 2 parser config; Phase 3 domains/runtime lifecycle.

---

# 0. Goal

Admin uploads source documents into a Knowledge Domain.

System:

```text
upload original
  -> retain unchanged
  -> prepare in background
  -> normalize parser output
  -> store flat ordered source blocks
  -> store extracted images
  -> expose safe admin progress + outline
```

Later:

```text
Phase 5:
source blocks
  -> IndexUnitBuilder
  -> LightRAG indexing

Phase 6:
retrieval evidence
  -> source block IDs
  -> source navigation
```

Phase 4 does **not** call LightRAG.

---

# 1. Final Decisions

```text
One domain
  -> zero or many source documents.

One source document
  -> one immutable original file.
  -> one frozen parser selection.
  -> one preparation lifecycle.
  -> many ordered source blocks.
  -> zero or many extracted images.

No persisted document tree.
No CanonicalDocument DB row.
No SourceNode DB table.
No standalone SourceLocator type.
```

Why:

```text
SourceDocument already = document root.

Ordered blocks + section path already provide:
  source order
  page provenance
  section context
  Phase 5 index input
  Phase 6 evidence links

Persisted node tree adds:
  parent links
  root validation
  orphan checks
  node APIs
  joins

No current need. Remove.
```

---

# 2. Scope

## Build

```text
multiple source docs/domain
immutable originals
Docling adapter
Reducto adapter
one parser-neutral temporary DTO
flat canonical block storage
image extraction/storage
PostgreSQL worker queue
retry
cancel
hard delete
safe admin source list/status/outline APIs
domain-delete source cleanup
```

## Do not build

```text
LightRAG upload/index/query
embeddings
vectors
knowledge graph
retrieval
chat
citations
member source viewer
original file download
image download
document revisions
overwrite/replace endpoint
folders
annotations
archive/restore
Redis/RQ/Celery/Temporal
generic jobs framework
generic workflow framework
parser-native API/UI output
local semantic fallback
```

---

# 3. Simple Terms

| Term            | Meaning                                           |
| --------------- | ------------------------------------------------- |
| Source document | One uploaded file. Example: PDF, DOCX.            |
| Original        | Exact uploaded file. Never modify.                |
| Parser          | Docling or Reducto.                               |
| PreparedSource  | Temporary parser-neutral result. Never DB entity. |
| Source block    | Stable ordered source content unit.               |
| Source image    | Extracted figure/image linked to one block.       |
| Operation       | One upload/retry preparation attempt.             |
| Generation      | Number blocking stale worker publish.             |
| Staging folder  | Temporary files for one operation.                |

Critical distinction:

```text
SourceBlock
  != embedding chunk
  != LightRAG graph node
  != retrieval result
  != final evidence response

Phase 4:
  stable source content.

Phase 5:
  IndexUnitBuilder creates LightRAG input units.

Phase 6:
  retrieval returns evidence.
```

---

# 4. Runtime Shape

```text
+---------+
|  Admin  |
+---------+
     |
     | upload / retry / cancel / delete
     v
+------------------------+
| Context Engine API     |
| - require_admin        |
| - validate upload      |
| - source CRUD routes   |
+------------------------+
     |              |
     |              |
     v              v
+-------------+  +------------------+
| PostgreSQL  |  | SourceStore      |
| documents   |  | originals        |
| operations  |  | staging          |
| blocks      |  | prepared images  |
| images      |  +------------------+
+-------------+
     ^
     |
     | claim / publish
     |
+---------------------------+
| Source Preparation Worker |
| - resolve parser config   |
| - Docling or Reducto      |
| - normalize               |
| - validate               |
| - write images            |
+---------------------------+

Later Phase 5:
Worker -> LightRAG
```

Rule:

```text
API = fast work.
Worker = slow work.

API never parses source.
Worker never handles browser auth.
```

---

# 5. Flat Canonical Source Contract

## 5.1 Parser result

Docling and Reducto return different shapes.

Both adapters must return one temporary format:

```text
Docling result  \
                 -> PreparedSource -> validate -> DB publish
Reducto result  /
```

```ts
type PreparedSource = {
  title: string | null;
  pageCount: number | null;
  blocks: PreparedBlock[];
  images: PreparedImage[];
};

type PreparedBlock = {
  localId: string; // adapter-only

  sourceOrder: number;
  kind: "text" | "table" | "figure";

  markdown: string;
  headingLevel: number | null;

  pageStart: number | null;
  pageEnd: number | null;
  sectionPath: string[];
};

type PreparedImage = {
  localId: string; // adapter-only
  parentBlockLocalId: string;

  mimeType: string;
  byteSize: number;
  sha256: string;

  stagedRelativePath: string;
};
```

`localId` exists only before DB IDs exist.

Do not store:

```text
Docling JSON
Reducto JSON
parser-native nodes
parser task IDs
provider request IDs
parser file URLs
parser work folders
raw parser errors
parser config JSON
credentials
```

---

## 5.2 Source blocks

Blocks are Phase 4 canonical source records.

```text
Document
  |
  +-- block 0: heading/text
  +-- block 1: text
  +-- block 2: table
  +-- block 3: figure
  +-- block 4: text
```

Use only three kinds:

```text
text
table
figure
```

Represent other content through Markdown:

```text
heading     -> text + headingLevel
list        -> Markdown list
code        -> fenced Markdown
equation    -> Markdown/LaTex text
caption     -> figure Markdown
```

Why:

```text
Few kinds.
One text format.
No parser-specific branching.
```

Every block stores:

```text
source order
kind
Markdown
optional heading level
page range
section path
```

Example:

```text
sourceOrder: 42
kind: text
markdown: "Stress amplitude rose after cycle 3."
headingLevel: null
pageStart: 12
pageEnd: 12
sectionPath: ["Results", "Fatigue Test 3"]
```

---

## 5.3 Source images

Phase 4 stores extracted images only.

```text
Figure block
  |
  +-- source image
```

Do not add now:

```text
table exports
page renders
thumbnails
bounding boxes
OCR overlays
```

Why:

```text
Tables already become Markdown blocks.
No Phase 4/5 user needs page renders.
Exact PDF highlighting belongs later.
```

Image inherits page/section provenance from parent block.

---

## 5.4 No persisted document tree

Admin outline derives from heading blocks.

```text
Blocks:

0  h1  "Results"
1  h2  "Fatigue Test 1"
2  text "..."
3  h2  "Fatigue Test 2"
4  text "..."

Derived outline:

Results
├── Fatigue Test 1
└── Fatigue Test 2
```

No `source_nodes`.

No parent IDs.

No stored tree.

No tree validator.

---

# 6. Validation

Run validator after adapter returns `PreparedSource`.

```text
Parser
  |
  v
PreparedSource
  |
  v
validate_prepared_source()
  |
  +-> invalid -> fail operation + delete staging
  |
  +-> valid -> publish blocks/images
```

Reject:

```text
zero blocks
duplicate local IDs
sourceOrder not unique
sourceOrder not contiguous from 0
empty Markdown
unknown block kind
headingLevel outside 1..6
headingLevel set on table/figure
bad page range
unsafe section path
image parent block missing
image parent block not figure
image outside staging folder
unsupported image MIME
image hash mismatch
too many blocks
too-large total images
```

Rule:

```text
All source blocks/images publish.
Or none publish.
```

---

# 7. Source Lifecycle

## 7.1 Source document state

```ts
type SourceDocumentState =
  | "pending"
  | "prepared"
  | "deleting";
```

Meaning:

```text
pending:
  original exists.
  no valid prepared output yet.

prepared:
  local canonical blocks/images exist.
  Not indexed in LightRAG yet.

deleting:
  hard delete started.
  Only delete retry allowed.
```

## 7.2 Operation status

```ts
type PreparationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled";
```

## 7.3 Operation stage

```ts
type PreparationStage =
  | "queued"
  | "parsing"
  | "normalizing"
  | "materializing"
  | "finalizing";
```

Do not add document states:

```text
uploading
parsing
failed
cancelled
retrying
indexed
```

Work belongs in operation rows.

---

## 7.4 Lifecycle diagram

```text
No source
   |
   | upload
   v
pending
   |
   +-- worker succeeds --> prepared
   |
   +-- worker fails ----> pending + failed operation
   |
   +-- worker cancelled -> pending + cancelled operation
   |
   +-- delete ----------> deleting -> row absent

prepared
   |
   +-- delete ----------> deleting -> row absent
```

---

# 8. Storage Layout

Extend Phase 3 domain root.

```text
.data/
└── lightrag/
    └── domains/
        └── <domain-id>--<instance>/
            ├── source/
            │   └── <source-document-id>/
            │       ├── original/
            │       │   └── source.bin
            │       ├── staging/
            │       │   └── <operation-id>/
            │       │       └── images/
            │       └── prepared/
            │           └── <operation-id>/
            │               └── images/
            │
            ├── workspace/   # LightRAG only
            └── logs/        # runtime/controller only
```

Ownership:

```text
source/
  API + source worker.

workspace/
  LightRAG only.

logs/
  Phase 3 runtime controller only.
```

Rules:

```text
API/worker can access source/ only.

API/worker cannot access workspace/ or logs/.

LightRAG does not mount source/.

Browser sees no filesystem path.
```

`SourceStore` owns all path creation.

Caller never submits:

```text
file path
storage key
folder name
asset path
runtime path
```

---

# 9. Database

Create migration:

```text
0004_source_documents_and_preparation
```

## 9.1 `source_documents`

```text
id UUID PK
domain_id FK -> domains.id
state
original_filename
original_mime_type
original_byte_size
original_sha256
parser_profile_id
parser_config_revision
prepared_schema_version
preparation_generation
title
page_count
prepared_at
created_at
created_by_user_id
updated_at
updated_by_user_id
```

Required constraints:

```text
INDEX domain_id
INDEX state
INDEX parser_profile_id

UNIQUE (domain_id, original_sha256)

CHECK original_byte_size > 0
CHECK preparation_generation >= 0
```

Why hash uniqueness:

```text
Same original uploaded twice into same domain
  -> reject duplicate.

Same filename, different file
  -> allowed.

Delete source
  -> row gone
  -> same file may upload again.
```

Parser freeze:

```text
Store:
  parser_profile_id
  parser_config_revision

Do not store:
  parser secret
  parser endpoint
  raw parser config
```

Credential rotation may change secret value.

Parser kind/non-secret settings remain frozen for source retry.

---

## 9.2 `source_preparation_operations`

```text
id UUID PK
source_document_id FK -> source_documents.id
preparation_generation
status
stage
safe_error_code
cancel_requested_at
claimed_at
lease_expires_at
started_at
completed_at
actor_user_id
request_id
created_at
updated_at
```

One active operation:

```sql
CREATE UNIQUE INDEX uq_source_preparation_one_active
ON source_preparation_operations (source_document_id)
WHERE status IN ('queued', 'running');
```

No:

```text
retry counter
worker stdout
parser payload
raw exception
provider task ID
source path
secret
```

---

## 9.3 `source_blocks`

```text
id UUID PK
source_document_id FK -> source_documents.id
source_order
kind
markdown
heading_level
page_start
page_end
section_path
created_at
```

Constraints:

```text
UNIQUE (source_document_id, source_order)

CHECK markdown <> ''
CHECK source_order >= 0
CHECK heading_level IS NULL OR heading_level BETWEEN 1 AND 6
CHECK page_start IS NULL OR page_start > 0
CHECK page_end IS NULL OR page_end >= page_start
```

---

## 9.4 `source_images`

```text
id UUID PK
source_document_id FK -> source_documents.id
source_block_id FK -> source_blocks.id
mime_type
byte_size
sha256
relative_storage_key
created_at
```

Constraints:

```text
UNIQUE relative_storage_key

CHECK byte_size > 0
```

All source child rows cascade-delete with source document.

```text
source_documents
  ├── source_preparation_operations
  ├── source_blocks
  └── source_images
```

---

# 10. Upload Flow

Route:

```text
POST /api/v1/admin/domains/{domain_id}/sources
Content-Type: multipart/form-data

file: binary
```

API steps:

```text
1. require_admin.

2. Load domain.
   Reject domain state=deleting.

3. Stream upload into private intake staging.
   Calculate SHA-256 + byte size.
   Detect MIME + verify file signature.

4. Resolve active parser profile server-side.

5. Check parser supports MIME type.

6. Insert source document + queued operation.
   Unique (domain_id, original_sha256) blocks duplicates.

7. Promote staged original:
   source/<source-id>/original/source.bin

8. Return safe source + operation DTO.
```

Failure:

```text
DB insert fails
  -> remove intake staging.

Original promotion fails
  -> operation fails safely.
  -> worker never parses missing file.
```

Do not parse in request.

---

# 11. Worker Flow

Worker uses PostgreSQL queue.

```text
queued operation
      |
      | SELECT ... FOR UPDATE SKIP LOCKED
      v
worker claims operation
      |
      v
parse -> normalize -> validate -> write images
      |
      v
guarded DB publish
      |
      v
prepared
```

Claim query:

```sql
SELECT id
FROM source_preparation_operations
WHERE status = 'queued'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Why:

```text
Worker A claims task 1.
Worker B skips task 1.
Worker B can claim task 2.

No duplicate work.
```

Worker steps:

```text
1. Claim queued operation.
2. Mark running + lease expiry.
3. Check cancellation.
4. Resolve frozen parser config privately.
5. Parse immutable original.
6. Set stage=normalizing.
7. Adapter returns PreparedSource.
8. Validate PreparedSource.
9. Set stage=materializing.
10. Write images into staging/<operation-id>/images.
11. Check cancellation.
12. Promote staging folder -> prepared/<operation-id>.
13. Set stage=finalizing.
14. Publish source blocks/images in one DB transaction.
15. Mark source prepared.
16. Mark operation succeeded.
```

Failure:

```text
Parser/validation/storage fails
  -> operation=failed
  -> safe error code
  -> source remains pending
  -> remove operation staging/prepared folder
```

No automatic retry.

---

# 12. Retry, Cancel, Stale Worker Protection

## Generation

`preparation_generation` blocks old results.

```text
Upload:
  generation = 1

Retry:
  generation += 1

Cancel:
  generation += 1

Delete:
  generation += 1
```

Example:

```text
Operation A starts at generation 1.

Admin cancels A.
Source becomes generation 2.

A finishes late.
A tries DB publish at generation 1.

DB guard rejects A.
A removes its files.
```

Publish only when:

```text
source state = pending
AND source generation = operation generation
AND operation status = running
AND cancel_requested_at IS NULL
```

## Retry

Allowed:

```text
source state=pending
latest operation=failed or cancelled
no queued/running operation
```

Action:

```text
generation += 1
create queued operation
reuse original file
reuse same source document row
```

## Cancel

```text
Queued:
  mark cancelled immediately.

Running:
  set cancel_requested_at.
  increment generation.
  worker exits at next check.
```

Checks:

```text
before parser call
after parser call
before image write
before DB publish
```

## Worker crash

Lease expired:

```text
cancel requested
  -> operation=cancelled

no cancel request
  -> operation=failed
  -> safe_error_code=worker_lost
```

Worker checks expired leases before claiming next work.

No separate poller.

No auto retry.

---

# 13. Hard Delete

Route:

```text
DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}
```

Browser may submit `source_id` in route.

Server must verify:

```text
source_id belongs to domain_id
```

Hard-delete success means:

```text
original folder absent
staging folders absent
prepared folders absent
source_images rows absent
source_blocks rows absent
operation rows absent
source document row absent
```

Flow:

```text
1. Lock source row.

2. Verify source belongs to requested domain.

3. Queued operation?
   -> mark cancelled.

4. Running operation?
   -> return 409 source_busy.

5. Set source state=deleting.
   Increment generation.

6. Remove full source folder.

7. Verify folder absent.

8. Delete source row.
   DB cascades blocks/images/operations.

9. Return 204.
```

Delete failure:

```text
source stays deleting
no retry
no upload replacement
no outline read
admin repeats DELETE
```

No rollback.

No archive.

No restore.

---

# 14. Domain Delete Integration

Domain delete must purge **all** source documents first.

```text
Delete domain
   |
   v
Domain state=deleting
   |
   v
Reject source upload/retry
   |
   v
List domain source docs
   |
   +-- queued source work
   |     -> cancel
   |
   +-- running source work
   |     -> request cancel
   |     -> return source_busy
   |
   +-- no active source work
         -> hard-delete each source
   |
   v
Remove runtime/database/workspace/logs
   |
   v
Delete domain row
```

Rule:

```text
Domain row never deletes while source folders remain.
```

No generic hooks. No event bus.

One direct call:

```text
DomainLifecycleService
  -> SourceDocumentPurgeService.purge_all_for_domain()
```

---

# 15. Admin API

All routes require:

```python
AdminUser = Depends(require_admin)
```

| Method   | Route                                                              | Purpose                      |
| -------- | ------------------------------------------------------------------ | ---------------------------- |
| `POST`   | `/api/v1/admin/domains/{domain_id}/sources`                        | Upload one source            |
| `GET`    | `/api/v1/admin/domains/{domain_id}/sources`                        | List safe source summaries   |
| `GET`    | `/api/v1/admin/domains/{domain_id}/sources/{source_id}`            | Read source summary/progress |
| `GET`    | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/outline`    | Derived heading outline      |
| `GET`    | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/operations` | Safe prep history            |
| `POST`   | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/retry`      | Retry failed/cancelled prep  |
| `POST`   | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/cancel`     | Cancel active prep           |
| `DELETE` | `/api/v1/admin/domains/{domain_id}/sources/{source_id}`            | Hard delete source           |

No routes:

```text
member source access
original download
image download
raw parser output
parser config
parser task status
source replace
LightRAG upload/status
embedding/vector/graph data
```

Safe outline response:

```json
{
  "sourceDocumentId": "uuid",
  "title": "Fatigue Report",
  "outline": [
    {
      "sourceOrder": 0,
      "headingLevel": 1,
      "markdown": "Results",
      "pageStart": 3,
      "pageEnd": 3,
      "sectionPath": ["Results"]
    }
  ],
  "summary": {
    "pages": 42,
    "blocks": 691,
    "tables": 17,
    "figures": 12,
    "images": 12
  }
}
```

No full raw document text yet.

---

# 16. Parser Contract

```python
class ParserAdapter(Protocol):
    def supports(self, mime_type: str) -> bool: ...

    async def prepare(
        self,
        *,
        original_file: Path,
        runtime_config: ParserRuntimeConfig,
        work_dir: Path,
        deadline: datetime,
        cancellation: CancellationProbe,
    ) -> PreparedSource: ...
```

## Docling

```text
Worker runs Docling locally.
Adapter maps output -> PreparedSource.
Delete parser temp files.
Never persist Docling JSON.
```

## Reducto

```text
Worker resolves Reducto config privately.
Adapter calls provider.
Adapter waits until deadline.
Adapter maps output -> PreparedSource.
Never persist Reducto task ID/payload/file URL.
```

Safe error codes:

```text
unsupported_source_type
source_too_large
source_unreadable
parser_unavailable
parser_timeout
parser_rejected_source
parser_invalid_output
canonical_validation_failed
image_write_failed
worker_lost
cancelled
preparation_failed
```

Never return:

```text
stack trace
raw parser response
provider request ID
credential
endpoint
filesystem path
native payload
```

---

# 17. Repository Layout

```text
backend/
├── alembic/
│   └── versions/
│       └── 0004_source_documents_and_preparation.py
│
├── app/
│   ├── api/v1/
│   │   └── admin_sources.py
│   │
│   ├── source/
│   │   ├── models.py           # PreparedSource DTOs
│   │   ├── validation.py       # validate_prepared_source()
│   │   ├── repository.py       # source/operation/block/image DB work
│   │   ├── service.py          # upload/retry/cancel/delete/read
│   │   ├── store.py            # source paths + file operations
│   │   ├── worker.py           # claim/run/settle
│   │   └── parsers/
│   │       ├── docling.py
│   │       └── reducto.py
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── compose/
│
└── .data/
    └── lightrag/
        └── domains/
            └── <domain>--<instance>/
                ├── source/
                ├── workspace/
                └── logs/
```

Do not add:

```text
source_nodes.py
canonical_documents table
source_locator table
document_versions/
document_revisions/
archive/
generic_jobs/
generic_operations/
Redis/
RQ/
Celery/
local_vector_store/
semantic_chunks/
LightRAG client
```

---

# 18. Environment + Compose

```dotenv
SOURCE_PREPARATION_TIMEOUT_SECONDS=900
SOURCE_PREPARATION_LEASE_SECONDS=960
SOURCE_PREPARATION_IDLE_SLEEP_SECONDS=1

MAX_SOURCE_UPLOAD_BYTES=52428800
MAX_SOURCE_BLOCKS=50000
MAX_SOURCE_IMAGE_BYTES=524288000

PREPARED_SOURCE_SCHEMA_VERSION=1
```

Static Compose services:

```text
postgres
migrate
api
domain-controller
source-preparation-worker
```

Worker rules:

```text
no public port
no Docker socket
no LightRAG network access
source folder access only
PostgreSQL access
provider egress only when Reducto selected
```

---

# 19. Build Order

## Step 1 — Schema + storage

```text
0004 migration
source_documents
source_preparation_operations
source_blocks
source_images
SourceStore
path containment
hash duplicate guard
```

## Step 2 — PreparedSource contract

```text
PreparedSource DTO
PreparedBlock DTO
PreparedImage DTO
validator
fixture tests
```

## Step 3 — Parser adapters

```text
Docling adapter
Reducto adapter
safe error mapping
temporary parser-folder cleanup
```

## Step 4 — Worker

```text
Postgres claim loop
lease recovery
stage updates
cancel checks
generation guard
staging -> prepared promotion
atomic DB publish
orphan staging cleanup at worker startup
```

## Step 5 — Admin API

```text
upload
list
summary
outline
operations
retry
cancel
hard delete
typed errors
```

## Step 6 — Domain delete

```text
purge_all_for_domain()
domain source fence
domain delete retry behavior
```

## Step 7 — Proof

```text
OpenAPI snapshot
source prep recovery runbook
unit tests
integration tests
Compose smoke test
```

---

# 20. Test Gate

Must pass:

```text
Docling fixture -> valid PreparedSource.

Reducto fixture -> valid PreparedSource.

Both adapters -> same block/image schema.

Two different docs -> same domain allowed.

Same file twice -> duplicate blocked by domain + SHA-256.

Failed parse -> manual retry.
No duplicate source rows/blocks/images.

Cancel before publish -> no blocks/images.

Old worker finishes after cancel/retry/delete
  -> cannot mark source prepared.

Delete source -> all DB rows/files gone.

Delete domain -> all source folders gone before domain row gone.

No Phase 4 LightRAG calls.

No parser secret/path/native payload in API or logs.
```

---

# 21. Definition of Done

```text
Admin uploads many source docs into one domain.

Each original file remains immutable.

Each source owns isolated preparation lifecycle.

Docling/Reducto map into same PreparedSource format.

DB stores flat ordered Markdown blocks.

DB stores optional extracted images.

Admin sees safe progress + derived outline.

Failure supports manual retry.

Cancel blocks stale publish.

Hard delete removes source rows/files.

Domain delete removes every source first.

Phase 4 makes zero LightRAG document/index/query calls.
```

## Final Boundary

```text
Phase 4:
source upload
  -> parser
  -> flat prepared blocks/images
  -> safe local lifecycle

Phase 5:
blocks
  -> IndexUnitBuilder
  -> LightRAG indexing

Phase 6:
retrieval evidence
  -> source block ID
  -> source navigation
```
