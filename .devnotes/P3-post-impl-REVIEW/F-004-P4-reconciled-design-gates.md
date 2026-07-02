# F-004 / P4 Reconciled Design Gates

Status: review decision draft  
Feature: F-004 - Source Documents And Canonical Preparation  
Date: 2026-07-02  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `F-004-P4-readiness.md`.

It is not implementation authority by itself. Before coding, patch:

- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/04-features/F-004-source-documents-preparation/spec.md`
- `specs/04-features/F-004-source-documents-preparation/plan.md` and `test-plan.md` where noted

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `DESIGN.md`
- `FOLDER-STRUCTURE.md`
- `REFERENCES.md`
- `specs/00-governance/constitution.md`
- `specs/01-product/business-rules.md`
- `specs/01-product/domain-model.md`
- `specs/01-product/roles-and-permissions.md`
- `specs/02-architecture/system-context.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/02-architecture/data-ownership.md`
- `specs/02-architecture/integration-flows.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/04-features/F-002-trusted-runtime-config/`
- `specs/04-features/F-003-knowledge-domains-runtime/`
- `specs/04-features/F-004-source-documents-preparation/`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/test-strategy.md`
- `specs/05-quality/performance-and-resilience.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-readiness.md`
- `.devnotes/P3-post-impl-REVIEW/ID-A*.md`
- `.references/context_engine_fullstack_impl_docs/phase_plan/P4_source_documents_preparation.md`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Canonical Source, Source Block, Evidence, Citation.
- P4 creates Source Documents, Canonical Source normalization, Source Blocks, and Source Images.
- P4 does not call LightRAG, create embeddings, retrieve evidence, create citations, build chat, or expose source viewers/downloads.
- Backend owns source lifecycle, parser credentials, storage, state transitions, and destructive cleanup.
- Browser receives safe admin DTOs only. It never receives source originals, storage paths, parser-native payloads, parser URLs/task IDs, runtime URLs, credentials, raw source text, stack traces, provider payloads, or raw LightRAG output.
- KISS/YAGNI: typed P4 tables, source-owned operations, one worker path. No generic jobs table, Redis/RQ/Celery, event bus, workflow engine, parser profile framework, SourceChunk compatibility layer, or persisted document tree.
- Local Studio visual parity affects later UI surfaces, not P4 backend behavior. P4 DTOs should be compact and safe enough for dense lists/detail panels later.

## Recommended Build Shape

```text
source_documents
  owns uploaded Source Document identity, immutable file hash, source state,
  frozen parser_kind, and preparation_generation fence.

source_preparation_operations
  owns queued/running/succeeded/failed/cancelled preparation attempts,
  lease fields, generation-at-start, and safe terminal failure.

source_blocks
  owns stable Context Engine Source Block IDs and canonical Markdown.

source_images
  owns private image metadata linked to a figure Source Block.

worker
  claims a preparation operation, parses outside long DB transactions,
  validates PreparedSource, then publishes blocks/images all-or-none.
```

## A. Contract / Data / API Gates

### A1. Exact `source_documents` fields, indexes, delete behavior, duplicate-hash constraint?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Typed Source Document root | Matches F-004, Source vocabulary, P5 handoff, and safe DTO rules | Requires DATA-001 patch before code | `id`, `domain_id`, `original_filename`, `content_type`, `original_sha256`, `state`, `parser_kind` |
| Old-style document row plus JSON metadata | Quick to port old behavior | Contract drift, leakage risk, harder tests | `metadata.parser_job_id`, `storage_path` |
| Split file/storage/source tables now | More normalized | YAGNI before versioning/downloads | `source_files`, `source_documents`, `storage_objects` |

Recommendation: typed Source Document root.

User decision: accepted Option 1.

Patch DATA-001 with:

```text
id                      opaque UUID string primary key
domain_id               FK domains.id, on delete cascade as DB safety
original_filename       safe label only, never a path
content_type            safe declared/validated type
original_sha256         sha256 of immutable original bytes
original_size_bytes     upload size
state                   pending | prepared | deleting
parser_kind             frozen docling | reducto
preparation_generation  integer fence, starts at 1
created_by_user_id      FK users.id, nullable by SET NULL only
created_at, updated_at  service timestamps
```

Indexes/constraints:

```text
unique(domain_id, original_sha256)
index(domain_id, created_at desc)
check state in ('pending', 'prepared', 'deleting')
check parser_kind in ('docling', 'reducto')
check preparation_generation >= 1
```

Delete behavior: source and domain delete hard-delete the row after private file cleanup. Because sources are hard-deleted, the duplicate-hash constraint does not need a soft-delete predicate.

### A2. Exact `source_preparation_operations` fields, statuses, lease fields, generation fence, safe error fields?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Dedicated preparation operation table | Mirrors P3 operation discipline without generic jobs | Needs worker/repository tests | `source_preparation_operations` |
| Generic job table | Reusable | Explicitly rejected by constitution and phase plans | `jobs(resource_type, payload)` |
| State only on Source Document | Simple schema | Loses retry/failure history and lease ownership | `source_documents.error_message` |

Recommendation: dedicated preparation operation table.

Patch DATA-001 with:

```text
id                                opaque UUID primary key
source_document_id                FK source_documents.id on delete cascade
domain_id                         FK domains.id on delete cascade
operation_type                    prepare only in P4
status                            queued | running | succeeded | failed | cancelled
preparation_generation_at_start   copied from source_documents
requested_by_user_id              FK users.id, nullable by SET NULL
message                           safe operator message
error_code, error_message          safe terminal failure only
lease_owner, lease_expires_at      worker claim fields
started_at, finished_at            nullable operation timestamps
created_at, updated_at             service timestamps
```

Indexes/constraints:

```text
unique active operation per source_document_id
  where status in ('queued', 'running')

index(domain_id, created_at desc)
index(source_document_id, created_at desc)
```

Use `operation_type = prepare` for initial upload and retry. Retry is an action that creates a new prepare attempt; cancel marks an active prepare operation cancelled. Do not add `delete` unless source delete becomes async in P5.

### A3. Exact `source_blocks` and `source_images` fields?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Flat Source Blocks plus image metadata | Matches F-004 and exact evidence future | Requires adapter normalization | ordered `source_blocks` |
| Persist full document tree | Easier source viewer later | Out of P4, risks old model drift | sections/pages/blocks tree |
| Persist parser-native payloads | Debuggable | Forbidden by QA-002 and F-004 | Docling JSON, Reducto JSON |

Recommendation: flat Source Blocks and Source Images only.

Patch DATA-001 with `source_blocks`:

```text
id                    stable UUID primary key, Context Engine-owned
source_document_id    FK source_documents.id on delete cascade
domain_id             FK domains.id on delete cascade
source_order          integer, unique per source
kind                  text | table | figure
canonical_markdown    normalized canonical content, restricted data
heading_level         nullable integer
page_start, page_end  nullable page range
section_path          structured safe heading labels, no parser payload
created_at            timestamp
```

Patch DATA-001 with `source_images`:

```text
id                    stable UUID primary key
source_document_id    FK source_documents.id on delete cascade
source_block_id       FK source_blocks.id on delete cascade
content_hash          image bytes hash
mime_type             safe image MIME
alt_text              nullable safe label
page_number           nullable
created_at            timestamp
```

Use `source_images` for figure blocks in P4. Table image extraction can wait for a later approved need.

### A4. Source id format: UUID, slug, or opaque string?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Opaque UUID string | Safe, non-semantic, easy to generate, no naming UI | Not human readable | `1a5d...` |
| Admin slug | Friendly | Adds rename/conflict policy not needed in P4 | `fatigue-manual` |
| Hash-derived id | Deterministic | Leaks duplicate relation and complicates replacement | sha256 prefix |

Recommendation: opaque UUID string in API and DATA-001. Source IDs are admin API resource identifiers, not product labels.

### A5. Upload request shape: multipart names, optional display filename, max size, content-type rules?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Narrow multipart contract | Clear tests, safe DTO, minimal UI guesswork | Requires explicit allowlist | `file` only |
| Multipart with custom display name | More flexible | Adds naming/versioning behavior early | `file`, `displayFilename` |
| Accept arbitrary content and trust parser | Fastest | Unsafe, bad errors, costly parser calls | no type/size gate |

Recommendation: narrow multipart contract.

Patch API-001:

```text
POST /admin/domains/{domain_id}/sources
Content-Type: multipart/form-data
Parts:
  file: required binary upload
```

Use sanitized uploaded filename as `originalFilename`. Do not add `displayFilename` in P4.

Recommended pilot limits to capture in API-001:

```text
max file size: 25 MiB
content types: application/pdf, text/plain, text/markdown,
               application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

If product needs spreadsheets/images/HTML in P4, patch the allowlist before code. Do not silently accept every parser-supported type.

### A6. Source list/detail/outline/operations DTOs?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe lifecycle DTOs only | Satisfies QA-002 and future compact UI | No source viewer | counts/status/timestamps |
| Include canonical block text | Useful for admin inspection | Violates P4 safe API posture | `canonicalMarkdown` in response |
| Reuse DB models as DTOs | Fast | Leaks private fields over time | ORM serialization |

Recommendation: safe lifecycle DTOs only.

Patch API-001 with:

```json
{
  "source": {
    "id": "source-uuid",
    "domainId": "fatigue",
    "originalFilename": "manual.pdf",
    "contentType": "application/pdf",
    "originalSizeBytes": 12345,
    "state": "pending",
    "parserKind": "docling",
    "blockCount": 0,
    "imageCount": 0,
    "createdAt": "2026-07-02T12:00:00Z",
    "updatedAt": "2026-07-02T12:00:00Z"
  }
}
```

`GET /outline` returns structure only:

```json
{
  "items": [
    {
      "sourceOrder": 1,
      "kind": "text",
      "headingLevel": 1,
      "title": "Inspection",
      "pageStart": 1,
      "pageEnd": 2,
      "sectionPath": ["Inspection"]
    }
  ]
}
```

No full source text, canonical Markdown, parser payload, storage path, image URL, source download URL, or member source refs.

### A7. Retry/cancel/delete success bodies and error codes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Retry/cancel return safe operation, P4 delete is sync `204` | KISS, matches local-only P4 delete | P5 must extend delete for indexed sources | `202 { operation }`, `204` |
| Make every action async `202` | Consistent surface | Adds operation scope P4 does not need | async source delete op |
| Return Source Document after every action | Simple UI refresh | Less precise for worker actions | `{ source }` after retry |

Recommendation:

```text
retry   -> 202 { operation }
cancel  -> 200 { operation } after marking active prepare operation cancelled
delete  -> 204 no body in P4 local-only delete
```

P5 changes delete behavior for indexed/indexing sources to remote-delete-first async `202`. Do not build that in P4.

### A8. Public safe error codes?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Closed source/parser error catalog | Testable, UI-ready | Needs API-001 patch | `source_duplicate` |
| Reuse generic errors | Quick | Loses operator clarity | `conflict` |
| Raw exception messages | Debuggable locally | Forbidden | stack trace text |

Recommendation: patch API-001 with:

```text
domain_not_found
domain_state_conflict
source_not_found
source_duplicate
source_file_unsupported
source_file_too_large
source_state_conflict
source_operation_in_progress
parser_not_ready
parser_auth_failed
parser_unavailable
parser_malformed_response
source_preparation_invalid
```

All messages must be safe and bland. Put exact parser/provider detail only in private debugging if P8 later approves it.

## B. Parser / Private Integration Gates

### B1. Exact temporary `PreparedSource` DTO shared by Docling and Reducto adapters?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Internal PreparedSource model | One adapter target and validator | Needs spec note | `PreparedSource(blocks=[...])` |
| Adapter writes DB rows directly | Fewer objects | Duplicates validation/publish logic | Docling repository writes |
| Persist parser-native model first | Easier debug | Forbidden and leaky | Reducto response row |

Recommendation: add a PreparedSource contract note to F-004 spec.

```text
PreparedSource
  source_document_id
  parser_kind
  blocks[]
  images[]
  warnings[]

PreparedBlock
  source_order
  kind: text | table | figure
  canonical_markdown
  heading_level?
  page_start?
  page_end?
  section_path[]

PreparedImage
  source_order or temporary image_ref
  content_hash
  mime_type
  bytes/private temp handle
  alt_text?
  page_number?
```

PreparedSource is internal worker data, not an API DTO.

### B2. Which Docling/Reducto fields may be retained as canonical metadata?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Retain only safe structural metadata | Supports evidence and outline | Less debug detail | page, heading, section path |
| Retain parser IDs/bbox/provider metadata | Traceable to parser | Leaky and not needed for P4 | provider block id |
| Retain full native payload | Debuggable | Forbidden | Docling JSON |

Recommendation: retain only:

```text
heading_level
page_start, page_end
section_path
kind
source_order
safe warning codes/messages
alt_text for images when safe
```

Do not retain parser-native IDs, task IDs, URLs, provider metadata, bbox, raw parser response, raw error text, or parser config JSON.

### B3. How is `runtime_settings.active_parser_kind` frozen onto upload?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Copy active parser kind at upload | Matches F-004 and retry invariant | Later settings changes do not affect old source | `source.parser_kind = "docling"` |
| Resolve parser kind at worker run | Latest settings apply | Breaks retry/frozen-parser contract | changed to Reducto mid-queue |
| Let browser choose parser | Flexible | Violates backend authority | upload field `parserKind` |

Recommendation: upload service reads `runtime_settings.active_parser_kind` and stores it on `source_documents.parser_kind` in the source-create transaction. Retry uses the stored value.

Worker resolves credentials privately from the stored parser kind. Do not call synthesis/model resolver just to freeze parser kind.

### B4. Which parser errors are safe for operation DTOs?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Map to safe public codes | Operator friendly and private | Less detail | `parser_unavailable` |
| Return raw parser errors | Easy debugging | Forbidden | provider stack text |
| Hide all failures as generic | Safe | Poor operations UX | `source_prepare_failed` |

Recommendation: safe code plus bland message.

Examples:

```text
parser_not_ready              Parser is not configured.
parser_auth_failed            Parser authentication failed.
parser_unavailable            Parser is unavailable.
parser_malformed_response     Parser response could not be normalized.
source_file_unsupported       File type is not supported.
source_preparation_invalid    Prepared source did not pass validation.
```

### B5. Is Reducto configured only through P2 provider credential status?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Yes, use P2 `provider_configs.reducto` | Matches implemented P2 resolver | No custom endpoint/base URL | encrypted Reducto credential |
| Add parser profiles now | Flexible | Rejected pilot concept | `parser_profiles` |
| Store Reducto config on source | Reproducible | Secret/config duplication | source parser JSON |

Recommendation: yes. Reducto is configured only through P2 provider credential status and private resolver behavior.

## C. Worker / Concurrency / Idempotency Gates

### C1. One active prep operation per source, or broader domain-level serialization?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| One active preparation per source | Enough for correctness, parallel-friendly | Multiple sources can prepare in same domain | unique active op per source |
| One active preparation per domain | Simpler mental model | Over-serializes and delays admin workflows | domain queue |
| Global one-at-a-time worker only | Very simple | Schema cannot express future concurrency | process-level lock |

Recommendation: one active preparation operation per Source Document. The worker process may run single-threaded for pilot, but schema should not impose domain serialization.

### C2. Claim/lease timeout fields and retry behavior?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Lease fields on source prep operations | Matches P3 pattern and no queue infra | Needs stale lease tests | `lease_owner`, `lease_expires_at` |
| External queue visibility timeout | Mature | New infra forbidden | Redis/RQ |
| No leases | Minimal | Crash leaves work stuck | queued forever |

Recommendation: lease fields on `source_preparation_operations`.

Add settings:

```text
CE_SOURCE_PREP_WORKER_ID
CE_SOURCE_PREP_LEASE_SECONDS
```

Claim rule:

```text
status = queued
OR status = running AND lease_expires_at < now
```

Claim sets `running`, `lease_owner`, `lease_expires_at`, and `started_at`.

### C3. Cancel semantics before, during, and after publish?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Generation fence cancel | Handles stale workers cleanly | Publish already committed cannot be undone | increment generation |
| Best-effort status flip only | Simple | Stale worker can still publish | mark cancelled |
| Kill worker process | Direct | Unsafe and not portable | process signal |

Recommendation: cancel increments `source_documents.preparation_generation` and marks the active queued/running operation `cancelled` with `finished_at`.

Rules:

```text
queued: cancel marks operation cancelled.
running before publish: cancel increments generation; worker publish writes zero rows.
publish already committed: cancel returns 409 source_state_conflict.
deleting source/domain: cancel is part of delete fencing.
```

Worker must not overwrite a terminal cancelled operation after a generation mismatch.

### C4. All-or-none publish transaction boundary?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Parse outside transaction, publish in one DB transaction | Correct and resilient | Needs careful repository function | insert blocks/images + state update |
| Hold transaction during parser call | Simpler code | Violates global failure rule | DB tx around provider call |
| Insert blocks incrementally | Easy progress | Leaves partial canonical source | half-published blocks |

Recommendation:

```text
claim and commit
parse outside DB transaction
validate PreparedSource
publish in one DB transaction:
  require source.state = pending
  require source.preparation_generation = operation.generation_at_start
  insert all source_blocks
  insert all source_images
  set source.state = prepared
  set operation.status = succeeded
```

Any validation/publish failure leaves zero Source Blocks for that source and keeps source `pending`.

### C5. Does retry create a new operation only, or also increment `preparation_generation` first?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Increment generation, then enqueue new prepare op | Fences stale work and keeps source identity | Slightly more transaction logic | gen 2 retry |
| New operation only | Simple | Old worker can publish late | gen unchanged |
| New Source Document | Isolates retry | Violates F-004 retry invariant | duplicate source row |

Recommendation: retry increments `preparation_generation` in the same transaction that creates the new queued `prepare` operation. Retry is allowed only when no active operation exists and source is `pending`.

## D. Delete / Destructive-State Gates

### D1. Source delete success: `202` async or synchronous hard delete?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| P4 sync hard delete `204` | KISS, local-only, matches P5 handoff | P5 must extend behavior | local file/row cleanup |
| P4 async `202` delete operation | Future-proof | Adds operation not needed until indexing | delete operation row |
| Soft delete | Reversible | Conflicts with hard-delete acceptance | `deleted_at` |

Recommendation: P4 source delete is synchronous local hard delete with `204 No Content`.

When P5 adds indexed content, source delete becomes conditional:

```text
local-only source      -> 204
indexed/indexing source -> 202 remote-delete-first worker
```

### D2. Domain delete purge order once sources exist?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Purge P4 sources before final domain delete | Matches F-004 and prevents orphan files | Extends P3 worker | source purge hook |
| Rely on DB cascade only | Simple rows cleanup | Leaves files behind | domain row delete |
| Delete runtime first always | Existing P3 behavior | Source purge failure after runtime delete is awkward | controller first |

Recommendation: extend `DomainDeleteWorker` with a narrow P4 source purge hook before hard-deleting the domain row.

Preferred order:

```text
claim domain delete operation
verify domain fence
purge source rows/files for the domain
delete private runtime resources
hard-delete domain row
```

If source purge fails, domain remains `deleting` and delete operation records a safe failure. Retry can resume.

### D3. How are queued/running prep operations cancelled during source/domain delete?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Fence each source generation and mark active op cancelled | Blocks stale publish | Requires conditional updates | gen increment |
| Delete rows under running worker | Fast | Stale worker errors unpredictably | FK gone mid-run |
| Wait for active operations | Conservative | Delete can hang behind parser | long Reducto call |

Recommendation: source/domain delete sets source state `deleting`, increments source `preparation_generation`, marks queued/running prep operations `cancelled`, then removes blocks/images/files/rows.

Stale workers must treat missing source or generation mismatch as no-op.

### D4. P5/P7 future hooks for index delete and redaction?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Document deferred hooks only | Prevents overbuild | P5/P7 must patch later | implementation-log note |
| Build hook framework now | Future-friendly | YAGNI/generic framework risk | event bus |
| Ignore future delete impact | Fast | Causes later contract churn | no handoff note |

Recommendation: document deferred hooks only.

P4 should expose small service seams:

```text
purge_source_local(...)
purge_domain_sources_local(...)
```

Do not add remote LightRAG delete, query eligibility, or chat redaction code in P4.

## E. Storage / Private Data Gates

### E1. Private storage root setting name and per-domain/source layout?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Dedicated source storage root with derived paths | No DB path leakage, easy cleanup | Needs path helper tests | `.data/source-storage/...` |
| Store storage path in DB | Easy lookup | Leakage and migration risk | `storage_path` column |
| Reuse domain runtime root | Fewer settings | Couples source files to runtime lifecycle | runtime workspace |

Recommendation: add a private source storage root setting, not a DB path column.

Config:

```text
CE_SOURCE_STORAGE_ROOT
default: .data/source-storage
```

Derived layout:

```text
.data/source-storage/domains/{domain_id}/sources/{source_id}/original
.data/source-storage/domains/{domain_id}/sources/{source_id}/images/{image_id}
```

Path helper must enforce root confinement. API DTOs never expose this layout.

### E2. Original hash algorithm and duplicate index scope?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| SHA-256 bytes hash per domain | Strong, standard, matches AC-002 | Same file allowed across domains | `(domain_id, sha256)` |
| Filename duplicate | Simple | Wrong behavior | same name different content |
| Global duplicate hash | Saves storage | Cross-domain coupling | one upload for all domains |

Recommendation: SHA-256 over original bytes, unique within a Knowledge Domain.

Same hash in same domain returns `409 source_duplicate`. Same hash in a different domain is allowed.

### E3. Image file retention and Source Image row shape?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Private image files plus safe rows | Supports future evidence/assets without exposing paths | Needs cleanup tests | image id + mime |
| Inline image bytes in DB | Transactional | Bloats DB | bytea/blob |
| No image persistence in P4 | Simpler | Conflicts with `source_images` scope | figures discarded |

Recommendation: private image files plus safe `source_images` rows. Store `content_hash`, `mime_type`, optional `alt_text`, optional `page_number`, and derive private path from source/image ID.

### E4. Cleanup on upload transaction failure?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Temp file, DB flush, final move, commit, cleanup on exception | Strong enough, testable | Slightly careful code | delete temp/final on rollback |
| Commit DB then write file | Can leave DB row missing file | Bad recovery | row committed, write fails |
| Write final file only | Simple | Duplicate/DB failure leaves orphan | file before constraint |

Recommendation:

```text
validate domain/request before file write when possible
stream upload to temp file
compute sha256 and size
open DB transaction
insert source row and prepare operation
flush to catch duplicate constraint
move temp to deterministic final path
commit
on any failure: rollback DB, delete temp/final files
```

Add tests for duplicate upload and simulated DB failure after file write.

## F. Authz / Roles Gates

### F1. All `/admin/domains/{domain_id}/sources*` routes Administrator-only?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Administrator-only P4 source APIs | Matches roles and F-004 | Members wait for later safe viewer/evidence | `require_admin` |
| Authenticated read, admin write | Feels useful | Member source viewer is out of scope | member list sources |
| Per-source ACL now | Flexible | Deferred product policy | ACL table |

Recommendation: all P4 source routes are Administrator-only. Backend authorization is final; UI hiding controls is not security.

### F2. No member source viewer in P4?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| No member source viewer | Matches F-004 and source-ref stop condition | Less user-facing value until later | no `/sources` member route |
| Safe member metadata only | Tempting for UI | Creates source visibility policy early | member source list |
| Full member source route | Useful | Violates P4 scope and source privacy | source content page |

Recommendation: no member source viewer or member source route in P4.

### F3. Does Admin upload require domain running/available, or only not deleting?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Require domain exists and is not deleting | Keeps prep independent from LightRAG runtime | Admin can prepare while stopped | upload to stopped domain |
| Require running and available | Operationally intuitive | Pulls runtime availability into P4 | blocked stopped domain |
| Allow deleting domain | Never safe | Races destructive cleanup | upload during delete |

Recommendation: require domain exists and `domain.state != deleting`. Do not require running/available in P4.

Reason: source preparation is parser/storage work, not LightRAG runtime work. P5 indexing can require runtime readiness.

## G. Test / Evidence Gates

### G1. Parser adapter fixtures for Docling and Reducto to same shape?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Synthetic minimal fixtures into PreparedSource | Proves contract safely | Less realistic | fake Docling/Reducto payloads |
| Real documents/provider payloads | Realistic | Forbidden leakage risk | customer PDF text |
| Mock adapters only | Fast | Does not prove normalization shape | returns prepared directly |

Recommendation: use synthetic, non-sensitive parser fixture inputs and assert both adapters produce the same PreparedSource semantics. Do not snapshot real raw source text or provider payloads.

Tests:

```text
Docling fixture -> PreparedSource
Reducto fixture -> PreparedSource
same block ordering/kinds/metadata rules
validator rejects unsafe fields and invalid shapes
```

### G2. Safe DTO scan list for source APIs?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit forbidden-field/value scan | Catches regressions | Needs maintenance | scan response JSON |
| Trust DTO model names | Easy | Misses accidental leaks | no scan |
| Broad string denylist only | Simple | False positives possible | `path`, `secret` |

Recommendation: explicit scan on source API responses, operation DTOs, OpenAPI snapshot, and safe log fixtures.

Forbidden examples:

```text
secret, credential, ciphertext
path, storage, url, runtime, port, container
parserPayload, providerPayload, taskId, jobId
canonicalMarkdown, rawText, sourceText
stack, traceback
lightrag
```

### G3. Storage cleanup evidence for source and domain delete?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Integration tests inspect rows and private files | Proves AC-006 | More setup | assert file gone |
| Unit tests only | Fast | Misses DB/filesystem coupling | mocked storage |
| Manual checklist | Cheap | Weak evidence | reviewer note |

Recommendation: integration tests with temp storage root.

Evidence:

```text
upload writes original and stores hash/size
duplicate upload removes temp/final file
source delete removes source row, operations, blocks, images, original, image files
domain delete worker purges sources before final domain row removal
```

### G4. Proof no LightRAG call in P4?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Import/call audit plus injected test trap | Strong and simple | Needs test discipline | no LightRAG client import |
| Code review only | Cheap | Weak acceptance evidence | reviewer says ok |
| Stub LightRAG client in P4 | Visible | Encourages accidental calls | fake client |

Recommendation: automated proof:

```text
P4 source services/workers do not import LightRAG client modules.
P4 tests install a LightRAG-call trap if a client boundary exists.
Upload, prepare, retry, cancel, delete tests pass without any LightRAG dependency.
```

The existing P3 runtime-controller test can remain separate; P4 must not add LightRAG handoff behavior.

## Contract Patch Order For Junior Dev

```text
1. Patch DATA-001 with P4 table fields, constraints, and delete semantics.
2. Patch API-001 with P4 multipart upload, DTOs, success bodies, and error codes.
3. Patch F-004 spec with PreparedSource internal contract and validator rules.
4. Patch F-004 plan/test-plan with source storage, domain-delete handoff, safe DTO scans, and no-LightRAG proof.
5. Add migration/models only after contracts are updated.
6. Add service/repository/worker tests before route implementation.
7. Implement source upload, duplicate guard, private storage, parser adapters, validator, publish worker, retry/cancel/delete APIs.
8. Update acceptance, implementation log, OpenAPI snapshot, and feature register.
```

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| New `jobs`, `workflow`, Redis/RQ/Celery, event bus, or broad operation framework | P4 is one source-prep slice, not a platform rewrite. Generic infra hides ownership and violates KISS/YAGNI. | Use `source_preparation_operations` plus lease fields only. |
| `metadata` JSON used as product truth | Product state becomes untyped, unindexed, hard to test, and easy to leak. | Add typed contract fields or stop and patch DATA-001 first. |
| Public/logged `path`, URL, task ID, parser payload, provider payload, runtime, source text, stack trace, or credential | These expose private storage, parser/provider internals, secrets, or restricted data. | API/logs get safe IDs, safe counts, safe status, and bland error codes only. |
| `source_documents.state = failed` | Failure belongs to the preparation operation, not the Source Document lifecycle. | Source state is only `pending`, `prepared`, or `deleting`; put failure on `source_preparation_operations`. |
| Browser/member source route in P4 | Member source viewing and source-ref policy are out of scope and not yet contracted. | P4 source APIs are Administrator-only. No member source route. |
| Retry reads current `activeParserKind` | Settings changes would silently change old source behavior and break retry reproducibility. | Upload freezes `source_documents.parser_kind`; retry always uses that frozen value. |
| Parser call inside a long DB transaction | External parser latency can lock rows, block retries/cancels, and leave messy failure modes. | Claim and commit, parse outside the DB transaction, then publish in one short transaction. |
| Partial Source Blocks after validation or publish failure | P5/P6 evidence needs exact complete block sets. Half-published blocks poison indexing and citations. | Validate first; publish blocks/images all-or-none; failure leaves zero blocks and source `pending`. |
| P4 imports or calls LightRAG | Indexing, embeddings, retrieval, and query eligibility are P5/P6 work. | P4 ends at canonical Source Blocks. Add a no-LightRAG import/call test. |
| Domain delete hard-deletes domain row before source files are purged | DB cascade can remove rows while private files remain orphaned. | Domain delete must purge source rows/files before final domain hard delete. |

## Context And ADR Notes

No `CONTEXT.md` change is needed from this review: the domain terms are already present and correct.

No ADR is needed yet. The decisions are important, but they are phase contract choices already governed by F-004, API-001, DATA-001, and the constitution. If the team later chooses a surprising hard-to-reverse alternative, such as async P4 source delete or parser profiles, create an ADR then.
