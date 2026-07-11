---
id: F-005
title: LightRAG Indexing And Query Eligibility Implementation Plan
status: implemented
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
| Worker/runtime | Only included when named in scope; otherwise absent. Native LightRAG runtime must come from editable `vendor/lightrag/` per ADR-002, not pip-only `lightrag-hku`. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Contract Patch Status

API-001, DATA-001, AI-001, and this feature now define the P5 index fields, safe DTO extensions, render marker grammar, index retry/cancel route shape, remote-delete-before-local-delete rule, and query eligibility predicate. Any implementation discovery that changes a public field, state, route, marker grammar, delete behavior, or fixture guarantee must patch the active contracts before code consumes it.

## Implementation Sequence

- [ ] T-001 [backend/test] Build pinned LightRAG proof fixture and stop if any required behavior fails.
  - Verification: Fixture proof recorded for health, typed provider injection, idempotent submit, readiness, delete/absence, `CE_BLOCK` preservation, and late-ready fencing.
- [ ] T-010 [backend/data] Add `source_documents.index_*` fields and migration.
  - Verification: Migration/state tests prove defaults, constraints, no forbidden columns, and no index history/status mirror table.
- [ ] T-020 [backend/indexing] Implement deterministic `render_lightrag_input()` and hash.
  - Verification: Golden tests prove exact marker output, stable hash, every Source Block id exactly once, and no rendered-text persistence/logging.
- [ ] T-030 [backend/integration] Implement one private LightRAG client for health, submit, readiness, delete, and absence proof.
  - Verification: Idempotency/readiness/delete tests use the pinned fixture and fakes for state races.
- [ ] T-040 [backend/worker/api] Implement worker transitions, retry/cancel APIs, and source/domain delete remote cleanup.
  - Verification: Fence/stale tests prove timeout reconcile, no duplicate content, cancel/delete late-ready no-op, and remote absence before local purge.
- [ ] T-050 [backend/service] Implement `source_is_query_eligible()` predicate.
  - Verification: Eligibility tests cover every false condition and later-phase usage notes.

## Migration And Rollback

- Schema change: yes.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs; never expose rendered input, Source Block content, request ids, remote ids, runtime URLs, paths, stack traces, provider payloads, or secrets.
- Overbuild: reject infrastructure and feature work listed in out-of-scope, especially index history tables, status mirrors, generic jobs, Redis/RQ/Celery, event buses, local retrieval fallbacks, and parser SDK wiring.
- Runtime unknowns: stop when a required fixture cannot be proven.
- Vendored runtime: production native LightRAG must stay pinned to `vendor/lightrag/` per ADR-002; do not regress to unpinned PyPI or `.references/` imports before KG prompt edits or native runtime shipping.
- Delete safety: if synchronous source delete cannot prove remote absence before local removal, stop and patch an async source-delete contract before implementation.

## Rollback And Compensation Notes

- Additive index fields can remain on rollback with `not_requested` defaults.
- Never roll back by deleting local Source Document rows before accepted/ready remote LightRAG content is absent.
- Failed remote cleanup leaves the source/domain fenced with safe failure details and resumable worker state.
