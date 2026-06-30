---
id: F-003
title: Knowledge Domains And Private Runtime Acceptance Evidence
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Acceptance Evidence

Status: not implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | pending | planned | domain create validates embedding profile |
| AC-002 | pending | planned | start creates private runtime with no host port |
| AC-003 | pending | planned | member sees only available domains |
| AC-004 | pending | planned | delete removes container/runtime DB/workspace/logs/domain row |
| AC-005 | pending | planned | same public ID reusable only after delete complete |
| AC-006 | pending | planned | API has no Docker socket |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.


## Pre-Implementation Evidence

- `API-001` now defines P3 strict domain create, admin summary/detail/status/operations DTOs, member available-only list, and safe lifecycle error codes.
- `DATA-001` now defines `domains`, `domain_operations`, operation concurrency, computed availability, failure ownership, and delete/recreate fencing semantics.
- F-003 implementation acceptance remains pending until T-010 through T-040 are implemented and verified.
