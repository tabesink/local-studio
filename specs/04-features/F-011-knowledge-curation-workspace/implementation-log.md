---
id: F-011
title: Knowledge Curation Workspace Implementation Log
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011]
supersedes: []
---

# F-011 - Implementation Log

Status: backend slice implemented and verified; frontend UI and OpenAPI snapshot remain deferred.

## Decisions And Deviations

| Date | Decision/deviation | Reason | Follow-up |
| --- | --- | --- | --- |
| 2026-07-07 | First P11 slice is manual-only Wiki Contribution draft/submit/review/publish. | Lowest-risk path from reconciled P11 gates; avoids uncontracted AI/SSE/provider behavior. | Patch AI-001/EVT-001 only when AI assist or streaming is approved. |
| 2026-07-07 | Members and Administrators may draft and submit their own contributions; Administrators review/publish/reject. | Preserves collaborative curation while keeping publish authority backend/admin-owned. | Implement route authz and owner scoping tests. |
| 2026-07-07 | Wiki Revisions are immutable and publish is synchronous/transactional in v1. | Prevents duplicate truth and avoids new worker infrastructure. | Add migration/service tests for idempotent and conflicting publish. |
| 2026-07-07 | Optional contribution evidence refs use approved turn-scoped evidence refs; wiki tables do not store raw source text or raw Evidence. | Keeps P7 private Source Document/Source Block ids out of public P11 surfaces. | Add safe DTO and redaction invalidation tests. |
| 2026-07-07 | P10 Runtime Node/Logs/Usage/storage/Docker surfaces remain outside P11. | Different operator/runtime contract surface and leakage risk. | Keep in F-010 carry-forward gates. |
| 2026-07-07 | Backend implementation added additive P11 wiki migration, ORM models, wiki service, routes, audit enum/metadata allow-list updates, and redaction invalidation hook. | Implements the manual contribution lifecycle without adding AI/SSE/frontend behavior. | Add OpenAPI snapshot and frontend UI in a later slice if still in scope. |
| 2026-07-07 | Publish is synchronous and idempotent for already-published contributions; audit failure rolls back the protected publish mutation. | Keeps the first backend gate simple and avoids uncontracted workers while preserving audit integrity. | Add a concurrent publish stress fixture only if the route becomes high-volume. |
| 2026-07-08 | Review fixes CHG-035: DTOs aligned to API-001 (`wikiPageId`, `publishedAt`, `publishedPageId`/`publishedRevisionId`, evidence-ref `id`, invalidated refs return null labels); page list ordered by newest update; `wiki_revisions.published_at` column plus `(wiki_page_id, published_at DESC)` and `(state, updated_at DESC)` indexes per DATA-001; migration 0008 amended in place (greenfield, no deployed DB) with wiki state `server_default`s; P11 OpenAPI snapshot captured. | ce-code-review #5–#8, #16, #19, #26, #30 — silent contract drift between the P11 implementation and API-001/DATA-001. | Pagination for admin contributions list (#17) deferred; see `docs/residual-review-findings/a85eb030.md`. |

## Verification Evidence

| Command | Result | Notes |
| --- | --- | --- |
| `.\.venv\Scripts\python.exe -m pytest tests\test_wiki_curation.py -q` | pass | 6 tests; one Starlette/httpx deprecation warning |
| `.\.venv\Scripts\python.exe -m ruff check context_engine\models.py context_engine\services\audit.py context_engine\services\wiki.py context_engine\services\chat_turns.py context_engine\api\routes.py tests\test_wiki_curation.py` | pass | changed backend/test files |
| `.\.venv\Scripts\python.exe -m pytest tests\test_wiki_curation.py tests\test_conversations.py::test_safe_turn_summary_and_conversation_detail_use_persisted_safe_fields tests\test_observability.py::test_admin_denial_is_audited_for_authenticated_members tests\test_sources.py::test_source_delete_removes_rows_and_private_files -q` | pass | 9 tests; covers adjacent evidence serialization, audit denial, and source delete regression |
| Forbidden-pattern scan over F-011 docs, API/DATA contracts, traceability docs, and changed backend/test files | pass | no concrete credentials, runtime/storage targets, stack traces, or private payload examples found |

## Implemented Files

- `migrations/versions/20260707_0008_wiki_curation_workspace.py`
- `context_engine/models.py`
- `context_engine/services/wiki.py`
- `context_engine/services/audit.py`
- `context_engine/services/chat_turns.py`
- `context_engine/api/routes.py`
- `tests/test_wiki_curation.py`
