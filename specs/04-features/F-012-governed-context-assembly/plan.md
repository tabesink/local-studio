---
id: F-012-PLAN
title: Governed Context Assembly Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-08
depends_on: [F-012]
supersedes: []
---

# F-012 - Plan

## Scope

Deliver governed composer refs, approved template refs, server-owned prompt assembly, safe accepted-ref metadata, and the three-region `/chat` workbench over the existing P7 conversation/turn path.

## Boundaries

- Backend remains authority for auth, ref validation, prompt assembly, retrieval, synthesis, persistence, redaction, logs, audit, and lifecycle.
- Browser renders typed API/SSE truth and stores no token, prompt, source, evidence, answer, or raw event payload.
- Local Studio materials are visual and architectural evidence only; Context Engine contracts replace runtime/API semantics.

## Data Changes

- Add `prompt_templates`, `composer_ref_tokens`, and `conversation_turn_composer_refs`.
- Add `conversation_turns.composer_ref_fingerprint` for idempotency conflict checks.
- Persist only safe accepted-ref labels/descriptions on turn refs; raw prompt assembly and resolved source/wiki/template bodies are not stored on turn rows.

## Implementation Sequence

1. Patch F-012 docs, API-001, AI-001, DATA-001, EVT-001, F-009, F-011, and traceability.
2. Add migrations/models and fresh-upgrade proof.
3. Add template catalog and composer ref discovery/validation services.
4. Add `PromptAssemblyService` and integrate it with P7 turn start, idempotency, and synthesis calls.
5. Project safe `acceptedRefs` through history, terminal/replay SSE, logs, traces, and audit metadata only where approved.
6. Build frontend typed chat API seam and CE event reducer.
7. Replace `/chat` placeholder with the three-region Local Studio-parity workbench.
8. Close acceptance, implementation log, traceability, OpenAPI snapshot, safety scan, and visual evidence.

## Risks

- Ref validation can create unsafe prompt assembly if target revalidation is skipped; mitigate by validating every target at turn start.
- Ref fingerprinting can break idempotent replay; mitigate with focused replay/conflict tests.
- Frontend can accidentally port Local Studio runtime controls; mitigate with static forbidden-surface scans and visual acceptance.
- Wiki refs have no domain-owned library model in F-011; require selected domain for v1 and keep any domain-specific wiki compatibility beyond published-page eligibility deferred.

## Rollback

F-012 is additive. Rollback disables new frontend controls, stops sending `composerRefTokens`, and leaves existing P7 turns compatible. Database downgrade drops F-012 tables/column after dependent rows are no longer needed.
