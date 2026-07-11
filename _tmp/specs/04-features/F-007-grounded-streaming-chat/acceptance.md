---
id: F-007
title: Grounded Streaming Chat Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-006]
supersedes: []
---


# F-007 - Acceptance Evidence

Status: not implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | pending | planned | user can CRUD own conversations only |
| AC-002 | pending | planned | every turn requires domain |
| AC-003 | pending | planned | second running turn -> 409 |
| AC-004 | pending | planned | duplicate request returns existing result/no second provider call |
| AC-005 | pending | planned | no evidence -> no_grounded_context |
| AC-006 | pending | planned | provider failure after retrieval -> evidence_only |
| AC-007 | pending | planned | client disconnect aborts stream and clears running state |
| AC-008 | pending | planned | browser-sent provider/model/prompt/retrieval fields -> 422 |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
