---
id: F-006
title: Scoped Evidence Retrieval Implementation Log
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-005]
supersedes: []
---


# F-006 - Implementation Log

Status: implemented.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-06-30 | Initial spec imported from Context Engine fullstack phase plan. | Prepare agent/junior-dev build path. | Implement phase tasks in order. |
| 2026-07-02 | Patched API-001, F-006 spec, plan, tasks, and test plan with strict `question` request, safe Evidence DTO, no-eligible `409`, no-grounded-context `200`, and runtime-unavailable `502`. | P5 review package identified API shape as a contract gap before route code. | Keep P7 retrieval port consuming this callable instead of introducing another retrieval endpoint. |
| 2026-07-02 | Added `context_engine.services.evidence` with strict `CE_BLOCK` parser, exact Source Block mapper, query-target resolver, safe excerpt DTO, and P7-ready `retrieve_scoped_evidence()` callable. | Proves evidence mapping independently of synthesis/chat persistence. | P7 may wrap this callable with server-owned intent labels only. |
| 2026-07-02 | Extended the private local LightRAG client boundary with backend-only `retrieve()` raw hits containing marker-bearing chunk text from worker-submitted indexed content. | P6 needs app-boundary retrieval proof that raw hits preserve `CE_BLOCK` before mapping. Runtime records remain private and are not API/log/spec fixtures. | Production native runtime work must continue to use `vendor/lightrag/` per ADR-002 and keep direct LightRAG imports out of API routes. |
| 2026-07-02 | Implemented `POST /api/v1/domains/{domain_id}/evidence` for authenticated Members and Administrators. | Close P6 API surface without synthesis, SSE, durable evidence table, source refs, or browser retrieval controls. | None for P6. |
| 2026-07-02 | Added `tests/test_scoped_evidence_retrieval.py` and `tests/snapshots/f006_openapi.json`; full suite passed. | Acceptance criteria require automated evidence for marker survival, eligible retrieval, no eligible source, all-discarded hits, discard matrix, safe DTOs, authz, validation, and runtime errors. | None. |

## Drift Register

No unresolved code/spec drift recorded. P6 intentionally does not add synthesis, SSE, chat history, query persistence, source navigation, browser retrieval controls, local fallback vector stores, or a durable Evidence table.
