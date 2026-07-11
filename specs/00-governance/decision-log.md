---
id: GOV-004
title: Decision Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [GOV-001]
supersedes: []
---

# Decision Log

| ID | Date | Decision | Reason | Affected specs | Owner | Review |
| --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | 2026-06-30 | Use opaque HttpOnly cookie sessions, not browser token persistence. | Eliminates localStorage bearer risk and makes logout server authoritative. | F-001, security, API | auth | before P1 complete |
| DEC-002 | 2026-06-30 | Keep pilot chat RAG-only. Superseded for F-007 by DEC-007. | Avoided ungrounded answer path and classifier bypass before direct-chat requirements were approved. | F-006, F-007, AI contract | product/backend | superseded |
| DEC-003 | 2026-06-30 | Require exact `CE_BLOCK` evidence mapping. | Prevents approximate citations and unsafe provenance. | F-005, F-006, AI contract | retrieval | before P5 proof |
| DEC-004 | 2026-06-30 | Adopt Local Studio visual parity but not Local Studio runtime/product features. | Reuses proven visual system without importing agent/controller/Electron scope. | DESIGN, F-009 | design/frontend | before P9 shell |
| DEC-005 | 2026-06-30 | Use one worker process and resource-owned operation tables, not a generic workflow engine. | Keeps lifecycle ownership explicit and limits infrastructure. | F-003, F-004, F-005, F-008 | backend | before P3/P4 |
| DEC-006 | 2026-07-02 | Require an editable vendored LightRAG tree at `vendor/lightrag/` for private runtime integration; reject pip-only `lightrag-hku` as the runtime source of truth. | Planned KG prompt tweaks must be version-controlled, reviewable, and reproducible. | ADR-002, F-003, F-005, F-006, ARCH-002 | backend | before native runtime promotion |
| DEC-007 | 2026-07-02 | Split chat into narrow direct LLM general chat and advanced agentic domain RAG. | Supports natural chat-shell use while preventing missing Evidence from becoming an ungrounded domain answer. | F-007, F-009, API-001, EVT-001, AI-001, DATA-001 | product/backend | before P7 complete |
| DEC-008 | 2026-07-02 | Implement F-007 advanced RAG with CE-native `TurnOrchestrator` and typed middleware only; reject LangChain/LangGraph adapters. | Keeps the synthesis layer low entropy, testable, and owned by Context Engine contracts instead of framework internals. | F-007, AI-001, ARCH-002 | backend/RAG | before P7 complete |
| DEC-009 | 2026-07-02 | Model CE advanced RAG retrieval as one physical P6/LightRAG retriever with three server-owned intent labels: `fact`, `overview`, and `verbatim`. | Preserves the controllable-RAG planning pattern without copying upstream's separate FAISS retrievers or adding a second retrieval stack. | F-006, F-007, AI-001, ARCH-002 | backend/RAG | before P7 complete |
