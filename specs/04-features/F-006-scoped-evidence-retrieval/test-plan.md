---
id: F-006
title: Scoped Evidence Retrieval Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-005]
supersedes: []
---


# F-006 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | fixture proves CE_BLOCK survives retrieval |
| AC-002 | automated or explicit manual | active domain with ready source returns evidence |
| AC-003 | automated or explicit manual | no eligible source -> 409 |
| AC-004 | automated or explicit manual | all hits discarded -> no_grounded_context |
| AC-005 | automated or explicit manual | foreign/deleted/ineligible markers discarded |
| AC-006 | automated or explicit manual | response excludes private IDs/paths/raw payloads |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
