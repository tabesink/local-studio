---
id: F-011
title: Knowledge Curation Workspace Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-011]
supersedes: []
---

# F-011 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | contract review | API-001 and DATA-001 capture P11 route/table/state behavior |
| AC-002 | migration/integration | fresh database upgrades to wiki schema with constraints |
| AC-003 | API/service | member/admin create, update, read, list, and submit own contributions |
| AC-004 | API/service | admin publish creates immutable revision and updates page current revision atomically |
| AC-005 | API/service | admin reject stores safe rejection state/note and creates no revision |
| AC-006 | API/service | invalid transitions, invalid refs, redacted refs, duplicate publish, and conflicts fail safely |
| AC-007 | API/authz | published page reads, draft/submitted/rejected/blocked scoping, 401/403/404 behavior |
| AC-008 | integration | source/domain redaction invalidates affected contributions/pages |
| AC-009 | security/safety | no forbidden private data in DTOs, OpenAPI examples, logs/audit fixtures, screenshots, or acceptance evidence |
| AC-010 | frontend/visual | typed API wrappers and Local Studio visual parity if UI ships |

## Backend Test Matrix

- Fresh Alembic upgrade creates P11 tables, FKs, unique constraints, indexes, and closed-state checks.
- Member creates and updates own draft.
- Member cannot read another user's draft.
- Member submits own draft.
- Member cannot publish or reject.
- Administrator lists submitted contributions.
- Administrator publishes submitted contribution.
- Administrator rejects submitted contribution with safe note.
- Publish creates exactly one immutable revision.
- Re-publish of already-published contribution returns existing safe result.
- Concurrent/stale publish returns safe conflict and creates no duplicate revision.
- Invalid contribution state transitions return `wiki_contribution_state_conflict`.
- Invalid, unauthorized, or redacted evidence refs return `wiki_contribution_context_unavailable`.
- Source/domain delete invalidates draft/submitted contributions and current pages tied to affected refs.
- Protected admin mutations roll back if audit write fails.

## Frontend Test Matrix

Only required if P11 UI ships in this slice:

- API wrapper tests for wiki pages, contributions, submit, publish, and reject.
- Component tests for draft, submitted, published, rejected, blocked, permission denied, empty, loading, and conflict states.
- Import audit proving components do not call providers, LightRAG, Docker, storage, database, controller, runtime targets, or raw fetch outside approved wrapper.
- Browser storage audit proving no durable draft truth, token, prompt, source text, answer text, evidence excerpt, provider value, or private target is persisted.

## Visual Checks

Only required if P11 UI ships:

- `1440x900` dark.
- `1440x900` light.
- `1280x800` dark.
- narrow viewport.
- draft composer state.
- submitted/review state.
- publish/reject state.
- permission denied state.
- empty and conflict/error states.

## Safety Scan Scope

Scan:

- P11 API responses and OpenAPI examples.
- audit/log fixtures.
- trace fixtures if any.
- screenshots if generated.
- acceptance evidence.
- feature docs and contracts.

Fail on concrete instances of:

- credentials or token-looking values;
- raw prompt text;
- raw source text;
- raw assistant answer text in audit/log/safety fixtures;
- raw provider payload;
- raw LightRAG hit;
- private Source Block ids in public DTOs;
- storage, runtime, Docker, provider, controller, or database targets;
- stack traces or host paths.

Policy words and env var names are allowed.

## Exit Criteria

F-011 is complete only when backend migration/API/state-machine/security evidence passes, frontend evidence passes if UI ships, acceptance evidence is updated, and traceability reflects implemented status.
