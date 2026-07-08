---
id: F-012-LOG
title: Governed Context Assembly Implementation Log
status: completed
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012]
supersedes: []
---

# F-012 - Implementation Log

## 2026-07-08

- Started F-012 from `docs/plans/2026-07-08-001-feature-governed-context-assembly-plan.md`.
- Decision defaults locked from implementation plan: stored random composer ref tokens, `composerRefTokens` request field, `POST /composer-refs:discover`, safe `acceptedRefs` projection, `@` mention trigger, 1180px desktop workbench breakpoint, and the documented assembly caps.
- Added P12 data model and migration: `prompt_templates`, `composer_ref_tokens`, `conversation_turn_composer_refs`, and `conversation_turns.composer_ref_fingerprint`.
- Added backend prompt-template catalog seeding and safe composer ref discovery. Discovery returns only `refToken`, kind, label, description, and optional disabled reason shape; raw template bodies stay server-private.
- Added composer ref validation, hashed-token lookup, expiry checks, domain/source/evidence/wiki/template revalidation, ref caps, private request fingerprinting, and accepted-ref persistence.
- Added `PromptAssemblyService` and optional synthesis adapter assembly context. The stored user message remains the original member text.
- Added safe `acceptedRefs` projection to conversation history and terminal/replay SSE `done` events only.
- Updated redaction so accepted composer refs lose safe labels/descriptions when their owning turn is redacted; source deletion also finds turns that accepted source refs.
- Reworked `/chat` into a three-region workbench with discovery, timeline/composer, and inspector regions. Narrow layouts use region tabs while desktop `>=1180px` shows all three regions.
- Added `frontend/src/features/chat/api.ts`, `useChatSession.ts`, and `ChatPage.tsx`; network calls stay behind `ceFetch` and `postSse` wrappers.
- Added `tests/test_governed_context_assembly.py`, `tests/snapshots/f012_openapi.json`, and `frontend/tests/chat.test.mjs`.

## Deviations And Notes

- `apply_patch` could add new files but failed repeatedly on existing-file updates because the sandbox helper returned `bwrap: loopback: Failed RTM_NEWADDR`. Existing files were edited with exact-replacement Python scripts under escalation.
- Next dev mode could not be used for visual screenshots because both Turbopack and webpack dev watchers hit the OS file-watch limit (`ENOSPC`). Production `next build` and `next start` worked, and `/chat` returned HTTP 200 on `http://localhost:3002/chat`.
- Browser screenshot tooling was not available in this session, so AC-009 records production route reachability plus static layout/type/test evidence instead of screenshots.
