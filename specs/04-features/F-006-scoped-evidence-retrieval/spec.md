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

- One authenticated Member/Administrator evidence endpoint.
- Strict `POST /api/v1/domains/{domain_id}/evidence` request with only `question`.
- Query target resolver for selected available Knowledge Domain.
- Private `LightRAGClient.retrieve()`.
- Single physical retrieval path for downstream chat: P6 evidence callable -> private per-domain LightRAG runtime -> CE_BLOCK mapper -> safe Evidence DTO.
- Strict `CE_BLOCK` marker parser.
- Exact Source Block mapper.
- Safe evidence DTO with only `excerpt` and `sourceLabel`.
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
- intent-specific retrievers, FAISS stores, extra vector stores, or extra retrieval endpoints
- durable evidence table

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Question targets selected domain, not an active source; the public request body contains only `question`. | API-001 |
| FR-002 | Discard raw hits with no marker, multiple markers, unknown marker, foreign domain/source, ineligible source, deleting resource, or fuzzy mapping requirement. | AI-001 |
| FR-003 | Response returns safe `excerpt`/`sourceLabel` Evidence DTOs only, never source/block IDs, raw score, raw hit, path, runtime URL, LightRAG ID, or full canonical Markdown. | API-001 |
| FR-004 | No eligible source returns `409 domain_no_eligible_sources`; no mapped evidence returns `200 { result: no_grounded_context, evidence: [] }`. | API-001 |

## Contracts And Data

- Contracts: API-001, AI-001, QA-002
- Data: No durable evidence table. Reads eligible sources/blocks and returns safe DTO.
- Runtime: private LightRAG retrieval must target the editable vendored runtime at `vendor/lightrag/` per ADR-002, not pip-only `lightrag-hku`.
- P7 may pass server-owned retrieval intent labels (`fact`, `overview`, `verbatim`) to the P6 callable through `RetrievalPort`; those labels must not create separate retrievers or duplicate marker parsing.
- API shape: strict `{ "question": string }` request, 1-2000 characters, unknown fields rejected; success is `{ "result": "evidence_found", "evidence": [{ "excerpt", "sourceLabel" }] }`; all-discarded retrieval is `{ "result": "no_grounded_context", "evidence": [] }`.
- Evidence excerpts are bounded to 500 characters and derived from mapped eligible Source Blocks, not raw runtime hit payloads.
- P6 must call the P5 `source_is_query_eligible()` helper before retrieval to detect no eligible sources and again during hit mapping to guard races.
- App-boundary retrieval proof must show private runtime hits returned through the Context Engine LightRAG client contain strict `CE_BLOCK` marker text. Unit tests may inject fake raw hits only below that proof layer.

## Acceptance Criteria

- AC-001: fixture proves CE_BLOCK survives retrieval
- AC-002: active domain with ready source returns evidence
- AC-003: no eligible source -> 409
- AC-004: all hits discarded -> no_grounded_context
- AC-005: foreign/deleted/ineligible markers discarded
- AC-006: response excludes private IDs/paths/raw payloads

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
