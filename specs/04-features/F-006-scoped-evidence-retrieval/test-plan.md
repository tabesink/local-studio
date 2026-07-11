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
| AC-001 | automated | app-boundary fixture proves private retrieval hit text contains exactly one usable `CE_BLOCK` marker after P5 worker submit |
| AC-002 | automated or explicit manual | active domain with ready source returns evidence |
| AC-003 | automated | no eligible source -> `409 domain_no_eligible_sources` safe envelope |
| AC-004 | automated | all hits discarded -> `200 { result: no_grounded_context, evidence: [] }` |
| AC-005 | automated or explicit manual | foreign/deleted/ineligible markers discarded |
| AC-006 | automated | DTO/OpenAPI snapshots exclude private IDs/paths/raw payloads and expose only `excerpt`/`sourceLabel` Evidence items |

## Regression Checks

- P6 request validation rejects unknown request fields and forbidden retrieval controls with `422 validation_error`.
- Parser unit tests reject no marker, malformed marker, and multiple markers.
- Mapper tests discard unknown Source Block ids, foreign-domain markers, Source Documents that fail `source_is_query_eligible()`, deleting sources, and cancelling/cancelled index states.
- Runtime unavailable/timeout failures return `502 domain_runtime_unavailable` without raw exception text, question text, paths, payloads, or hit text.
- Safe Evidence excerpts are bounded to 500 characters and source labels to 255 characters.
- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
