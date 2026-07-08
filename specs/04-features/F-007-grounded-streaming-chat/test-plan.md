---
id: F-007
title: Agentic Chat And Streaming Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-06
depends_on: [F-006]
supersedes: []
---


# F-007 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | user can CRUD own conversations only |
| AC-002 | automated or explicit manual | domain-specific turn requires domain; direct general chat omits domain |
| AC-003 | automated or explicit manual | second running turn -> 409 |
| AC-004 | automated or explicit manual | duplicate request returns existing result/no second provider call |
| AC-005 | automated or explicit manual | no evidence -> no_grounded_context |
| AC-006 | automated or explicit manual | provider failure after retrieval -> evidence_only |
| AC-007 | automated or explicit manual | client disconnect aborts stream and clears running state |
| AC-008 | automated or explicit manual | browser-sent provider/model/prompt/retrieval fields -> 422 |
| AC-009 | automated or explicit manual | non-domain general chat returns direct LLM answer with no retrieval/evidence/citations |
| AC-010 | automated or explicit manual | domain-specific no-evidence case does not fall back to direct LLM |
| AC-011 | automated or explicit manual | advanced RAG closes over allowed operations and budgets; invalid operation/plan fails closed without LangChain/LangGraph |
| AC-012 | automated or explicit manual | SSE stage events expose labels only, never planning text or reasoning |
| AC-013 | automated or explicit manual | `fact`, `overview`, and `verbatim` use one RetrievalPort/P6 LightRAG path; no intent-specific retrievers or FAISS/vector-store fallback |
| AC-014 | automated or explicit manual | validation, missing required domain, unknown supplied domain, running-turn, and request-conflict failures return JSON errors before SSE opens |
| AC-015 | automated or explicit manual | completed/failed duplicate `clientRequestId` requests replay persisted safe state and do not call provider, LightRAG, or retrieval |
| AC-016 | automated or explicit manual | public conversation detail and SSE evidence payloads expose only turn-scoped evidence refs, citation labels, safe source labels, and approved excerpts |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Orchestrator traces and fixtures do not contain raw prompts, chain-of-thought, raw provider payloads, raw LightRAG hits, paths, or source text beyond approved excerpts.
- OpenAPI snapshot covers P7 conversation summary/detail/update, turn stream request validation, safe error codes, and turn/evidence DTOs.
- SSE transcripts cover direct success, grounded success, no grounded context, evidence-only fallback, provider failure before evidence, completed replay, failed replay, and client disconnect.
- Safe DTO snapshots prove private Source Document/Source Block ids are persisted for redaction but never returned through conversation detail or SSE.
- Redaction integration tests prove affected turns set `status=redacted`, clear `assistantAnswer`, return empty public `evidence`/`citations`, and retain evidence ref rows with `redacted_at` set and public fields cleared.
- Dependency/import checks prove F-007 chat runtime does not import LangChain or LangGraph.
- Dependency/import checks prove F-007 chat runtime does not import FAISS or add another vector-store/retrieval stack.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
