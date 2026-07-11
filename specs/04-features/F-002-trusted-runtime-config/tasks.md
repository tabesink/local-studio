---
id: F-002
title: Trusted Runtime Config Task List
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001]
supersedes: []
---


# F-002 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, `CONTEXT.md`, relevant contracts, and this feature folder.
  - Verification: implementation response lists specs read.
- [x] T-010 [backend/data] Add migrations/models for provider configs, model profiles, runtime settings.
  - Verification: Fresh migration and constraint tests.
- [x] T-020 [backend/security] Implement encryption key validation and secret crypto service.
  - Verification: Ciphertext/no-plaintext tests.
- [x] T-030 [backend/api] Implement admin runtime-settings routes and DTOs.
  - Verification: 403 and safe DTO snapshots.
- [x] T-040 [backend/service] Implement `TrustedRuntimeResolver` with no network calls.
  - Verification: Resolver unit tests.
- [x] T-050 [backend/service] Seed curated model catalog and expose safe `isDefault` metadata.
  - Verification: `test_startup_seeds_provider_rows_catalog_and_safe_get`.
- [x] T-060 [backend/service] Add catalog allowlist validation, default synthesis activation, embedding resolver, and embedding-profile in-use guard.
  - Verification: `test_provider_credential_rotation_updates_same_row_sets_default_and_stays_private`, `test_model_profile_catalog_and_active_synthesis_validation`, `test_embedding_profile_in_use_blocks_patch_and_delete`, and `test_trusted_runtime_resolver_decrypts_private_config_without_network_calls`.
- [x] T-900 [verification] Run every check named in `test-plan.md`.
  - Verification: acceptance evidence updated.
- [x] T-910 [traceability] Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.
  - Verification: register status and evidence links current.

## Parallelization Notes

Parallel work is allowed only when tasks touch independent files and share no contract or migration ownership. Data/contract tasks must land before consumers.
