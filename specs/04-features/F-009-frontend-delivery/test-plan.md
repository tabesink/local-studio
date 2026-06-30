---
id: F-009
title: Frontend Delivery Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | no browser token storage |
| AC-002 | automated or explicit manual | 401 clears auth once |
| AC-003 | automated or explicit manual | 403 forbidden without redirect loop |
| AC-004 | automated or explicit manual | member cannot see/call admin controls |
| AC-005 | automated or explicit manual | SSE ordering fixtures pass |
| AC-006 | automated or explicit manual | no secret/path/raw payload in client errors/logs |
| AC-007 | automated or explicit manual | Playwright desktop/mobile key flows |
| AC-008 | automated or explicit manual | visual checks at 1440x900, 1280x800, and narrow viewport dark/light |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
