---
id: F-011
title: Knowledge Curation Workspace Acceptance Evidence
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011]
supersedes: []
---

# F-011 - Acceptance Evidence

Status: backend slice implemented and verified; OpenAPI snapshot and frontend/UI evidence remain deferred.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | API-001/DATA-001 review | pass | P11 route/table contracts captured in API-001 and DATA-001 before backend implementation |
| AC-002 | `tests/test_wiki_curation.py::test_fresh_migration_adds_wiki_curation_tables` | pass | wiki tables, columns, unique indexes, and forbidden-column scan |
| AC-003 | `tests/test_wiki_curation.py::test_member_can_create_update_submit_and_admin_can_publish_once` | pass | member draft/create/update/list/submit and state-conflict checks |
| AC-004 | `tests/test_wiki_curation.py::test_member_can_create_update_submit_and_admin_can_publish_once` | pass | publish creates one immutable revision, updates current page, and duplicate publish replays existing result |
| AC-005 | `tests/test_wiki_curation.py::test_reject_and_evidence_ref_failures_are_safe` | pass | safe reviewer note and no revision on reject |
| AC-006 | `tests/test_wiki_curation.py::test_member_can_create_update_submit_and_admin_can_publish_once`; `tests/test_wiki_curation.py::test_reject_and_evidence_ref_failures_are_safe`; `tests/test_wiki_curation.py::test_publish_rolls_back_when_audit_is_unavailable` | pass | invalid transitions, invalid/unauthorized/redacted evidence refs, duplicate publish, and audit rollback |
| AC-007 | `tests/test_wiki_curation.py::test_members_cannot_review_and_admins_cannot_read_private_drafts`; `tests/test_wiki_curation.py::test_redacted_evidence_blocks_draft_and_hides_invalidated_page` | pass | 403/404 scoping, private drafts, and hidden invalidated page |
| AC-008 | `tests/test_wiki_curation.py::test_redacted_evidence_blocks_draft_and_hides_invalidated_page`; adjacent regression `tests/test_sources.py::test_source_delete_removes_rows_and_private_files` | pass | source delete path invalidates affected wiki draft and current page through shared redaction hook |
| AC-009 | safety scan command below | pass | changed docs/contracts contain no concrete forbidden private data |
| AC-010 | explicit backend-only deferral | deferred | no F-011 frontend UI shipped in this slice |

## Completion Rule

Do not mark full F-011 implemented until OpenAPI snapshot and frontend evidence are either completed or explicitly removed from scope by contract update.

## Verification Commands

- `.\.venv\Scripts\python.exe -m pytest tests\test_wiki_curation.py -q` -> pass, 6 tests, one Starlette/httpx deprecation warning.
- `.\.venv\Scripts\python.exe -m ruff check context_engine\models.py context_engine\services\audit.py context_engine\services\wiki.py context_engine\services\chat_turns.py context_engine\api\routes.py tests\test_wiki_curation.py` -> pass.
- `.\.venv\Scripts\python.exe -m pytest tests\test_wiki_curation.py tests\test_conversations.py::test_safe_turn_summary_and_conversation_detail_use_persisted_safe_fields tests\test_observability.py::test_admin_denial_is_audited_for_authenticated_members tests\test_sources.py::test_source_delete_removes_rows_and_private_files -q` -> pass, 9 tests, one Starlette/httpx deprecation warning.
- `Select-String` forbidden-pattern scan over F-011 docs, API/DATA contracts, traceability docs, and changed backend/test files -> pass.
