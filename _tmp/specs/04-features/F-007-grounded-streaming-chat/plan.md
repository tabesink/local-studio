---
id: F-007
title: Grounded Streaming Chat Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-006]
supersedes: []
---


# F-007 - Implementation Plan

## Build Strategy

Build only P7 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Chat UI later renders conversation list/thread/composer, current-turn evidence, token stream, safe terminal states, and cancel. No source navigation until F-009 slice 16 contract exists. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `conversations`, `conversation_turns`; no prompt/raw evidence/raw provider columns. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [backend/data] Add conversation/turn migrations and constraints.
  - Verification: Owner and unique request tests.
- [ ] T-020 [backend/api] Implement conversation CRUD with owner filters.
  - Verification: 404 other-user tests.
- [ ] T-030 [backend/service] Implement turn idempotency and one-running-turn guard.
  - Verification: 409/duplicate tests.
- [ ] T-040 [backend/ai] Implement grounded prompt builder and provider stream adapter.
  - Verification: Prompt/citation tests.
- [ ] T-050 [backend/api] Implement Context Engine SSE endpoint.
  - Verification: SSE fixture tests.
- [ ] T-060 [backend/service] Implement source/domain redaction hooks.
  - Verification: Delete/redaction tests.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
