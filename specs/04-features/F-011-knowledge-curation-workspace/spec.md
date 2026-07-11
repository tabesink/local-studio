---
id: F-011
title: Knowledge Curation Workspace Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-07
depends_on: [F-001, F-007, F-009, F-010]
supersedes: []
---

# F-011 - Knowledge Curation Workspace

Phase: P11

## Outcome

P11 introduces the governed wiki curation workspace. Authenticated users can draft Wiki Contributions from curated knowledge context, submit them for review, and Administrators can publish or reject submitted contributions. Publishing creates immutable Wiki Revisions and updates the current Wiki Page pointer through backend authorization.

The first P11 slice is manual-only. Smart Composer is the Local Studio-parity UI workflow around Wiki Contributions; it does not generate or rewrite text through AI in v1.

## Why Now

P10 makes the current app runnable. The next application slice turns chat/evidence work into governed, reviewable knowledge curation without copying the Obsidian Smart Composer runtime or widening the browser/private-service boundary.

## Reference Evidence

`.references/obsidian-smart-composer_impl_docs/` is evidence for composer UX, evidence/citation presentation, conversation history, prompt-template ideas, and diff-review interaction patterns.

Do not port:

- Obsidian host APIs, vault APIs, or plugin lifecycle;
- local persistence, local RAG, provider calls, OAuth, MCP, direct filesystem writes, or direct apply behavior;
- provider credentials, constants, local model/provider controls, or browser prompt compilation.

## Actors

Members, Administrators, reviewers, frontend developers, backend developers, delivery reviewers.

## In Scope

- Wiki Page read APIs for authenticated users.
- Wiki Contribution draft/create/update/read/list/submit APIs.
- Administrator review list/read/publish/reject APIs.
- Immutable Wiki Revision persistence.
- Current Wiki Page pointer update through a backend publish transaction.
- Member-owned private drafts; submitted contributions visible to Administrators for review.
- Optional evidence traceability from approved turn-scoped Evidence refs, stored as typed contribution evidence-ref rows.
- Redaction/delete invalidation rules that block unsafe publish and hide invalidated pages from member reads.
- Thin Next.js Smart Composer/review UI only after API/DATA contracts and backend DTOs exist.
- F-012 may use published Wiki Pages as read-only composer refs when pages are `published` with a current revision; discovery/validation remains backend-owned and never exposes raw private ids.
- Local Studio visual parity for any shipped UI.

## Out Of Scope

- AI-assisted drafting, rewriting, summarizing, or scoring.
- P11 SSE streams.
- Wiki Page hard delete, contribution delete, archive/unpublish, exports, attachments, source file apply, or direct source mutation.
- New retrieval paths, browser-selected retrieval controls, second vector store, or local RAG.
- Browser model/provider/prompt controls or provider API calls.
- Runtime Node, Node Environment, Logs, Usage, storage summaries, Docker environment UI/API, and worker container work from P10.
- Obsidian runtime/vault/provider/OAuth/MCP/filesystem behavior.
- Raw source text, raw Evidence, prompts, assistant answers, provider payloads, raw LightRAG hits, paths, runtime targets, Docker targets, storage targets, stack traces, credentials, private Wiki Revision ids, or private Source Block ids in public DTOs, logs, fixtures, screenshots, or acceptance evidence.

## Functional Requirements

| ID | Requirement | Source | Verification |
| --- | --- | --- | --- |
| FR-001 | Authenticated Members and Administrators can create and update their own draft Wiki Contributions. | CONTEXT.md, API-001 | API tests |
| FR-002 | Contribution drafts are private to the owner until submitted. Administrators can read submitted contributions for review. | QA-002, API-001 | authz tests |
| FR-003 | A draft contribution can be submitted exactly once into review state unless rejected or blocked by invalid context. | DATA-001 | state-machine tests |
| FR-004 | Administrators can publish submitted contributions. Publish creates one immutable Wiki Revision and updates the Wiki Page current revision in one transaction. | DATA-001 | integration tests |
| FR-005 | Administrators can reject submitted contributions with a safe optional reviewer note. | API-001 | route tests |
| FR-006 | Publishing the same already-published contribution is idempotent and returns the existing safe publish result. | API-001, DATA-001 | idempotency test |
| FR-007 | Conflicting concurrent publish attempts cannot create duplicate revision numbers or overwrite existing revision content. | DATA-001 | concurrency/repository test |
| FR-008 | Contribution evidence refs, if supplied, must be authorized owner-scoped turn evidence refs and must not be redacted. | API-001, DATA-001 | authz/redaction tests |
| FR-009 | Source/domain redaction or delete invalidates affected draft/submitted contributions and marks affected published Wiki Pages unavailable to Members until reviewed. | DATA-001 | redaction/delete tests |
| FR-010 | Published Wiki Pages are readable by authenticated users only while `state = published`. Pages in `needs_review` or `archived` are Administrator-readable only. | API-001 | role tests |
| FR-011 | P11 v1 uses normal JSON APIs only. No P11 SSE or AI provider call is introduced. | EVT-001, AI-001 | import/route audit |
| FR-012 | Frontend Smart Composer UI, when implemented, uses typed Context Engine API wrappers only and stores no durable draft truth in browser storage. | DESIGN.md, QA-002 | frontend tests/audit |

## Data And Contracts

Contracts patched by F-011:

- API-001: Wiki Page, Wiki Revision, Wiki Contribution, review/publish/reject routes and safe DTOs.
- DATA-001: `wiki_pages`, `wiki_revisions`, `wiki_contributions`, `wiki_contribution_evidence_refs`, wiki state machines, redaction invalidation, audit event additions.

Contracts intentionally not changed for v1:

- AI-001: no Smart Composer AI assist in F-011 v1. F-012 prompt assembly may read published Wiki Page revision bodies server-side as private composer context only.
- EVT-001: no P11 streaming in F-011 v1. F-012 chat SSE may project safe accepted Wiki ref labels in terminal/replay events.

## Primary Flows

### Draft and Submit

```text
Member/Admin opens Smart Composer
  -> POST /api/v1/wiki/contributions
  -> PATCH /api/v1/wiki/contributions/{id}
  -> POST /api/v1/wiki/contributions/{id}:submit
  -> state becomes submitted
```

### Review and Publish

```text
Administrator lists submitted contributions
  -> GET /api/v1/admin/wiki/contributions
  -> POST /api/v1/admin/wiki/contributions/{id}:publish
  -> transaction locks page/contribution
  -> creates immutable Wiki Revision
  -> updates wiki_pages.current_revision_id
  -> contribution state becomes published
```

### Reject

```text
Administrator reviews submitted contribution
  -> POST /api/v1/admin/wiki/contributions/{id}:reject
  -> state becomes rejected
  -> optional safe reviewerNote is stored
```

### Evidence Invalidation

```text
Source Document or Knowledge Domain delete/redaction
  -> find contribution evidence refs tied to affected turn evidence refs
  -> draft/submitted contributions become blocked
  -> published current pages with invalidated revision refs become needs_review
  -> member reads hide needs_review pages
```

## Exceptions

| Condition | Required behavior | Evidence |
| --- | --- | --- |
| Unauthenticated request | `401 unauthenticated` | route tests |
| Member reads another user's draft | `404 wiki_contribution_not_found` | authz tests |
| Member calls admin review/publish/reject | `403 forbidden` and safe audit event | authz/audit tests |
| Contribution contains invalid/redacted evidence ref | `409 wiki_contribution_context_unavailable` | route tests |
| Invalid state transition | `409 wiki_contribution_state_conflict` | state-machine tests |
| Concurrent publish conflict | `409 wiki_page_conflict` or idempotent existing result | repository tests |
| Audit write unavailable for protected admin mutation | rollback mutation and return `503 audit_unavailable` | integration test |

## Acceptance Criteria

- AC-001: F-011 API/DATA contracts define P11 routes, DTOs, tables, state machines, roles, and safety rules.
- AC-002: Fresh Alembic upgrade creates wiki tables, constraints, and indexes.
- AC-003: Member/Admin contribution create/update/submit flow passes with owner-scoped authz.
- AC-004: Administrator publish creates an immutable Wiki Revision and updates the Wiki Page current revision atomically.
- AC-005: Administrator reject records a safe rejection state/note and does not create a revision.
- AC-006: Invalid state transitions, duplicate/conflicting publish, invalid evidence refs, and redacted refs fail safely.
- AC-007: Published pages are readable by authenticated users only while published; drafts/submitted/rejected/blocked contributions remain scoped by role/owner.
- AC-008: Source/domain redaction invalidates affected contributions/pages according to DATA-001.
- AC-009: Safety scan over API examples, DTO snapshots, logs/audit fixtures, screenshots if any, and acceptance evidence finds no forbidden private data.
- AC-010: If frontend UI ships in the slice, visual checks satisfy DESIGN.md and the UI uses typed API wrappers only.

## Resolved Decisions

| ID | Decision | Applies to |
| --- | --- | --- |
| P11-D1 | First P11 slice is manual-only; no AI assist or P11 SSE. | spec, API, AI, EVT |
| P11-D2 | Members and Administrators may draft and submit their own contributions; Administrators review/publish/reject submitted contributions. | API, DATA |
| P11-D3 | Drafts are owner-private; submitted contributions are visible to Administrators. | API |
| P11-D4 | Publishing is synchronous and transactional in v1. No P11 worker service. | DATA, services |
| P11-D5 | Wiki Revisions are immutable. Page current state changes through publish or redaction invalidation. | DATA |
| P11-D6 | Evidence refs are optional and typed; raw source/Evidence text is not persisted in wiki tables. | DATA, QA |
| P11-D7 | P10 Runtime Node/Logs/Usage/storage/Docker work remains outside P11. | scope |
| P11-D8 | F-012 may expose published Wiki Pages as governed chat composer refs; this does not add AI-assisted Smart Composer, wiki writes from chat, or raw wiki body DTOs. | F-012, API, AI |

## Risks And Assumptions

- Risk: copying Smart Composer runtime behavior introduces direct provider/vault/filesystem access. Mitigation: reference adaptation is UX-only.
- Risk: public DTOs leak evidence/source details. Mitigation: safe DTO tests and no raw excerpt storage in P11 tables.
- Risk: wiki publish conflicts create duplicate revisions. Mitigation: unique constraints and transaction tests.
- Risk: P11 UI appears before backend contracts. Mitigation: typed API wrappers only after API-001/DATA-001 patch and backend DTO tests.
- Assumption: Manual contribution workflow is enough for the first P11 vertical slice.
