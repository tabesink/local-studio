---
id: F-012-ACCEPTANCE
title: Governed Context Assembly Acceptance Evidence
status: completed
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012]
supersedes: []
---

# F-012 - Acceptance Evidence

Status: accepted with one visual tooling note.

| Criterion | Evidence | Result | Notes |
| --- | --- | --- | --- |
| AC-001 | F-012 docs plus API-001, AI-001, DATA-001, EVT-001, F-009, F-011, feature register, and change log patches | pass | F-009 `/chat` direction now points to the F-012 three-region workbench |
| AC-002 | `tests/test_governed_context_assembly.py::test_fresh_migration_creates_governed_context_tables` | pass | New tables and `conversation_turns.composer_ref_fingerprint`; no raw token column |
| AC-003 | `tests/test_governed_context_assembly.py::test_composer_ref_discovery_seeds_templates_and_returns_hashed_tokens` | pass | Discovery returns safe refs only; stored token is SHA-256 hash |
| AC-004 | `tests/test_governed_context_assembly.py::test_template_ref_turn_persists_accepted_refs_and_private_assembly` | pass | Template ref validates, accepted metadata persists, private body reaches adapter only |
| AC-005 | `tests/test_governed_context_assembly.py::test_expired_composer_ref_token_fails_before_turn_claim` | pass | Expired token returns `409 composer_ref_unavailable` before turn claim |
| AC-006 | `tests/test_governed_context_assembly.py::test_template_ref_turn_persists_accepted_refs_and_private_assembly` | pass | `ConversationTurn.user_message` remains original text |
| AC-007 | `tests/test_governed_context_assembly.py::test_template_ref_replay_uses_fingerprint_without_revalidating_expired_token` | pass | Same-token replay succeeds after token expiry; changed ref token conflicts |
| AC-008 | F-012 tests plus focused P7 suite | pass | `acceptedRefs` appears in history and `done`; not in stage/token events |
| AC-009 | `cd frontend && npm run typecheck && npm test`; `npm run build`; `curl -I http://localhost:3002/chat` | pass with tooling note | Browser screenshot tooling unavailable. Dev server watcher hit OS ENOSPC; production server responded 200 on port 3002 |
| AC-010 | Targeted scan: `rg -n "raw|templateBody|provider_payload|runtime_url|stack_trace|sourceText|rawPrompt|Authorization|Bearer " tests/snapshots/f012_openapi.json frontend/src/features/chat frontend/src/lib/api/sse.ts` | pass | No matches |

## Verification Commands

- `.venv/bin/python -m pytest tests/test_governed_context_assembly.py` -> 7 passed.
- `.venv/bin/python -m pytest tests/test_governed_context_assembly.py tests/test_grounded_streaming_chat.py tests/test_wiki_curation.py tests/test_conversations.py tests/test_observability.py` -> 42 passed.
- `cd frontend && npm run typecheck` -> pass.
- `cd frontend && npm test` -> 14 passed.
- `cd frontend && npm run build` -> pass.
- `curl -I http://localhost:3002/chat` against production `next start` -> HTTP 200.

## Completion Rule

F-012 is complete for this slice. Remaining non-slice items are attachments, queue/steer/follow-up, compaction, member model choice, terminal/filesystem/Git/browser panels, plugin loading, and browser-side RAG.
