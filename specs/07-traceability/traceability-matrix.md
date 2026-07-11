---
id: TRACE-002
title: Traceability Matrix
status: approved
owner: Context Engine delivery coordinator
last_reviewed: 2026-07-07
depends_on: [TRACE-001]
supersedes: []
---

# Traceability Matrix

| Requirement | Feature | Contract/spec | Required proof | Status |
| --- | --- | --- | --- | --- |
| BR-001 browser only calls CE API | F-009 | API-001, ARCH-002 | frontend import/network audit | foundation implemented via shared `/api/v1` client, blocked absolute URLs, and foundation scan; browser network audit pending |
| BR-002 cookie-only session | F-001, F-009 | API-001, QA-002 | auth integration + browser storage test | foundation + Playwright live storage assert (no token keys in local/session storage after login/logout) |
| BR-004 no secret values cross API | F-002, F-009 | API-001, QA-002 | safe DTO snapshot/secret scan | implemented for F-002; F-009 foundation error/storage scan implemented, later DTO snapshots pending |
| BR-005 query eligibility | F-003, F-005, F-006 | DATA-001, AI-001 | integration tests | implemented for F-003 domain availability, F-005 query eligibility, and F-006 evidence resolver/mapper via `tests/test_scoped_evidence_retrieval.py` |
| BR-007 LightRAG proof | F-005 | AI-001 | pinned fixture | implemented for F-005 with vendored LightRAG 1.4.16 proof, production-default `LightRAGClient`, native app-boundary evidence test, global lifecycle guard test, and live Docker/native Slice A gate |
| BR-008 exact evidence mapping | F-006, F-007 | AI-001 | mapper/foreign/deleted tests | implemented for F-006 via strict parser, app-boundary retrieval proof, native LightRAG retrieval default, live Docker-backed evidence proof, mapper discard matrix, and safe DTO tests; implemented for F-007 via internal mapped-evidence bridge and current-turn evidence-ref citation tests in `tests/test_grounded_streaming_chat.py` |
| BR-009 server-classified direct chat and agentic RAG | F-007 | API-001, EVT-001, AI-001, DATA-001 | OpenAPI snapshot, SSE fixtures, idempotent replay tests, pre-stream JSON error tests, intent/orchestrator validation tests | implemented for P7 via `POST /conversations/{conversation_id}/turns:stream`, deterministic intent gate, single-hop `TurnOrchestrator`, SSE transcript tests, idempotent replay counters, pre-stream JSON error tests, and `tests/snapshots/f007_openapi.json` |
| BR-010 redaction | F-007 | DATA-001, AI-001 | source/domain delete tests | implemented for P7 via source delete and domain delete worker redaction tests in `tests/test_grounded_streaming_chat.py` |
| BR-011 visual parity | F-009 | DESIGN.md | screenshots and visual review | Playwright DESIGN matrix (1440×900 dark/light, 1280×800 dark, 390×844) for login + chat; manual visual review recorded in F-009 acceptance 2026-07-10 |
| BR-012 browser cannot mutate infrastructure directly | F-010 | ARCH-002, QA-002, DESIGN.md | P10 import/network audit and operator-surface screenshots | planned for F-010; runnable stack first, node/logs/usage UI blocked until API/data contracts |
| BR-013 governed wiki curation | F-011 | API-001, DATA-001, QA-002, DESIGN.md | migration tests, route authz/state tests, immutable revision tests, redaction invalidation tests, safety scan, visual checks if UI ships | backend manual contribution workflow implemented and verified; frontend UI and OpenAPI snapshot deferred |
| NFR-005 pilot load | F-008 | QA-004 | 5-10 user load test | implemented for deterministic 10-user direct-chat smoke plus `scripts/pilot_flow.py` local launch flow |
| NFR-007 operability | F-008 | API-001, DATA-001, QA-003, RUN-001 | audit/log/trace migration tests, log redaction snapshots, OpenAPI snapshot, safety scan, launch-gate evidence | implemented via P8 audit/log/trace/diagnostics tests, OpenAPI snapshot, safety scan, `scripts/compose_smoke.py`, `scripts/pilot_flow.py`, and failure-injection fixtures |
| NFR-008 minimal runnable stack | F-010 | RUN-001, API-001, DATA-001, QA-002, QA-003 | current-repo compose/deployment smoke proving stock Postgres, migrations, API health/auth, CE lease worker, production frontend proxy, and full pilot-path HTTP smoke evidence | implemented via `compose.stack.yml`, one CE lease worker, `scripts/stack_smoke.py` full pilot path, and `scripts/stack_safety_scan.py`; richer node/logs/usage/storage UI remains contract-blocked |
