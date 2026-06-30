---
id: F-009
title: Frontend Delivery Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Implementation Plan

## Build Strategy

Build only P9 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | This is the production UI phase. It preserves old Context Engine route/shell structure while adopting Local Studio compact dark-first visual grammar. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | Frontend owns local UI state only. It does not persist product state or credentials. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [frontend] Implement runtime foundation: env, API client, error normalization, tokens, tests.
  - Verification: unit tests and visual baseline.
- [ ] T-020 [frontend] Implement cookie login/logout/me and route guards.
  - Verification: browser storage/auth tests.
- [ ] T-030 [frontend] Implement authenticated app shell, compact rail, settings entry, forbidden/loading/error states.
  - Verification: Playwright shell tests.
- [ ] T-040 [frontend] Implement Settings panels only after relevant OpenAPI fixtures exist.
  - Verification: admin/member and secret-status tests.
- [ ] T-050 [frontend] Implement documents/upload/operations slices.
  - Verification: state-machine and upload tests.
- [ ] T-060 [frontend] Implement evidence-only and SSE chat slices.
  - Verification: SSE fixture/cancel tests.
- [ ] T-070 [frontend] Implement graph/source-nav/audit diagnostics only after contracts are captured.
  - Verification: contract and visual tests.

## Migration And Rollback

- Schema change: none.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
