---
id: F-002
title: Trusted Runtime Config Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001]
supersedes: []
---


# F-002 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_encryption_key_required_and_validated_outside_test` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | `create_app` fails outside test when `CONFIG_ENCRYPTION_KEY` is missing or is not a valid Fernet key. |
| AC-002 | `test_startup_seeds_provider_rows_catalog_and_safe_get` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest`; `./.venv/bin/python -m alembic upgrade head --sql` | pass | Startup seeds provider rows plus the curated OpenAI/Bedrock model catalog; migration SQL includes `provider_configs`, `model_profiles`, and `runtime_settings`. |
| AC-003 | `test_provider_credential_rotation_updates_same_row_sets_default_and_stays_private` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | Credential rotation keeps the same provider row, changes ciphertext, stores no plaintext, decrypts privately, and activates the OpenAI default synthesis profile when eligible. |
| AC-004 | `test_startup_seeds_provider_rows_catalog_and_safe_get`, `test_provider_credential_rotation_updates_same_row_sets_default_and_stays_private`, and `test_openapi_snapshot_matches`; `./.venv/bin/python -m pytest` | pass | Safe GET and rotation responses exclude secret, credential, and ciphertext fields/values while exposing provider status, safe model metadata, and `isDefault`. |
| AC-005 | `test_reducto_parser_requires_reducto_credential` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | Switching parser kind to Reducto returns `provider_not_ready` until Reducto credentials are encrypted on the server. |
| AC-006 | `test_trusted_runtime_resolver_decrypts_private_config_without_network_calls` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | Resolver returns private decrypted synthesis/parser/embedding config while a network-call trap is installed; no provider SDK/network behavior is implemented. |
| AC-007 | `test_startup_seeds_provider_rows_catalog_and_safe_get` and `test_model_profile_catalog_and_active_synthesis_validation` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | Seeded catalog rows include OpenAI defaults and reject non-catalog model names. |
| AC-008 | `test_embedding_profile_in_use_blocks_patch_and_delete` and `test_trusted_runtime_resolver_decrypts_private_config_without_network_calls` in `tests/test_runtime_config.py`; `./.venv/bin/python -m pytest` | pass | Embedding resolver validates provider readiness with no network calls; embedding profiles referenced by a `domains.embedding_profile_id` FK are blocked from admin patch/delete. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.
