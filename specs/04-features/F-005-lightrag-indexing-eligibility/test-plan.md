---
id: F-005
title: LightRAG Indexing And Query Eligibility Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | P4 publish queues index in same DB transaction |
| AC-002 | automated or explicit manual | native ready transitions to ready |
| AC-003 | automated or explicit manual | native fail sets safe index error |
| AC-004 | automated or explicit manual | retry uses new generation after old remote absent |
| AC-005 | automated or explicit manual | cancel/delete blocks late ready |
| AC-006 | automated or explicit manual | source/domain delete clears remote before local row deletion |
| AC-007 | automated or explicit manual | no duplicate remote content after timeout/retry |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
