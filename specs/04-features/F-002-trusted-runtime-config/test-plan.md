---
id: F-002
title: Trusted Runtime Config Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001]
supersedes: []
---


# F-002 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | missing/invalid encryption key fails startup outside test |
| AC-002 | automated or explicit manual | provider rows seeded |
| AC-003 | automated or explicit manual | credential rotation updates same row |
| AC-004 | automated or explicit manual | safe GET excludes secret/ciphertext |
| AC-005 | automated or explicit manual | Reducto parser requires Reducto credential |
| AC-006 | automated or explicit manual | no provider network call happens |
| AC-007 | automated or explicit manual | seeded model catalog, default profile metadata, and safe DTOs |
| AC-008 | automated or explicit manual | embedding resolver and embedding-profile in-use immutability guard |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
