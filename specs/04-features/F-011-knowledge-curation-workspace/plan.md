---
id: F-011
title: Knowledge Curation Workspace Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011]
supersedes: []
---

# F-011 - Implementation Plan

## Build Strategy

Build the backend-owned wiki contribution workflow first, then wire UI. Do not add AI assist, SSE, exports, attachments, archive/delete, or P10 operator/runtime surfaces in the first slice.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| API | Add safe authenticated wiki routes and Administrator review routes under API-001. |
| Data | Add typed wiki tables, closed states, evidence-ref join rows, audit event names, and redaction invalidation rules under DATA-001. |
| AI | No change for v1. Smart Composer is manual drafting only. |
| SSE | No change for v1. All P11 operations use JSON request/response. |
| Backend services | Add wiki contribution/page/revision services with transaction-owned publish. |
| Frontend | Add Smart Composer/review UI only after backend DTOs exist; UI remains thin and Local Studio-parity. |
| Worker | No P11 worker service in v1. Redaction invalidation is a service hook called from existing delete/redaction flows. |
| Security/privacy | No raw source text, raw Evidence, prompts, provider payloads, private Source Block ids, paths, runtime targets, credentials, or stack traces in public surfaces. |
| Observability | Protected admin review actions write safe audit rows in the same transaction as product state changes. |

## Implementation Sequence

- [x] T-000 [docs] Patch F-011 source-of-truth package and API/DATA contracts.
  - Verification: spec, plan, tasks, test-plan, acceptance, ux, API-001, DATA-001, traceability updated.
- [x] T-010 [data] Add Alembic migration and ORM models for wiki pages, revisions, contributions, and contribution evidence refs.
  - Verification: fresh-upgrade migration test and model constraints.
- [x] T-020 [backend] Add repository/service layer for contribution create/update/list/read/submit.
  - Verification: owner-scoped API/service tests.
- [x] T-030 [backend] Add Administrator review list/read/reject/publish.
  - Verification: authz, audit, publish, reject, immutability, and conflict tests.
- [x] T-040 [backend] Add evidence-ref validation and redaction/delete invalidation hook.
  - Verification: invalid/redacted ref tests and source-delete invalidation test through the shared redaction hook.
- [ ] T-050 [api] Add OpenAPI snapshot coverage and safe DTO/error tests.
  - Verification: P11 OpenAPI snapshot deferred; backend safe DTO/error tests and safety scan recorded.
- [ ] T-060 [frontend] Add typed API wrappers and minimal wiki/Smart Composer UI.
  - Verification: typecheck, frontend tests, import/storage audit.
- [ ] T-070 [frontend] Add Local Studio-parity review/publish states and visual evidence if UI ships.
  - Verification: screenshot matrix or explicit deferral if backend-only.
- [x] T-900 [verification] Run backend checks in `test-plan.md`.
  - Verification: commands and results recorded in `acceptance.md`; frontend/OpenAPI snapshot checks remain deferred.
- [x] T-910 [traceability] Update acceptance, implementation log, feature register, matrix, and change log.
  - Verification: traceability paths current.

## Data Migration And Rollback

- Migration is additive: create new wiki tables and constraints.
- No destructive migration is planned.
- Rollback may drop P11 tables only before production data exists. After production data exists, use a forward migration and preserve wiki content.

## Risks

- State-machine drift: keep closed contribution/page states in DATA-001 and tests.
- Evidence privacy leak: use evidence ref ids only; no private Source Block ids in public DTOs.
- UI overreach: no AI, source apply, export, or archive/delete controls in the first slice.
- Concurrency: publish must be transactional with uniqueness constraints.
- Audit rollback: protected admin mutations must roll back if audit write fails.

## Deferred Work

- AI-assisted Smart Composer.
- P11 SSE streaming.
- Wiki archive/unpublish/delete.
- Contribution delete/discard endpoint.
- Exports and attachments.
- Source navigation beyond approved safe refs.
- Runtime Node, Logs, Usage, storage summaries, Docker environment UI/API.
