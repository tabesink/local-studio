---
id: F-004
title: Source Documents And Canonical Preparation Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | upload stores immutable original |
| AC-002 | automated or explicit manual | same file hash in same domain rejected |
| AC-003 | automated or explicit manual | Docling and Reducto return same PreparedSource shape |
| AC-004 | automated or explicit manual | failed parse leaves source pending with failed operation |
| AC-005 | automated or explicit manual | retry keeps same frozen parser kind |
| AC-006 | automated or explicit manual | source/domain delete removes rows/files |
| AC-007 | automated or explicit manual | no LightRAG call |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
