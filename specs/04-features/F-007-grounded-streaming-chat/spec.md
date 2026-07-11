---
id: F-007
title: Agentic Chat And Streaming Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-006]
supersedes: []
---


# F-007 - Agentic Chat And Streaming

Phase: P7

## Outcome

Create user-owned conversations where each turn is server-classified as either narrow direct LLM general chat or advanced agentic RAG against one selected Knowledge Domain, then streams safe Context Engine SSE events.

## Why Now

Chat is the primary user-facing synthesis experience and must preserve route ownership, evidence, citations, idempotency, safe direct chat, and redaction.

## Actors

Members, Administrators as chat users, synthesis provider, retrieval service.

## In Scope

- `conversations`, `conversation_turns`, and `conversation_turn_evidence_refs`.
- Owner filters and conversation CRUD.
- Optional `domain_id` per turn; required for domain-specific questions and `domain_rag`, absent for `direct_llm`.
- Client request idempotency per conversation.
- One running turn per conversation.
- Server intent gate for `direct_llm` vs `domain_rag`.
- Direct LLM responder for non-domain general chat only.
- Reuse P6 evidence callable through one RetrievalPort implementation; `fact`, `overview`, and `verbatim` are logical intent labels on that same retriever.
- Resolve active synthesis profile once per turn.
- Bounded prior user questions only.
- CE-native advanced agentic RAG orchestrator with a statically registered typed middleware chain and closed retrieval operations.
- Orchestrator prompt/operation descriptions and provider stream adapter.
- Context Engine SSE contract.
- Safe `stage` SSE projection.
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
- open web search or browser-supplied tools
- separate retrievers for `fact`, `overview`, or `verbatim`; FAISS recreation; second vector store; duplicate retrieval endpoint
- LangChain, LangGraph, `create_agent`, `create_react_agent`, `StateGraph`, or framework adapters

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Non-domain general chat may use direct LLM with no Evidence/citations; browser cannot select this route. | AI-001 |
| FR-002 | Domain-specific or ambiguous knowledge questions require one selected Knowledge Domain and must run the advanced agentic RAG path. | API-001, AI-001 |
| FR-003 | Domain RAG uses a CE-native `TurnOrchestrator` with statically registered typed middleware, closed RetrievalPort operations, and bounded plan/retrieve/verify loops over one physical P6/LightRAG retriever. | AI-001 |
| FR-004 | Evidence is emitted before grounded answer tokens and one terminal SSE event ends the stream. | EVT-001 |
| FR-005 | Missing Evidence in domain RAG returns no-grounded-context and never falls back to direct LLM. | AI-001 |
| FR-006 | Provider failure after evidence returns evidence-only fallback; no raw provider error. | AI-001 |
| FR-007 | Source/domain delete redacts derived answer/citations but keeps user question. | DATA-001 |
| FR-008 | Pre-stream validation, auth, idempotency, and domain errors return canonical JSON errors before SSE opens; completed/failed duplicate requests replay persisted safe turn state without provider or retrieval calls. | API-001, EVT-001 |
| FR-009 | Chat uses an internal mapped-evidence bridge for private Source Document/Block ids; public API/SSE exposes only turn-scoped evidence refs. | API-001, DATA-001, AI-001 |

## Contracts And Data

- Contracts: API-001, EVT-001, DATA-001, AI-001
- Data: `conversations`, `conversation_turns`, `conversation_turn_evidence_refs`; no prompt/raw evidence/raw provider columns.

## Acceptance Criteria

- AC-001: user can CRUD own conversations only
- AC-002: domain-specific turn requires domain; direct general chat omits domain
- AC-003: second running turn -> 409
- AC-004: duplicate request returns existing result/no second provider call
- AC-005: no evidence -> no_grounded_context
- AC-006: provider failure after retrieval -> evidence_only
- AC-007: client disconnect aborts stream and clears running state
- AC-008: browser-sent provider/model/prompt/retrieval fields -> 422
- AC-009: non-domain general chat returns direct LLM answer with no retrieval, evidence, or citations
- AC-010: domain-specific no-evidence case does not fall back to direct LLM
- AC-011: advanced RAG closes over allowed operations and budgets; invalid operation/plan fails closed without LangChain/LangGraph
- AC-012: SSE stage events expose labels only, never planning text or reasoning
- AC-013: `fact`, `overview`, and `verbatim` are proven as intent labels over one RetrievalPort/P6 LightRAG path, not separate retrievers
- AC-014: validation, missing required domain, unknown supplied domain, running-turn, and request-conflict failures return JSON errors before SSE opens
- AC-015: completed/failed duplicate `clientRequestId` requests replay persisted safe state and do not call provider, LightRAG, or retrieval
- AC-016: public conversation detail and SSE evidence payloads expose only turn-scoped evidence refs, citation labels, safe source labels, and approved excerpts

## Open Decisions

No open product decisions are allowed before implementation starts. API/SSE/data edge details for turn summaries, idempotency replay, terminal SSE outcomes, safe errors, title validation, and the private mapped-evidence bridge are closed in API-001, EVT-001, DATA-001, and AI-001.
