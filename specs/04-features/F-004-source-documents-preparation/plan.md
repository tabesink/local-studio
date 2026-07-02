---
id: F-004
title: Source Documents And Canonical Preparation Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Implementation Plan

## Build Strategy

Build only P4 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Admin API supports later documents library, upload dialog, outline, and operations surfaces. No member source-content route in this phase. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | `source_documents`, `source_preparation_operations`, `source_blocks`, `source_images`; no persisted Docling/Reducto native payload. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [backend/data] Add source/preparation/block/image migrations.
  - Verification: Fresh migration and constraints.
- [ ] T-020 [backend/api/storage] Implement upload/original storage/hash duplicate guard.
  - Verification: Upload and duplicate tests.
- [ ] T-030 [backend/parser] Implement Docling/Reducto adapters to `PreparedSource`.
  - Verification: Adapter shape tests.
- [ ] T-040 [backend/worker] Implement validator and all-or-none publish worker.
  - Verification: Crash/cancel/stale tests.
- [ ] T-050 [backend/api] Implement retry/cancel/delete/source list APIs.
  - Verification: Operation and redaction safety tests.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.

## P4 Storage And Worker Details

- Source storage root: `CE_SOURCE_STORAGE_ROOT`, default `.data/source-storage`.
- Derived private layout: `domains/{domain_id}/sources/{source_id}/original` and `domains/{domain_id}/sources/{source_id}/images/{image_id}` under the source storage root.
- Storage helpers must enforce root confinement; database rows must not persist storage paths.
- Source preparation worker uses `CE_SOURCE_PREP_WORKER_ID` and `CE_SOURCE_PREP_LEASE_SECONDS` for claim/lease behavior.
- Domain delete worker must call a narrow P4 source purge hook before final Knowledge Domain hard delete.
- No generic jobs table, Redis/RQ/Celery, event bus, parser profile framework, LightRAG call, indexing, retrieval, evidence, citation, chat, source viewer, or download behavior belongs in this phase.

## Contract Patch Status

P4 implementation depends on the P4 additions to API-001, DATA-001, and this feature spec. If implementation discovers a new public field, state, error, persistence column, parser behavior, or delete behavior, update the active contract before code consumes it.
