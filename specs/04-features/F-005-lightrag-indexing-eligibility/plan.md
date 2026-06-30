---
id: F-005
title: LightRAG Indexing And Query Eligibility Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Implementation Plan

## Build Strategy

Build only P5 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Admin API extends source status and retry/cancel affordances. Frontend must show backend state only and never poll LightRAG directly. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | Index state fields on `source_documents`; no index history/status mirror table. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-001 [backend/test] Build pinned LightRAG proof fixture and stop if any required behavior fails.
  - Verification: Fixture proof recorded.
- [ ] T-010 [backend/data] Add index fields and migration.
  - Verification: Migration/state tests.
- [ ] T-020 [backend/indexing] Implement deterministic render and hash.
  - Verification: Golden tests.
- [ ] T-030 [backend/integration] Implement private LightRAG client submit/readiness/delete.
  - Verification: Idempotency/readiness/delete tests.
- [ ] T-040 [backend/worker/api] Implement worker transitions and retry/cancel APIs.
  - Verification: Fence/stale tests.
- [ ] T-050 [backend/service] Implement `source_is_query_eligible()` predicate.
  - Verification: Eligibility tests.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
