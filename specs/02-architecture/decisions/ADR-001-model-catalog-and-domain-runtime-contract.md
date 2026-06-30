---
id: ADR-001
title: Model Catalog And Domain Runtime Contract
status: accepted
date: 2026-06-30
owner: Context Engine delivery team
---

# ADR-001 - Model Catalog And Domain Runtime Contract

## Context

P3 Knowledge Domains need a stable embedding profile choice, a safe domain lifecycle API, and private runtime fencing. The pre-P3 ID-A review resolved gaps left by the phase-level F-003 spec and the P2 runtime-config implementation.

## Decision

Use a curated seeded model catalog, with OpenAI default embedding and synthesis profiles. Domain creation stores a required immutable `domains.embedding_profile_id` FK to an embedding profile. One global active synthesis profile remains in `runtime_settings` for LightRAG KG indexing and P7 chat synthesis in v1.

Use a slug `domains.id`, private `runtime_instance_id`, and monotonic `control_generation` on the domain row. Use a dedicated `domain_operations` table for create/start/stop/delete lifecycle history and concurrency. Compute `available` at read time from domain state, active operation absence, and private controller health.

## Options Considered

- Generic jobs table: rejected because lifecycle operation ownership belongs to Domains and generic workflow infrastructure is out of scope.
- Runtime manifest or JSON metadata table: rejected because DATA-001 bans generic JSON settings and extra runtime truth sources.
- Persisted availability or health columns: rejected because health stales quickly and must be computed.
- UUID public domain id: rejected in favor of admin-chosen slugs for URLs and operator ergonomics.
- Global default embedding setting: rejected because each domain must lock its embedding profile at create.

## Consequences

- P2 seeds catalog profiles and validates model names against the catalog.
- P3 domain create must validate `embeddingProfileId` through the trusted runtime resolver.
- Embedding profiles referenced by any domain are read-only through admin profile APIs.
- Member `GET /domains` omits unavailable domains entirely.
- Stale workers must match both `runtime_instance_id` and `control_generation` before mutating domain state.

## Migration/Rollback

P2 catalog seeding is additive and uses normal `model_profiles` rows. P3 schema changes add `domains` and `domain_operations`; rollback can drop those additive tables before production data exists, while destructive cleanup after real domains requires explicit compensation.

## Validation

- P2 tests prove catalog seeding, safe `isDefault` DTOs, default synthesis activation, catalog allowlist, resolver behavior, and embedding-profile in-use guard.
- P3 tests must prove domain migrations, one-active-operation uniqueness, member available-only filtering, delete/recreate fencing, and safe DTO snapshots.

## Related Specs/Contracts

- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/04-features/F-002-trusted-runtime-config/`
- `specs/04-features/F-003-knowledge-domains-runtime/`
