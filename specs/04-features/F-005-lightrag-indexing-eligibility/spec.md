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

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Stop if pinned LightRAG cannot prove health, secret injection, idempotent submit, readiness, deletion, `CE_BLOCK` preservation, and delete-after-ready fencing. | AI-001 |
| FR-002 | Same prepared source renders same deterministic text and hash; rendered input is not persisted as a product entity. | DATA-001 |
| FR-003 | Ready requires prepared source, accepted index generation, native ready, and no delete/cancel fence. | DATA-001 |
| FR-004 | P6 must call `source_is_query_eligible()` and not copy conditions. | AI-001 |

## Contracts And Data

- Contracts: API-001, DATA-001, AI-001, QA-004
- Data: Index state fields on `source_documents`; no index history/status mirror table.

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
