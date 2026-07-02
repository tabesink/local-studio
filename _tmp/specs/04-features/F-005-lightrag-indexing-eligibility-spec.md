---
id: F-005
title: LightRAG Indexing And Query Eligibility Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - LightRAG Indexing And Query Eligibility

Phase: P5

## Outcome

Submit prepared Source Documents to private LightRAG runtimes and mark them query-eligible only after native readiness proof.

## Why Now

Evidence and chat are unsafe unless LightRAG handoff, readiness, delete, and exact block identity preservation are proven.

## Actors

Worker, private LightRAG runtime, Administrators retrying/cancelling index operations.

## In Scope

- Pinned LightRAG contract fixture before business code.
- Typed provider-secret injection proof.
- `source_documents.index_*` fields.
- Deterministic `render_lightrag_input()` with `CE_SOURCE` and `CE_BLOCK` markers.
- One concrete private LightRAG client.
- Worker submit/readiness/delete paths.
- Idempotent index request ID.
- Manual retry/cancel/delete fencing.
- One `source_is_query_eligible(source, domain)` predicate.

## Out Of Scope

- retrieval UI
- evidence cards
- chat
- local embeddings/vector/BM25
- custom graph processing
- second index worker
- status mirror table
- index history table
- auto retry/repair
- embedding migration
- browser LightRAG access
- runtime env/config files
- live parser SDK wiring

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Stop if pinned LightRAG cannot prove health, secret injection, idempotent submit, readiness, deletion, `CE_BLOCK` preservation, and delete-after-ready fencing. | AI-001 |
| FR-002 | Same prepared source renders same deterministic text and hash; rendered input is not persisted as a product entity. | DATA-001 |
| FR-003 | Ready requires prepared source, accepted index generation, native ready, and no delete/cancel fence. | DATA-001 |
| FR-004 | P6 must call `source_is_query_eligible()` and not copy conditions. | AI-001 |

## Contracts And Data

- Contracts: API-001, DATA-001, AI-001, QA-002, QA-004
- Data: Index state fields on `source_documents`; no index history/status mirror table.
- API: safe `SourceAdminSummary` index lifecycle fields plus Administrator-only index retry/cancel routes.
- AI: exact `CE_BLOCK` preservation must be proven before retrieval/evidence depends on indexed content.

## Resolved P5 Contract Decisions

- P5 starts with a pinned LightRAG proof fixture before migration, service, or worker business code.
- Index state belongs on `source_documents.index_*` fields, not an index operation/history/status table.
- P4 `source_blocks` are the only indexing input. P5 does not reparse originals, call Docling/Reducto, or submit parser-native payloads.
- `render_lightrag_input()` emits deterministic `CE_SOURCE` and `CE_BLOCK` marker text, returns a SHA-256 content hash, and never persists rendered text as a product entity.
- Admin source DTOs expose safe index lifecycle fields only. They never expose request ids, generations, content hashes, private remote ids, lease fields, rendered text, Source Block content, raw LightRAG/provider payloads, runtime URLs, paths, stack traces, or secrets.
- Index retry/cancel are Administrator-only backend actions. Browser code never talks to LightRAG or computes query eligibility.
- Source delete remains `204 No Content` only when accepted/ready remote indexed content has been deleted and verified absent before local row/file removal. If this cannot be bounded safely, stop and patch API-001/F-005 to an async source-delete contract before code.
- Domain delete remains asynchronous and must clear every indexed source's remote content before local source purge and domain hard delete.
- P5 implements one `source_is_query_eligible(source, domain)` predicate; P6/P7 must call it instead of copying readiness conditions.

## Render Contract

```text
[CE_SOURCE schema=1 source_id=<source-id> sha256=<original-sha256>]

[CE_BLOCK id=<source-block-id> order=<source-order>]
<canonical_markdown>
```

The renderer reads Source Blocks ordered by `source_order`, rejects non-prepared or zero-block sources, normalizes line endings, includes every Source Block id exactly once, and excludes image bytes. Page/section metadata is excluded from marker v1 unless the pinned LightRAG fixture proves it is needed and this spec is patched with escaping rules.

## Index Lifecycle

```text
not_requested -> queued -> submitting -> accepted -> ready
submitting | accepted -> failed
accepted | ready | failed | cancelled -> queued
queued | submitting | accepted | ready -> cancelling -> cancelled
```

Ready requires:

```text
source.state == "prepared"
AND source.index_state == "accepted"
AND native_ready == true
AND source.index_generation == worker_generation
AND source.index_request_id == worker_request_id
AND no delete/cancel fence is active
```

Retry after timeout or accepted/ready state must prove old remote content is absent, or prove the old request was never accepted, before creating a new generation/request id. Late ready after cancel/delete writes zero readiness state.

## Query Eligibility

```text
source_is_query_eligible(source, domain) =
  domain is available by P3 rules
  AND source.state == "prepared"
  AND source.index_state == "ready"
  AND source index generation/request identity is current
  AND no delete or cancel fence is active
```

This helper is server-side truth for later retrieval and chat. It does not call LightRAG directly, and frontend code must not copy it.

## Acceptance Criteria

- AC-001: P4 publish queues index in same DB transaction
- AC-002: native ready transitions to ready
- AC-003: native fail sets safe index error
- AC-004: retry uses new generation after old remote absent
- AC-005: cancel/delete blocks late ready
- AC-006: source/domain delete clears remote before local row deletion
- AC-007: no duplicate remote content after timeout/retry

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.

Fixture-captured technical choices still pending before business code:

- exact pinned LightRAG version/runtime fixture command;
- exact private delete/readiness primitive;
- whether `index_remote_document_id` is necessary;
- whether marker v1 needs page/section metadata.

If the fixture outcome requires a public field, state, route behavior, marker grammar change, or delete behavior change, patch API-001, DATA-001, AI-001, and this feature before code consumes it.
