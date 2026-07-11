---
id: F-011
title: Knowledge Curation Workspace Task List
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011]
supersedes: []
---

# F-011 - Tasks

## Required Order

- [x] T-000 [docs] Read `AGENTS.md`, README, constitution, CONTEXT, DESIGN, F-009, F-010, F-011, API-001, DATA-001, EVT-001, AI-001, ARCH-002, QA-002, QA-003, and Smart Composer reference evidence.
  - Verification: implementation response lists specs read and scope decisions.
- [x] T-010 [data] Add migration/models for `wiki_pages`, `wiki_revisions`, `wiki_contributions`, and `wiki_contribution_evidence_refs`.
  - Verification: `tests/test_wiki_curation.py::test_fresh_migration_adds_wiki_curation_tables`.
- [x] T-020 [backend] Implement contribution draft create/update/read/list and submit.
  - Verification: `tests/test_wiki_curation.py::test_member_can_create_update_submit_and_admin_can_publish_once`.
- [x] T-030 [backend] Implement admin review list/read, publish, and reject.
  - Verification: `tests/test_wiki_curation.py::test_members_cannot_review_and_admins_cannot_read_private_drafts`; `tests/test_wiki_curation.py::test_reject_and_evidence_ref_failures_are_safe`.
- [x] T-040 [backend] Implement publish transaction, immutable revision creation, idempotent duplicate publish, and conflict handling.
  - Verification: `tests/test_wiki_curation.py::test_member_can_create_update_submit_and_admin_can_publish_once`; `tests/test_wiki_curation.py::test_publish_rolls_back_when_audit_is_unavailable`.
- [x] T-050 [backend] Implement evidence ref validation and redaction/delete invalidation hook.
  - Verification: `tests/test_wiki_curation.py::test_reject_and_evidence_ref_failures_are_safe`; `tests/test_wiki_curation.py::test_redacted_evidence_blocks_draft_and_hides_invalidated_page`.
- [ ] T-060 [api] Add P11 OpenAPI snapshot and safe DTO scan.
  - Verification: snapshot deferred; safety scan recorded in `acceptance.md`.
- [ ] T-070 [frontend] Add typed wiki API wrappers and minimal UI if this slice includes frontend.
  - Verification: typecheck, import/storage audit.
- [ ] T-080 [frontend] Add visual states and screenshots if UI ships.
  - Verification: DESIGN.md screenshot matrix or explicit UI deferral.
- [x] T-900 [verification] Run backend checks named in `test-plan.md`.
  - Verification: command output recorded in `acceptance.md`; frontend checks remain explicitly deferred.
- [x] T-910 [traceability] Update acceptance, implementation log, feature register, matrix, and change log.
  - Verification: traceability paths current.

## Blocked Until Later Contract Patch

- AI drafting/rewrite/summarization is blocked until AI-001 is patched.
- P11 SSE is blocked until EVT-001 is patched.
- Wiki archive/delete/export/attachments are blocked until API-001 and DATA-001 are patched.
- Source navigation beyond safe turn evidence refs is blocked until an opaque source-ref contract exists.
- P10 Runtime Node, Logs, Usage, storage, Docker environment UI/API, and worker-service work stays out of P11.
