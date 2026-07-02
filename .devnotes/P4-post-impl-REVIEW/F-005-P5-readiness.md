# F-005 / P5 - LightRAG Indexing And Query Eligibility

Goal: Submit prepared Source Documents to private LightRAG runtimes and mark them query-eligible only after native readiness proof preserves exact Source Block identity.

Not in P5: retrieval UI, Evidence cards, chat, local vector fallback, custom graph processing, second index worker, index history table, status mirror table, auto retry/repair, embedding migration, browser LightRAG access, runtime env/config files, live parser SDK wiring.

---

## Big Picture

```text
P4 prepared Source Document
  |
  +-- source_documents(state=prepared)
  +-- source_blocks(order, kind, canonical_markdown, page, section)
  |
  v
P5 index worker
  |
  +-- render_lightrag_input(source) with CE_SOURCE + CE_BLOCK markers
  +-- private LightRAG client submit/readiness/delete
  +-- generation/request-id fences
  |
  v
source_documents.index_* fields
  |
  v
source_is_query_eligible(source, domain)

Browser never talks to LightRAG.
```

Trust rule: LightRAG endpoint details, provider/parser credentials, rendered source content, raw LightRAG payloads, stack traces, storage locations, and runtime internals stay server-side.

---

## What "Source Index" Means Here

Source Index is not a table. DATA-001 says index state belongs on `source_documents`.

P5 turns Context Engine-owned Source Blocks into deterministic marker text, submits that text to the private runtime, proves native readiness, and records only safe lifecycle fields on the Source Document.

Evidence is still not in P5. P6 maps retrieval hits back by exact `CE_BLOCK` identity and calls `source_is_query_eligible()`.

---

## Build Order From `tasks.md`

```text
T-000  read AGENTS, CONTEXT, contracts, and F-005
T-001  build pinned LightRAG proof fixture; stop if it fails
T-010  patch DATA-001/API-001, then add index fields + migration
T-020  implement deterministic render_lightrag_input() + hash
T-030  implement private LightRAG client submit/readiness/delete
T-040  implement worker transitions and retry/cancel APIs
T-050  implement source_is_query_eligible()
T-900  run test-plan.md
T-910  update acceptance, implementation log, traceability
```

Do not start business code before T-001 passes and API-001/DATA-001 have field-level P5 shape.

---

## Lifecycle Flows

### Queue After P4 Publish

```text
publish_prepared_source(...)
  -> validate PreparedSource
  -> insert Source Blocks/Images
  -> source.state = prepared
  -> source.index_state = queued
  -> source.index_generation increments
  -> commit one DB unit
```

AC-001 requires queueing index in the same DB transaction as P4 publish. P4 currently stops at `prepared`; P5 must extend that boundary.

### Submit And Ready

```text
worker claims queued source
  -> render deterministic text from source_blocks
  -> submit to private LightRAG with stable request id
  -> mark accepted/submitting with safe metadata
  -> poll/read native status
  -> ready only when generation/request id still match
```

Ready is a state transition owned by backend code, not by browser polling.

### Retry

```text
POST /admin/domains/{domain_id}/sources/{source_id}/index/retry
  -> require Administrator
  -> require prepared Source Document
  -> prove old remote content absent or delete it first
  -> increment index_generation
  -> new idempotent request id
  -> state = queued
```

### Cancel

```text
POST /admin/domains/{domain_id}/sources/{source_id}/index/cancel
  -> increment index_generation
  -> fence late submit/ready
  -> delete remote content when accepted/ready
  -> state = cancelled
```

### Source And Domain Delete

```text
source/domain delete
  -> fence source as deleting
  -> remote LightRAG delete when indexed or accepted
  -> only then remove local Source Blocks/files/row
```

P4 delete was local-only. P5 owns the remote delete-before-local rule for indexed content.

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| API route | authz, retry/cancel DTOs, safe errors | LightRAG URLs, raw payloads, runtime controls |
| Source service | index state transitions, generation fences | retrieval, Evidence, chat |
| Index worker | claim, render, submit, readiness, delete | generic job platform |
| LightRAG client | one private runtime contract | public DTOs, product state truth |
| Renderer | deterministic text/hash from Source Blocks | persisted rendered entity |
| Query eligibility helper | one predicate for P6/P7 | frontend logic copy |

---

## Dependency Gate From P4

| Gate | Evidence |
| --- | --- |
| F-004 implemented | `specs/04-features/F-004-source-documents-preparation/acceptance.md` |
| Source tables exist | `migrations/versions/20260702_0004_source_documents_preparation.py` |
| Source Blocks are canonical | `context_engine/models.py`, `SourceBlock` |
| Worker publishes all-or-none | `context_engine/services/sources.py`, `publish_prepared_source()` |
| No LightRAG in P4 | `test_p4_source_services_do_not_import_or_call_lightrag` |
| Parser normalizers proven with fixtures | `test_docling_and_reducto_fixtures_normalize_to_same_prepared_source_shape` |

Important: live Docling/Reducto SDK calls are not a P4 closure gap. They are a pilot-prep gap and should get an explicit follow-up slice before P8/Staging.

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner patch |
| --- | --- | --- |
| A1 | Exact `source_documents.index_*` fields, defaults, constraints, and generation semantics? | DATA-001 |
| A2 | Exact source summary fields for index state/error/readiness? | API-001 |
| A3 | `index/retry` and `index/cancel` success bodies and safe error codes? | API-001 |
| A4 | Does source delete remain `204`, or become async when remote delete is required? | API-001 + F-005 spec |
| A5 | Deterministic render schema version and hash field names? | DATA-001 + F-005 spec |

### B. Runtime/private integration blockers

| # | Question | Owner patch |
| --- | --- | --- |
| B1 | Which pinned LightRAG version/fixture proves the contract? | F-005 test fixture |
| B2 | Which private client method submits text and returns request/readiness identity? | F-005 plan/implementation log |
| B3 | How is typed embedding/provider credential injection proven without exposing values? | F-005 fixture + QA-002 |
| B4 | What is the remote delete primitive and how is absence verified? | F-005 fixture |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner patch |
| --- | --- | --- |
| C1 | Claim fields live on `source_documents` or a narrow helper table? | DATA-001 |
| C2 | How is idempotent request id generated from source id/generation/hash? | DATA-001 + tests |
| C3 | Which states are active for retry/cancel conflict checks? | DATA-001 |
| C4 | How does timeout reconcile without duplicate remote content? | F-005 tests |

### D. Delete/destructive-state blockers

| # | Question | Owner patch |
| --- | --- | --- |
| D1 | Source delete sequence when index state is accepted/ready? | API-001 + F-005 tests |
| D2 | Domain delete sequence across many indexed sources? | F-005 plan/test-plan |
| D3 | Late ready after cancel/delete writes zero rows? | worker tests |

### E. Storage/private data blockers

| # | Question | Owner patch |
| --- | --- | --- |
| E1 | Rendered LightRAG input is never persisted; where is only the hash stored? | DATA-001 |
| E2 | How are Source Block contents kept out of logs/snapshots? | QA-002 + tests |

### F. Authz/roles blockers

| # | Question | Owner patch |
| --- | --- | --- |
| F1 | Index retry/cancel Administrator-only? | API-001 + route tests |
| F2 | Member query path calls eligibility later, never index routes? | F-006/F-007 tests |

### G. Test/evidence blockers

| # | Question | Owner patch |
| --- | --- | --- |
| G1 | T-001 pinned fixture proves health, secret injection, submit, readiness, delete, `CE_BLOCK` preservation? | F-005 acceptance |
| G2 | Golden render tests prove deterministic text/hash? | F-005 tests |
| G3 | OpenAPI snapshot captures P5 retry/cancel and source summary fields? | tests/snapshots |
| G4 | Safe DTO/log scan covers index fields and LightRAG failures? | F-005 test-plan |

---

## Acceptance Criteria As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | P4 publish queues index in the same DB transaction. |
| AC-002 | Native ready transitions the source index to ready. |
| AC-003 | Native failure records only safe index error details. |
| AC-004 | Retry uses a new generation only after old remote content is absent. |
| AC-005 | Cancel/delete fences late ready. |
| AC-006 | Source/domain delete clears remote index before local row deletion. |
| AC-007 | Timeout/retry does not duplicate remote content. |

---

## What Junior Dev Should Read

1. `AGENTS.md`
2. `CONTEXT.md`
3. `specs/04-features/F-004-source-documents-preparation/acceptance.md`
4. `specs/04-features/F-005-lightrag-indexing-eligibility/`
5. `specs/03-contracts/data/context-engine-data.md`
6. `specs/03-contracts/api/context-engine-v1.md`
7. `specs/03-contracts/ai/grounded-answering.md`
8. `specs/02-architecture/integration-flows.md`
9. `specs/05-quality/security-and-privacy.md`
10. `context_engine/services/sources.py`
11. `.devnotes/P4-parser-output-to-lightrag-data-shape-guide.md`

---

## Practical Start Checklist

- Patch API-001/DATA-001 with P5 field-level shape before code.
- Write the pinned LightRAG proof fixture first.
- Add migration fields to `source_documents`; do not create an index history table.
- Add golden tests for `render_lightrag_input()`.
- Extend `publish_prepared_source()` to queue index atomically.
- Add private LightRAG client behind a testable interface.
- Add worker stale-generation tests for retry, cancel, delete, timeout, and late ready.
- Update acceptance, implementation log, OpenAPI snapshot, and feature register.

---

## Reference Comparison

| Question | Reference answer | Greenfield delta |
| --- | --- | --- |
| How was LightRAG submit done? | Old code used remote adapter methods such as document upload/chunk ingestion and track status. | P5 must prove one pinned runtime contract first; no old route is copied blindly. |
| How were chunks represented? | Old code used `SourceChunk` and chunk metadata. | Greenfield Source Blocks are product truth; P5 renders `CE_BLOCK` markers. |
| How was concurrency handled? | Old code used Redis locks and broader pipeline status. | Greenfield uses source-owned DB fields/fences; no Redis/job platform unless spec changes. |
| How were parser calls handled? | Old ingestion combined parse, structure finalization, and LightRAG submit. | P4 already separated preparation from indexing. P5 must not reparse originals. |
| How were errors exposed? | Reference code often surfaced upstream messages. | Greenfield returns safe codes/messages only. |

Verdict for junior dev: Use references to ask better fixture questions. Implement active P5 contracts, not the old ingestion pipeline.

---

## One-line Summary

P5 is not "call LightRAG after upload"; it is a contract proof, deterministic Source Block render, fenced indexing state machine, remote delete guarantee, and one eligibility predicate.
