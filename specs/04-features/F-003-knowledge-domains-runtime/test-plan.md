---
id: F-003
title: Knowledge Domains And Private Runtime Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | domain create validates embedding profile |
| AC-002 | automated or explicit manual | start creates private runtime with no host port |
| AC-003 | automated or explicit manual | member sees only available domains |
| AC-004 | automated or explicit manual | delete removes container/runtime DB/workspace/logs/domain row |
| AC-005 | automated or explicit manual | same public ID reusable only after delete complete |
| AC-006 | automated or explicit manual | API has no Docker socket |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
