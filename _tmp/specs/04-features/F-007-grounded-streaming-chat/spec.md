---
id: F-007
title: Grounded Streaming Chat Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-006]
supersedes: []
---


# F-007 - Grounded Streaming Chat

Phase: P7

## Outcome

Create user-owned conversations where each turn selects one Knowledge Domain, retrieves mapped evidence, and streams a grounded answer or safe fallback.

## Why Now

Chat is the primary user-facing RAG experience and must preserve evidence, citations, ownership, idempotency, and redaction.

## Actors

Members, Administrators as chat users, synthesis provider, retrieval service.

## In Scope

- `conversations` and `conversation_turns`.
- Owner filters and conversation CRUD.
- Required `domain_id` per turn.
- Client request idempotency per conversation.
- One running turn per conversation.
- Reuse P6 evidence callable.
- Resolve active synthesis profile once per turn.
- Bounded prior user questions only.
- Grounded prompt builder.
- Context Engine SSE contract.
- Citation validation.
- Evidence-only fallback and no-grounded-context result.
- Source/domain redaction hooks.

## Out Of Scope

- team/shared conversations
- admin global chat read
- old-turn semantic search
- summary/compact workflow
- prompt editor
- model picker
- provider failover
- background synthesis retry
- chat worker/queue
- source navigation UI

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Pilot chat is RAG-only; no general/domainless/direct non-grounded branch. | AI-001 |
| FR-002 | Every turn requires one domain and one client request id. | API-001 |
| FR-003 | Evidence is emitted before tokens and one terminal SSE event ends the stream. | EVT-001 |
| FR-004 | Provider failure after evidence returns evidence-only fallback; no raw provider error. | AI-001 |
| FR-005 | Source/domain delete redacts derived answer/citations but keeps user question. | DATA-001 |

## Contracts And Data

- Contracts: API-001, EVT-001, DATA-001, AI-001
- Data: `conversations`, `conversation_turns`; no prompt/raw evidence/raw provider columns.

## Acceptance Criteria

- AC-001: user can CRUD own conversations only
- AC-002: every turn requires domain
- AC-003: second running turn -> 409
- AC-004: duplicate request returns existing result/no second provider call
- AC-005: no evidence -> no_grounded_context
- AC-006: provider failure after retrieval -> evidence_only
- AC-007: client disconnect aborts stream and clears running state
- AC-008: browser-sent provider/model/prompt/retrieval fields -> 422

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
