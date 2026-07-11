---
id: F-012-TEST
title: Governed Context Assembly Test Plan
status: completed
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012]
supersedes: []
---

# F-012 - Test Plan

## Required Evidence

| Criterion | Evidence |
| --- | --- |
| AC-001 | Contract/spec review: F-012, API-001, AI-001, DATA-001, EVT-001, F-009, F-011 |
| AC-002 | `tests/test_governed_context_assembly.py::test_fresh_migration_creates_governed_context_tables` |
| AC-003 | Discovery route/service tests plus OpenAPI snapshot |
| AC-004 | Validation happy-path service/API tests for source, evidence, wiki, template refs |
| AC-005 | Fail-closed route tests for malformed, excessive, stale, unauthorized, redacted, deleted, and out-of-domain refs |
| AC-006 | Prompt assembly/direct/domain RAG integration tests |
| AC-007 | Idempotency replay and conflict tests including ref fingerprint |
| AC-008 | History/SSE replay tests for safe `acceptedRefs` projection |
| AC-009 | Frontend tests, typecheck, and desktop/narrow visual evidence |
| AC-010 | Forbidden private data scan over docs, snapshots, fixtures, logs/traces, frontend fixtures, and screenshots |

## Commands

- `.venv/bin/python -m pytest tests/test_governed_context_assembly.py tests/test_grounded_streaming_chat.py tests/test_wiki_curation.py tests/test_conversations.py tests/test_observability.py`
- `.venv/bin/python -m alembic upgrade head`
- `cd frontend && npm run typecheck && npm test`
- OpenAPI snapshot regeneration/check for `tests/snapshots/f012_openapi.json`
- Browser visual check for `/chat` at desktop and narrow widths, or explicit manual evidence when browser tooling is unavailable.
