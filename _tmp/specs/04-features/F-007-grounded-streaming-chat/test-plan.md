---
id: F-007
title: Grounded Streaming Chat Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-006]
supersedes: []
---


# F-007 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | user can CRUD own conversations only |
| AC-002 | automated or explicit manual | every turn requires domain |
| AC-003 | automated or explicit manual | second running turn -> 409 |
| AC-004 | automated or explicit manual | duplicate request returns existing result/no second provider call |
| AC-005 | automated or explicit manual | no evidence -> no_grounded_context |
| AC-006 | automated or explicit manual | provider failure after retrieval -> evidence_only |
| AC-007 | automated or explicit manual | client disconnect aborts stream and clears running state |
| AC-008 | automated or explicit manual | browser-sent provider/model/prompt/retrieval fields -> 422 |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
