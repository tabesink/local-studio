---
type: readiness
phase: P4
feature: F-004
status: active
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience:
  - agent
  - junior-dev
  - reviewer
lifecycle: planning
tags:
  - phase/p4
  - feature/f-004
  - type/readiness
  - status/active
---

# F-004 P4 Readiness

Source: `.devnotes/P3-post-impl-REVIEW/F-004-P4-readiness.md`

**Goal:** Administrators upload Source Documents into an existing Knowledge Domain. A worker prepares each upload into Context Engine-owned Canonical Source data and flat Source Blocks.

**Not in P4:** LightRAG calls, embeddings, retrieval, evidence, citations, chat, member source viewer, source downloads, source versioning, browser storage access, parser-native API output.

See [[F-004 P4 Table Schema]] for the four P4 tables, example rows, and lifecycle cheat sheet. Upload and storage: [[P4 Source Upload Flow]], [[P4 Image Storage Architecture]].

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

**Trust rule:** Browser receives only safe Source Document and operation DTOs. It never receives source originals, storage locations, parser-native payloads, provider request payloads, parser task URLs, runtime URLs, stack traces, credentials, or raw LightRAG output.

---

## Product Terms

| Term | Meaning |
| --- | --- |
| Source Document | Administrator-uploaded file owned by one Knowledge Domain |
| Canonical Source | Context Engine-owned normalized representation before LightRAG handoff |
| Source Block | Stable citable unit for P5/P6/P7 evidence mapping; P4 creates identity and canonical content |

Do not rename Source Block to **chunk** in greenfield code or contracts.

---

## Build Order

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

P3 hard delete currently removes the domain after runtime cleanup. P4 must extend domain delete so Source Documents are purged before the domain row disappears.

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

## P3 Dependency Gate

P3 implemented: `domains`, `domain_operations`, admin/member domain routes, computed availability, domain delete worker, passing acceptance.

P4 must not regress P3:

| Risk | Gate |
| --- | --- |
| Upload into deleting domain | reject before file write or clean up file on rollback |
| Domain delete with sources | purge source rows/files before final domain delete |
| Member source leakage | no member source routes in P4 |
| Runtime leakage | source DTOs never reveal domain runtime internals |

---

## Blockers Before Coding

### Contract / data / API (A1–A8)

Patch DATA-001 for table fields (A1–A3), API-001 for DTOs and error codes (A4–A8). See [[F-004 P4 Table Schema]] for proposed column sketch from ID-A.

### Parser / worker / delete / storage / authz / tests (B–G)

Key decisions: PreparedSource DTO shape, one active prep op per source, generation fencing, all-or-none publish, source delete sync vs async, domain purge order, no LightRAG in P4.

Full blocker tables live in `.devnotes/P3-post-impl-REVIEW/F-004-P4-readiness.md` and `.devnotes/P3-post-impl-REVIEW/ID-A.md`.

---

## Acceptance Criteria

| AC | Plain English |
| --- | --- |
| AC-001 | upload stores immutable original |
| AC-002 | same file hash in same domain rejected |
| AC-003 | Docling and Reducto return same PreparedSource shape |
| AC-004 | failed parse leaves source pending with failed operation |
| AC-005 | retry keeps same frozen parser kind |
| AC-006 | source/domain delete removes rows/files |
| AC-007 | no LightRAG call |

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

## Reference Comparison (Old vs Greenfield)

| Question | Old reference | Greenfield delta |
| --- | --- | --- |
| Source root table | `documents` + path + JSON metadata | `source_documents`; no public path |
| Canonical units | sections, blocks, chunks, assets | flat `source_blocks` + `source_images` |
| Operation model | generic `jobs`, RQ/Redis | `source_preparation_operations` |
| Parser output | `DocumentStructure` + parser job id | PreparedSource → Source Blocks only |
| API routes | member `/documents/*` | P4 admin-only; no member viewer |
| LightRAG | upload → ingestion | P4 stops before LightRAG |
| Delete | domain purge + runtime | P4 source purge hook; P5 remote index delete |

Old code is useful for parser normalization ideas and failure modes. It is not a contract.

---

## One-Line Summary

P4 is blocked until Source Document data/API/PreparedSource shapes are patched into active contracts; then implement upload → private prep worker → all-or-none Source Blocks, with no LightRAG and no private data leakage.

---

## Related

- [[F-004 P4 Table Schema]]
- [[P4 Source Upload Flow]]
- [[P4 Private Storage Rules]]
- [[P4 Image Storage Architecture]]
- [[P5 LightRAG Text Indexing]]
- [[P6 Evidence And Asset Delivery]]
- [[Context Engine Index]]
