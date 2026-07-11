---
id: F-006
title: Scoped Evidence Retrieval Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-005]
supersedes: []
---


# F-006 - Implementation Plan

## Build Strategy

Build only P6 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Evidence endpoint can support a minimal evidence-only UI later. In this phase, no source navigation or answer bubble exists. |
| API/service | Implement only the strict evidence endpoint, service callable, marker mapper, and safe DTOs named by this feature. |
| Data | No durable evidence table. Reads eligible sources/blocks and returns safe DTO. |
| Worker/runtime | Extend the private LightRAG client boundary with request-scoped retrieval proof; do not add a second retrieval stack, queue, or browser control. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [x] T-005 [contract] Patch API-001 and F-006 docs with exact request, response, fallback, and safe error shapes.
  - Verification: OpenAPI snapshot and DTO tests.
- [x] T-010 [backend/service] Implement query target resolver and domain availability checks.
  - Verification: Conflict tests.
- [x] T-020 [backend/integration] Implement private retrieval client wrapper that returns backend-only raw hit text containing `CE_BLOCK` markers.
  - Verification: App-boundary retrieval proof and timeout/safe error tests.
- [x] T-030 [backend/retrieval] Implement strict marker parser and Source Block mapper.
  - Verification: Foreign/deleted/ineligible tests.
- [x] T-040 [backend/api] Implement `POST /api/v1/domains/{domain_id}/evidence`.
  - Verification: DTO snapshot tests.
- [x] T-050 [backend/service] Add private callable for P7 reuse.
  - Verification: Shared mapper tests.

## Migration And Rollback

- Schema change: none.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code and keep F-006 docs aligned with the P5 review gates.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot prove private app-boundary hits preserve strict `CE_BLOCK` text.
