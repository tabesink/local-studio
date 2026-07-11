---
id: F-001
title: Trusted Application Foundation Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-000]
supersedes: []
---


# F-001 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | fresh migration works |
| AC-002 | automated or explicit manual | seed admin exists and password rotates by env + restart |
| AC-003 | automated or explicit manual | login JSON has no token |
| AC-004 | automated or explicit manual | cookie is HttpOnly/SameSite |
| AC-005 | automated or explicit manual | revoked/expired/disabled user gets safe 401 |
| AC-006 | automated or explicit manual | no token/password/hash in responses/logs/URLs |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
