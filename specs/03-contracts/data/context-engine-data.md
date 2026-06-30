---
id: DATA-001
title: Context Engine Data Contract
status: approved
owner: Context Engine data team
last_reviewed: 2026-06-30
depends_on: [ARCH-003]
supersedes: []
---

# Context Engine Data Contract

## Canonical Tables By Phase

| Phase | Tables / fields |
| --- | --- |
| P1 | `users`, `auth_sessions` |
| P2 | `provider_configs`, `model_profiles`, `runtime_settings` |
| P3 | `domains`, `domain_operations` |
| P4 | `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images` |
| P5 | `source_documents.index_state`, index generation/request/readiness/error fields |
| P7 | `conversations`, `conversation_turns` |
| P8 | `audit_events` |

## State Machines

```text
Domain: stopped | running | deleting
Source: pending | prepared | deleting
Preparation operation: queued | running | succeeded | failed | cancelled
Source index: not_requested | queued | submitting | accepted | ready | failed | cancelling | cancelled
Turn: running | completed | failed | redacted
```

Failure belongs to operation/index/turn fields, not extra domain/source states.

## Migration Rules

- Each phase with data changes includes Alembic migrations and a fresh-upgrade test.
- Do not add generic JSON settings, workflow/job tables, index history tables, query logs, runtime manifest/env tables, or persisted rendered LightRAG input unless an approved spec changes this contract.
- Destructive migrations need explicit rollback/compensation and acceptance evidence.
