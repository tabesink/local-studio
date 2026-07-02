---
id: F-006
title: Scoped Evidence Retrieval Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-005]
supersedes: []
---


# F-006 - Scoped Evidence Retrieval

Phase: P6

## Outcome

Let a user ask one Knowledge Domain question and receive safe evidence cards without answer synthesis.

## Why Now

Evidence mapping is the highest-risk foundation for grounded chat and must be proven independently before synthesis.

## Actors

Members, Administrators, retrieval service, private LightRAG runtime.

## In Scope

- One member evidence endpoint.
- Query target resolver for selected domain.
- Private `LightRAGClient.retrieve()`.
- Strict `CE_BLOCK` marker parser.
- Exact Source Block mapper.
- Safe evidence DTO.
- Safe retrieval diagnostics/logs.

## Out Of Scope

- synthesis
- SSE
- chat history
- query persistence
- source navigation
- source/document selector
- retrieval config UI
- browser top-k/reranker/mode
- local fallback retrieval
- durable evidence table

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Question targets selected domain, not an active source. | API-001 |
| FR-002 | Discard raw hits with no marker, multiple markers, unknown marker, foreign domain/source, ineligible source, deleting resource, or fuzzy mapping requirement. | AI-001 |
| FR-003 | Response returns safe excerpts/source labels only, never source/block IDs, raw score, raw hit, path, runtime URL, or LightRAG ID. | API-001 |
| FR-004 | No eligible source returns safe conflict; no mapped evidence returns `no_grounded_context`. | API-001 |

## Contracts And Data

- Contracts: API-001, AI-001, QA-002
- Data: No durable evidence table. Reads eligible sources/blocks and returns safe DTO.

## Acceptance Criteria

- AC-001: fixture proves CE_BLOCK survives retrieval
- AC-002: active domain with ready source returns evidence
- AC-003: no eligible source -> 409
- AC-004: all hits discarded -> no_grounded_context
- AC-005: foreign/deleted/ineligible markers discarded
- AC-006: response excludes private IDs/paths/raw payloads

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
