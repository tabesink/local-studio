---
id: TRACE-002
title: Traceability Matrix
status: approved
owner: Context Engine delivery coordinator
last_reviewed: 2026-06-30
depends_on: [TRACE-001]
supersedes: []
---

# Traceability Matrix

| Requirement | Feature | Contract/spec | Required proof | Status |
| --- | --- | --- | --- | --- |
| BR-001 browser only calls CE API | F-009 | API-001, ARCH-002 | frontend import/network audit | planned |
| BR-002 cookie-only session | F-001, F-009 | API-001, QA-002 | auth integration + browser storage test | planned |
| BR-004 no secret values cross API | F-002, F-009 | API-001, QA-002 | safe DTO snapshot/secret scan | planned |
| BR-005 query eligibility | F-003, F-005, F-006 | DATA-001, AI-001 | integration tests | planned |
| BR-007 LightRAG proof | F-005 | AI-001 | pinned fixture | planned |
| BR-008 exact evidence mapping | F-006, F-007 | AI-001 | mapper/foreign/deleted tests | planned |
| BR-009 RAG-only chat | F-007 | EVT-001, AI-001 | SSE + validation tests | planned |
| BR-010 redaction | F-007 | DATA-001, AI-001 | source/domain delete tests | planned |
| BR-011 visual parity | F-009 | DESIGN.md | screenshots and visual review | planned |
| NFR-005 pilot load | F-008 | QA-004 | 5-10 user load test | planned |
