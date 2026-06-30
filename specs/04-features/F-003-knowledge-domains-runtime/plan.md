---
id: F-003
title: Knowledge Domains And Private Runtime Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-002]
supersedes: []
---


# F-003 - Implementation Plan

## Build Strategy

Build only P3 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Admin API supports later domain settings/lifecycle panels. Member route returns only available domains for selectors. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `domains`, `domain_operations`; runtime private identity hidden from API DTOs. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [backend/data] Add domain/operation migrations and generation fencing.
  - Verification: State and uniqueness tests.
- [ ] T-020 [backend/api] Implement domain admin/member API routes.
  - Verification: Authz and DTO tests.
- [ ] T-030 [backend/controller] Implement private controller client/server boundary.
  - Verification: Internal auth and no-public-port tests.
- [ ] T-040 [backend/worker] Implement start/stop/delete worker paths.
  - Verification: Delete resume and stale generation tests.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.


## Pre-Implementation Contract Decisions

- [x] ID-A resolved P3 public API DTOs, data tables, operation concurrency, member list filtering, failure-state ownership, embedding-profile storage, and ID reuse semantics.
- [x] API-001 and DATA-001 now contain concrete P3 shapes before T-010/T-020 implementation.
- [ ] Controller internal protocol, storage layout, and Docker fixture proof remain P3 implementation gates before T-030/T-040.
