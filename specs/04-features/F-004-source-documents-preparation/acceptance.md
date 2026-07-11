---
id: F-004
title: Source Documents And Canonical Preparation Acceptance Evidence
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Acceptance Evidence

Status: implemented.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | `test_upload_stores_private_original_rejects_duplicate_and_returns_safe_dtos` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q`; `./.venv/bin/python -m pytest -q` | pass | Upload stores immutable original bytes under private source storage, records hash/size/frozen parser kind, and returns only safe lifecycle DTOs. |
| AC-002 | `test_upload_stores_private_original_rejects_duplicate_and_returns_safe_dtos` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q` | pass | Same SHA-256 in the same Knowledge Domain returns `409 source_duplicate`; the same bytes in a different domain are accepted. |
| AC-003 | `test_docling_and_reducto_fixtures_normalize_to_same_prepared_source_shape` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q` | pass | Synthetic Reducto `chunks[].blocks[]` and Docling `body` walk fixtures normalize to the same `PreparedSource` Source Block order, kind, page, section, markdown, and image hash semantics. |
| AC-004 | `test_failed_parse_leaves_source_pending_with_failed_operation` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q` | pass | Parser failure records a safe failed preparation operation and leaves the Source Document `pending` with zero Source Blocks. |
| AC-005 | `test_retry_preserves_frozen_parser_kind_after_runtime_setting_changes` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q` | pass | Retry increments `preparation_generation` and queues a new prepare operation while keeping the upload-time frozen `parser_kind` despite later global parser-setting changes. |
| AC-006 | `test_source_delete_removes_rows_and_private_files` and `test_domain_delete_worker_purges_sources_before_hard_delete` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q`; `./.venv/bin/python -m alembic upgrade head --sql` | pass | Source delete removes private original/image files plus source rows/blocks/images; domain delete worker purges sources before final domain hard delete. |
| AC-007 | `test_p4_source_services_do_not_import_or_call_lightrag` in `tests/test_sources.py`; `./.venv/bin/python -m pytest tests/test_sources.py -q`; `./.venv/bin/python -m pytest -q` | pass | P4 source API/service/worker code has no LightRAG import/call/`ainsert`; P4 stops at canonical Source Blocks. |

## Completion Rule

Do not mark this feature implemented until every criterion has real command output, snapshot, screenshot, fixture, review note, or runbook evidence.

## Additional Evidence

- `test_fresh_migration_creates_source_tables_without_forbidden_columns` proves P4 migration tables, constraints, indexes, and forbidden-column omissions.
- `test_worker_success_publishes_blocks_all_or_none_and_outline_is_structural` proves all-or-none publish and safe structural outline DTOs without canonical Markdown exposure.
- `test_cancel_fences_stale_publish` proves cancel/generation fencing blocks stale worker publish.
- `test_source_admin_routes_forbid_members` proves P4 source routes are Administrator-only.
- `tests/snapshots/f004_openapi.json` captures P4 source APIs including explicit multipart `file` request-body metadata.
