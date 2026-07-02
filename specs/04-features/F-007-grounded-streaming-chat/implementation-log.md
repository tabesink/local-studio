---
id: F-007
title: Agentic Chat And Streaming Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-006]
supersedes: []
---


# F-007 - Implementation Log

Status: not implemented.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-07-02 | Replaced RAG-only pilot plan with explicit direct LLM general chat plus advanced agentic domain RAG. | User requirement and controllable RAG reference package show the desired synthesis architecture; contracts now prevent missing Evidence from becoming ungrounded domain answers. | Implement F-007 with CE-native `TurnOrchestrator` and typed middleware only; LangChain/LangGraph adapters are rejected. |
| 2026-07-02 | Locked F-007 orchestration to CE-native modules with no LangChain/LangGraph adapter path. | Lower entropy, fewer dependency/security surfaces, and clearer ownership for budgets, retrieval, verification, citation validation, and SSE projection. | Keep any future framework proposal behind a new approved decision and contract change, not an adapter placeholder. |
| 2026-07-02 | Clarified that CE has one physical P6/LightRAG retriever and three logical retrieval intent labels. | Prevents the upstream controllable-RAG three-FAISS-retriever design from being copied into CE. | Implement `fact`, `overview`, and `verbatim` as server-owned query-shaping policy over one RetrievalPort. |

## Drift Register

No code/spec drift recorded yet. Specification changed before implementation.
