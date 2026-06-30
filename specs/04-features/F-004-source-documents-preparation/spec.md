---
id: F-004
title: Source Documents And Canonical Preparation Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Source Documents And Canonical Preparation

Phase: P4

## Outcome

Allow Administrators to upload Source Documents into a Knowledge Domain and normalize parser output into flat canonical Source Blocks.

## Why Now

Retrieval and evidence require stable Context Engine-owned Source Blocks instead of parser-native payloads.

## Actors

Administrators, worker, parser adapters, domain delete workflow.

## In Scope

- Multiple Source Documents per Knowledge Domain.
- Immutable original file and frozen `parser_kind` on upload.
- `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images`.
- Docling and Reducto adapters.
- Canonical validator and all-or-none publish.
- Postgres worker claim/lease/cancel/retry.
- Safe admin source APIs.
- Domain delete purges sources first.

## Out Of Scope

- LightRAG calls
- embeddings/vector/graph/retrieval
- chat/evidence/citations
- member source viewer
- original/image download
- source replace/version UI
- folders/annotations/archive
- parser-native API output

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Source state persists only `pending`, `prepared`, or `deleting`. | DATA-001 |
| FR-002 | Preparation operation uses queued/running/succeeded/failed/cancelled and generation fencing. | DATA-001 |
| FR-003 | Source Blocks store stable UUID, source order, kind, canonical Markdown, heading/page/section metadata. | DATA-001 |
| FR-004 | Parser-native payloads, task IDs, parser URLs, raw errors, credentials, and config JSON are not persisted/exposed. | QA-002 |

## Contracts And Data

- Contracts: API-001, DATA-001, QA-002
- Data: `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images`; no persisted Docling/Reducto native payload.

## Acceptance Criteria

- AC-001: upload stores immutable original
- AC-002: same file hash in same domain rejected
- AC-003: Docling and Reducto return same PreparedSource shape
- AC-004: failed parse leaves source pending with failed operation
- AC-005: retry keeps same frozen parser kind
- AC-006: source/domain delete removes rows/files
- AC-007: no LightRAG call

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
