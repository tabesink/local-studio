---
id: F-007
title: Agentic Chat And Streaming Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-006]
supersedes: []
---


# F-007 - Acceptance Evidence

Status: not implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | pending | planned | user can CRUD own conversations only |
| AC-002 | pending | planned | domain-specific turn requires domain; direct general chat omits domain |
| AC-003 | pending | planned | second running turn -> 409 |
| AC-004 | pending | planned | duplicate request returns existing result/no second provider call |
| AC-005 | pending | planned | no evidence -> no_grounded_context |
| AC-006 | pending | planned | provider failure after retrieval -> evidence_only |
| AC-007 | pending | planned | client disconnect aborts stream and clears running state |
| AC-008 | pending | planned | browser-sent provider/model/prompt/retrieval fields -> 422 |
| AC-009 | pending | planned | non-domain general chat returns direct LLM answer with no retrieval/evidence/citations |
| AC-010 | pending | planned | domain-specific no-evidence case does not fall back to direct LLM |
| AC-011 | pending | planned | advanced RAG closes over allowed operations and budgets; invalid operation/plan fails closed without LangChain/LangGraph |
| AC-012 | pending | planned | SSE stage events expose labels only, never planning text or reasoning |
| AC-013 | pending | planned | `fact`, `overview`, and `verbatim` use one RetrievalPort/P6 LightRAG path; no intent-specific retrievers or FAISS/vector-store fallback |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
