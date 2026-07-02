---
id: ARCH-004
title: Integration Flows
status: approved
owner: Context Engine architecture team
last_reviewed: 2026-07-02
depends_on: [ARCH-001, ARCH-002]
supersedes: []
---

# Integration Flows

| ID | Flow | Type | Idempotency | Failure behavior | Owner |
| --- | --- | --- | --- | --- | --- |
| INT-001 | Login/session resolve/logout | HTTP | session token hash | safe 401/403 envelope | P1 |
| INT-002 | Runtime settings mutation | HTTP | row/profile identity | reject invalid refs/secrets hidden | P2 |
| INT-003 | Domain create/start/stop/delete | HTTP + worker/controller | operation/resource identity and generation fences | partial delete remains resumable | P3 |
| INT-004 | Source upload/preparation | multipart HTTP + worker | source hash, preparation generation | failed/cancelled safe operation | P4 |
| INT-005 | LightRAG index/retry/delete | worker/private HTTP | source index request id | reconcile timeout, fence stale ready | P5 |
| INT-006 | Evidence retrieval | HTTP/private LightRAG | request scoped | discard unmapped/ineligible hits | P6 |
| INT-007 | Chat turn stream | HTTP SSE + provider + RetrievalPort | `(conversation_id, client_request_id)` | server-classified direct LLM or advanced domain RAG, one terminal event, safe fallback | P7 |
| INT-008 | Audit/log/tracing | internal write/log/span | immutable audit id | tracing outage ignored | P8 |
| INT-009 | Frontend API/SSE consumption | browser HTTP/SSE | feature-owned | typed error/forbidden/auth handling | P9 |

## Global Failure Rules

- Never hold DB transactions while calling LightRAG, providers, parser services, Docker/controller, or while streaming SSE.
- Never return raw external payloads to browser.
- Every protected failure has a safe error code and request ID when available.
- Retry/cancel/delete must use generation fences where stale workers can publish late.
