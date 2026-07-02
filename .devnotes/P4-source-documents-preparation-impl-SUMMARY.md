# Phase 4 (P4) - Source Documents And Canonical Preparation

**Feature:** `F-004`  
**One-liner:** Administrators upload Source Documents into a Knowledge Domain; the backend prepares them into Context Engine-owned Source Blocks for later indexing and evidence.

P3 gave us Knowledge Domain lifecycle and private runtime ownership. P4 adds the Sources layer: private originals, source preparation operations, parser normalization, canonical Source Blocks, and source cleanup.

Important status note: this is a junior-dev implementation handoff, not proof that P4 is implemented. Active specs still mark F-004 as approved/not implemented.

---

## What P4 Builds

| Piece | Purpose |
| --- | --- |
| `source_documents` | Source Document identity, domain ownership, immutable hash, state, frozen parser kind |
| `source_preparation_operations` | queued/running/succeeded/failed/cancelled preparation attempts, leases, safe errors |
| `source_blocks` | stable Context Engine Source Block IDs and canonical Markdown |
| `source_images` | private image metadata linked to figure/table Source Blocks |
| Admin source API | safe upload/list/detail/outline/operation/retry/cancel/delete routes |
| Parser adapters | Docling/Reducto -> one internal `PreparedSource` shape |
| Source prep worker | claim, parse, validate, publish all-or-none with generation fencing |
| Storage cleanup | private originals/images removed on source and domain delete |

---

## Mental Model

```text
Administrator
  -> FastAPI admin source routes
       -> safe DTOs only
       -> Postgres
            source_documents
            source_preparation_operations
            source_blocks
            source_images
       -> private source storage

Worker
  -> claims source_preparation_operations
  -> reads original privately
  -> Docling or Reducto adapter
  -> PreparedSource (internal only)
  -> validator
  -> one publish transaction
       source_blocks + source_images
       source.state = prepared
       operation.status = succeeded

No LightRAG call in P4.
```

The browser sees lifecycle metadata. It does not see originals, storage paths, parser-native payloads, parser task URLs, raw source text, runtime URLs, provider payloads, stack traces, credentials, or raw LightRAG output.

---

## Main Flow

```text
POST /admin/domains/{domain_id}/sources
  require Administrator
  require domain exists and is not deleting
  freeze runtime_settings.active_parser_kind onto source_documents.parser_kind
  store original privately
  compute SHA-256 and size
  reject same hash in same Knowledge Domain
  create source_documents(state=pending)
  create source_preparation_operations(status=queued)
  return { source, operation }

worker claim
  queued/stale op -> running + lease
  parse outside DB transaction
  validate PreparedSource
  publish blocks/images all-or-none if generation still matches

retry
  same Source Document
  same frozen parser_kind
  increment preparation_generation
  enqueue new prepare op

cancel/delete
  increment generation
  cancel queued/running prep
  stale worker publish writes zero rows
```

P4 source delete is local-only. P5 owns remote LightRAG index delete and query eligibility.

---

## Security And Ownership Boundaries

Memorize these:

| Sensitive concern | Backend owner | Rule |
| --- | --- | --- |
| Source originals and image files | source storage/service | private storage only; no browser path or download in P4 |
| Parser credentials | `TrustedRuntimeResolver` + worker | resolve server-side only |
| Parser request/response, task ids, URLs | parser adapters | normalize then discard; never persist/expose |
| Source Block content | source preparation worker/repository | stored as restricted data; not returned in P4 DTOs |
| Operation failures | source service/worker | safe `error_code` and bland `error_message` only |
| Domain delete with sources | domain delete worker + source purge hook | purge source rows/files before final domain hard delete |

Backend authz is final. All `/admin/domains/{domain_id}/sources*` routes are Administrator-only.

---

## Core Worker Rule

The central abstraction is the source preparation worker.

It exists to keep parser execution, retries, cancellation, and canonical publish out of API routes.

It owns:

- operation claim/lease;
- frozen `parser_kind` selection;
- safe parser error mapping;
- `PreparedSource` validation;
- `preparation_generation` stale-work fencing;
- all-or-none Source Block/Image publish.

It deliberately does not own:

- LightRAG indexing;
- evidence mapping;
- chat/citations/redaction;
- generic queue infrastructure;
- source viewer/download behavior;
- parser-native payload persistence.

Later phases should consume `source_documents` and `source_blocks`; they should not reparse originals or invent chunk identities.

---

## Key Files

| File | What |
| --- | --- |
| `specs/04-features/F-004-source-documents-preparation/spec.md` | F-004 scope, acceptance, non-goals |
| `specs/04-features/F-004-source-documents-preparation/plan.md` | required task order and rollback/test concerns |
| `specs/04-features/F-004-source-documents-preparation/test-plan.md` | acceptance proof checklist |
| `specs/03-contracts/data/context-engine-data.md` | must be patched with field-level P4 tables before code |
| `specs/03-contracts/api/context-engine-v1.md` | must be patched with P4 DTOs, multipart upload, errors |
| `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md` | reviewed design gates and accepted lean shape |
| `.devnotes/P3-post-impl-REVIEW/ID-A*.md` | focused junior explainers for tables, DTOs, worker, parser, delete/storage |
| `context_engine/services/runtime_config.py` | active parser kind and private Reducto credential resolution precedent |
| `context_engine/services/domains.py` | P3 domain lifecycle/delete worker to extend with source purge |
| `tests/test_domains.py` | P3 regression surface for domain delete handoff |

---

## What P4 Deliberately Does Not Build

- No LightRAG calls.
- No embeddings, indexing, retrieval, Evidence, Citations, or chat.
- No member source viewer, source download, or source navigation.
- No source replace/version UI.
- No parser profiles or browser parser selection.
- No Redis, RQ, Celery, generic `jobs` table, event bus, or workflow engine.
- No old `SourceChunk`, persisted document tree, parser-native payload, path, URL, task id, or provider metadata as product truth.

---

## How P4 Connects Forward

```text
P3 domains/runtime
  -> P4 source_documents + source_blocks
      -> P5 LightRAG indexing + query eligibility
          -> P6 Evidence retrieval
              -> P7 grounded chat + redaction
```

P5 consumes:

- Source Documents whose preparation succeeded;
- Source Blocks as the exact canonical units to render into LightRAG input;
- source delete fences and local purge helpers;
- tests proving no stale/cancelled worker can publish late.

Block P4 implementation until:

- DATA-001 defines exact P4 columns, constraints, indexes, and delete semantics;
- API-001 defines upload request parts, safe DTOs, success bodies, and source/parser error codes;
- F-004 captures the internal `PreparedSource` contract and validator rules;
- test-plan.md names safe DTO scans, storage cleanup, and no-LightRAG proof.

---

## Junior Dev Checklist

1. Patch contracts first: DATA-001, API-001, then F-004 spec/plan/test-plan.
2. Use product words: Source Document, Canonical Source, Source Block. Do not write `chunk` in public contracts.
3. Freeze `parser_kind` at upload. Retry never reads the current global parser setting.
4. Keep parser calls in the worker and outside DB transactions.
5. Use `preparation_generation` for retry, cancel, delete, and stale publish protection.
6. Return only safe lifecycle DTOs. No paths, URLs, parser payloads, source text, stack traces, secrets, or LightRAG data.
7. Extend domain delete with a narrow source purge hook; do not add a generic workflow system.
8. Add/run source tests before claiming done: `.venv/bin/python -m pytest tests/test_sources.py tests/test_domains.py tests/test_runtime_config.py`.

---

**Status:** F-004 is approved but not implemented as of 2026-07-02. `acceptance.md` says all AC-001 through AC-007 are pending/planned, and `feature-register.md` lists F-004 as approved. The P4 review notes are design evidence only; patch active specs/contracts before coding.
