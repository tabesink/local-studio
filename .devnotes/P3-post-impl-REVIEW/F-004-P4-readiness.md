# F-004 / P4 - Source Documents And Canonical Preparation

Goal: Administrators upload Source Documents into an existing Knowledge Domain. A worker prepares each upload into Context Engine-owned Canonical Source data and flat Source Blocks.

Not in P4: LightRAG calls, embeddings, retrieval, evidence, citations, chat, member source viewer, source downloads, source versioning, browser storage access, parser-native API output.

---

## Big Picture

```text
Admin API
  |
  |  multipart upload, safe DTOs
  v
Postgres + private storage
  |
  +-- source_documents
  +-- source_preparation_operations
  +-- source_blocks
  +-- source_images
  |
  v
Worker
  |
  +-- TrustedRuntimeResolver -> active parser kind and private credential
  +-- Docling adapter
  +-- Reducto adapter
  +-- Canonical validator
  |
  v
all-or-none publish of Source Blocks

No LightRAG call in P4.
```

Trust rule: Browser receives only safe Source Document and operation DTOs. It never receives source originals, storage locations, parser-native payloads, provider request payloads, parser task URLs, runtime URLs, stack traces, credentials, or raw LightRAG output.

---

## Product Terms

Source Document means the administrator-uploaded file owned by one Knowledge Domain.

Canonical Source means the Context Engine-owned normalized representation produced from that file before LightRAG handoff.

Source Block means the stable citable unit P5/P6/P7 will use for exact evidence mapping. P4 creates Source Block identity and canonical content. P5 owns LightRAG rendering and `CE_BLOCK` proof.

Do not rename Source Block to chunk in greenfield code or contracts.

---

## Build Order From `tasks.md`

```text
T-010  source/preparation/block/image migrations
T-020  upload, original storage, hash duplicate guard
T-030  Docling and Reducto adapters to one PreparedSource shape
T-040  validator and all-or-none publish worker
T-050  retry, cancel, delete, source list/detail/outline APIs
T-900  run test-plan.md
T-910  update acceptance, implementation log, traceability
```

Do not start T-010 until API-001 and DATA-001 contain P4 field-level shapes.

---

## Lifecycle Flows

### Upload

```text
POST /admin/domains/{domain_id}/sources
  -> require Administrator
  -> require domain exists and is not deleting
  -> freeze current parser_kind on Source Document
  -> store immutable original privately
  -> compute original file hash
  -> reject same hash in same Knowledge Domain
  -> create source_documents row: state=pending
  -> enqueue source_preparation_operations row
  -> return safe Source Document + operation DTO
```

Open contract gap: request parts, max size, supported content types, source id format, duplicate error code, and response DTO are not defined in API-001 yet.

### Prepare

```text
Worker claims source_preparation_operations row
  -> resolve frozen parser_kind privately
  -> parse with Docling or Reducto
  -> normalize to PreparedSource
  -> validate blocks/images
  -> publish source_blocks and source_images in one DB unit
  -> mark source prepared and operation succeeded
```

If parse or validation fails: Source Document remains `pending`, operation becomes `failed`, and safe error fields live on the operation.

### Retry

```text
POST /admin/domains/{domain_id}/sources/{source_id}/retry
  -> keep same Source Document
  -> keep same frozen parser_kind
  -> increment preparation_generation
  -> enqueue new preparation operation
```

### Cancel

```text
POST /admin/domains/{domain_id}/sources/{source_id}/cancel
  -> cancel queued/running preparation when not already publishing
  -> stale worker publish must affect zero rows
```

### Source Delete

```text
DELETE /admin/domains/{domain_id}/sources/{source_id}
  -> fence source as deleting
  -> cancel active prep operation if possible
  -> delete source_blocks, source_images, operation rows, private files
  -> hard-delete source row
```

P4 delete has no LightRAG remote delete. P5 adds remote index delete and query eligibility.

### Domain Delete Handoff

P3 hard delete currently removes the domain after runtime cleanup. P4 must extend domain delete so Source Documents are purged before the domain row disappears. This is a cross-feature handoff, not a generic purge framework.

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| API route | authz, strict DTOs, safe errors, upload body validation | parser execution, storage paths in response |
| Source service | source state rules, duplicate guard, operation creation | LightRAG indexing |
| Worker | lease/claim/retry/cancel, parser call, all-or-none publish | generic job platform |
| Parser adapters | Docling/Reducto to PreparedSource only | public DTOs, raw payload persistence |
| Repository | table writes and conditional fences | business rules outside helpers |
| Storage | immutable original and private image files | browser direct download in P4 |

---

## Dependency Gate From P3

P3 implemented:

| Gate | Evidence |
| --- | --- |
| `domains` and `domain_operations` exist | `migrations/versions/20260630_0003_knowledge_domains_runtime.py` |
| Admin/member domain routes exist | `context_engine/api/routes.py` |
| Domain availability is computed | `context_engine/services/domains.py` |
| Domain delete worker hard-deletes rows | `DomainDeleteWorker` |
| P3 acceptance is passing | `specs/04-features/F-003-knowledge-domains-runtime/acceptance.md` |

P4 must not regress P3:

| Risk | Gate |
| --- | --- |
| Upload into deleting domain | reject before file write or clean up file on rollback |
| Domain delete with sources | purge source rows/files before final domain delete |
| Member source leakage | no member source routes in P4 |
| Runtime leakage | source DTOs never reveal domain runtime internals |

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner patch |
| --- | --- | --- |
| A1 | Exact `source_documents` fields, indexes, delete behavior, and duplicate-hash constraint? | DATA-001 |
| A2 | Exact `source_preparation_operations` fields, statuses, lease fields, generation fence, safe error fields? | DATA-001 |
| A3 | Exact `source_blocks` and `source_images` fields? | DATA-001 |
| A4 | Source id format: UUID, slug, or opaque string? | API-001 + DATA-001 |
| A5 | Upload request shape: multipart names, optional display filename, max size, content-type rules? | API-001 |
| A6 | Source list/detail/outline/operations DTOs? | API-001 |
| A7 | Retry/cancel/delete success bodies and error codes? | API-001 |
| A8 | Public safe error codes for duplicate hash, parser failure, active operation, wrong state, domain not found? | API-001 |

### B. Parser/private integration blockers

| # | Question | Owner patch |
| --- | --- | --- |
| B1 | Exact temporary `PreparedSource` DTO shared by Docling and Reducto adapters? | F-004 spec or DATA-001 addendum |
| B2 | Which fields from Docling/Reducto may be retained as canonical metadata? | DATA-001 |
| B3 | How is `runtime_settings.active_parser_kind` frozen onto upload? | DATA-001 + service plan |
| B4 | Which parser errors are safe for operation DTOs? | API-001 |
| B5 | Is Reducto configured only through P2 provider credential status? | API-001/P2 contract |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner patch |
| --- | --- | --- |
| C1 | One active prep operation per source, or broader domain-level serialization? | DATA-001 |
| C2 | Claim/lease timeout fields and retry behavior? | DATA-001 |
| C3 | Cancel semantics before, during, and after publish? | DATA-001 + test-plan.md |
| C4 | All-or-none publish transaction boundary? | F-004 plan |
| C5 | Does retry create a new operation only, or also increment `preparation_generation` first? | DATA-001 |

### D. Delete/destructive-state blockers

| # | Question | Owner patch |
| --- | --- | --- |
| D1 | Source delete success: `202` async or synchronous hard delete? | API-001 |
| D2 | Domain delete purge order once sources exist? | DATA-001 + F-003/F-004 implementation-log |
| D3 | How are queued/running prep operations cancelled during source/domain delete? | DATA-001 |
| D4 | P5/P7 future hooks for index delete and redaction? | note as deferred, no P4 implementation |

### E. Storage/private data blockers

| # | Question | Owner patch |
| --- | --- | --- |
| E1 | Private storage root setting name and per-domain/source layout? | architecture/config note |
| E2 | Original hash algorithm and duplicate index scope? | DATA-001 |
| E3 | Image file retention and Source Image row shape? | DATA-001 |
| E4 | Cleanup on upload transaction failure? | F-004 plan/test-plan |

### F. Authz/roles blockers

| # | Question | Owner patch |
| --- | --- | --- |
| F1 | All `/admin/domains/{domain_id}/sources*` routes Administrator-only? | API-001 |
| F2 | No member source viewer in P4? | F-004 spec already says out of scope |
| F3 | Does Admin upload require domain running/available, or only not deleting? | API-001 open decision |

### G. Test/evidence blockers

| # | Question | Owner patch |
| --- | --- | --- |
| G1 | Parser adapter fixtures for Docling and Reducto to same shape? | tests + fixtures |
| G2 | Safe DTO scan list for source APIs? | test-plan.md |
| G3 | Storage cleanup evidence for source and domain delete? | test-plan.md |
| G4 | Proof no LightRAG call in P4? | tests |

---

## Acceptance Criteria As Definition Of Done

| AC | Plain English | Evidence required |
| --- | --- | --- |
| AC-001 | upload stores immutable original | upload + storage cleanup test |
| AC-002 | same file hash in same domain rejected | DB/API duplicate test |
| AC-003 | Docling and Reducto return same PreparedSource shape | adapter fixture tests |
| AC-004 | failed parse leaves source pending with failed operation | worker failure test |
| AC-005 | retry keeps same frozen parser kind | retry test |
| AC-006 | source/domain delete removes rows/files | delete integration test |
| AC-007 | no LightRAG call | mock/assert no LightRAG client invocation |

---

## Junior Dev Reading Order

```text
AGENTS.md
README.md
specs/00-governance/constitution.md
CONTEXT.md
specs/04-features/F-003-knowledge-domains-runtime/
specs/04-features/F-004-source-documents-preparation/
specs/03-contracts/api/context-engine-v1.md
specs/03-contracts/data/context-engine-data.md
specs/02-architecture/system-context.md
specs/02-architecture/component-boundaries.md
specs/02-architecture/integration-flows.md
specs/05-quality/security-and-privacy.md
context_engine/services/domains.py
context_engine/services/runtime_config.py
tests/test_domains.py
.references/code/context_engine/app/document_processing/    # evidence only
.references/code/context_engine/app/services/document_service.py # evidence only
```

---

## Practical Start Checklist

```text
[ ] Patch DATA-001 P4 table fields.
[ ] Patch API-001 P4 DTOs and error codes.
[ ] Add PreparedSource adapter contract.
[ ] Decide upload eligibility for stopped vs running domains.
[ ] Decide source delete sync vs async behavior.
[ ] Add migration T-010.
[ ] Add tests before service implementation.
[ ] Prove no LightRAG calls in P4.
```

---

## Reference Comparison

| Question | Old reference answer | Greenfield delta |
| --- | --- | --- |
| Source root table | `documents` with status, storage path, JSON metadata, LightRAG domain id | Use `source_documents`; no public path; no generic metadata as product truth |
| Canonical units | `document_sections`, `document_blocks`, `document_source_chunks`, `document_assets` | P4 says flat `source_blocks` and `source_images`; no persisted tree or SourceChunk API |
| Operation model | generic `jobs`, RQ/Redis queue, operation stages | Use `source_preparation_operations`; no Redis/RQ/Celery/workflow engine |
| Parser output | Docling/Reducto normalized to `DocumentStructure` with parser job id/metadata | Normalize to PreparedSource, then publish Context Engine-owned Source Blocks only |
| API routes | member-readable `/documents/*`, chunks, assets, pages, previews | P4 admin-only source APIs; no member viewer/download |
| LightRAG | old upload moves directly toward LightRAG ingestion | P4 stops before LightRAG |
| Delete | domain purge deletes documents, artifacts, jobs, then runtime | P4 adds source purge hook; P5 owns remote indexed delete |

Old code is useful for parser normalization ideas, asset cleanup tests, and failure modes. It is not a contract.

---

## One-Line Summary

P4 is blocked until Source Document data/API/PreparedSource shapes are patched into active contracts; then implement upload -> private prep worker -> all-or-none Source Blocks, with no LightRAG and no private data leakage.
