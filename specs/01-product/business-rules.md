---
id: PROD-003
title: Business Rules
status: approved
owner: Context Engine product and backend team
last_reviewed: 2026-07-02
depends_on: [PROD-001, PROD-002]
supersedes: []
---

# Business Rules

| ID | Rule | Applies to | Evidence |
| --- | --- | --- | --- |
| BR-001 | Browser clients may call only Context Engine API/SSE routes. | all frontend slices | API/client tests, import audit |
| BR-002 | Opaque HttpOnly cookie session is the only browser auth credential. | auth, frontend | storage and logout tests |
| BR-003 | Administrator-only actions require backend authorization even when UI hides controls. | settings, domains, operations, audit | 403 tests |
| BR-004 | Provider/parser secret values never cross the API boundary. | runtime config, frontend | payload snapshots, secret scan |
| BR-005 | A Knowledge Domain is queryable only when running, healthy, not actively operating, and source eligibility passes. | domains, retrieval, chat | integration tests |
| BR-006 | Source Document preparation publishes all-or-none canonical Source Blocks. | source prep | worker crash/cancel tests |
| BR-007 | LightRAG indexing is blocked until the pinned runtime proves `CE_BLOCK` preservation, readiness, idempotency, and delete behavior. | indexing | fixture proof |
| BR-008 | Evidence must map exactly from a current eligible Source Block. | retrieval, chat | mapper tests |
| BR-009 | Chat route is server-classified: non-domain general chat may use direct LLM with no Knowledge Domain; domain-specific questions require a selected Knowledge Domain and the advanced agentic RAG path. | chat | request validation/SSE/orchestrator tests |
| BR-010 | Source/domain delete redacts derived answer/citation content while preserving user questions. | chat, delete | redaction tests |
| BR-011 | Local Studio visual parity governs new UI patterns. | frontend | visual checks |
| BR-012 | Unknown API shape means capture fixture/OpenAPI evidence before implementation. | all API consumers | fixture task evidence |
