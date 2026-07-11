---
id: F-000
title: Shared Contract Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: []
supersedes: []
---


# F-000 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | Placeholder scan excludes active docs except `_template`. |
| AC-002 | automated or explicit manual | Feature register links resolve. |
| AC-003 | automated or explicit manual | Conflicting source precedence is documented. |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
