# F-000 Shared Contract

Status: implementation handoff draft.

## Purpose

Global UI guardrails for every frontend slice. Use this before any route-specific mockup.

## Specs

- `specs/04-features/F-000-shared-contract/spec.md`
- `specs/00-governance/constitution.md`
- `CONTEXT.md`
- `DESIGN.md`
- `README.md`
- `REFERENCES.md`

## Reference Pack Notes

Folded from `.references/feature-ce-api-uiux-wirering-brainstorm/F-000-shared-contract.md` and `00-system-wiring-map.md`.

Junior checklist:

```text
read CONTEXT.md vocabulary
confirm browser never talks to LightRAG, DB, storage, provider, or controller
follow build order P1 -> P9
unknown contract -> fixture task, not guessed code
```

## ASCII Mockup

```text
Browser UI
  owns: route state, form state, selection state, visual state
  sends: safe DTOs only
  x no tokens, secrets, provider controls, LightRAG calls, paths, Docker

Context Engine API
  owns: auth, authz, lifecycle, retrieval, evidence, chat route, audit

Private backends
  Postgres, storage, worker, controller, LightRAG, providers, parsers
```

## Product Vocabulary

Use exact terms:

```text
Knowledge Domain
Source Document
Canonical Source
Source Block
Evidence
Citation
Conversation
Turn
Runtime Node
Wiki Page
Smart Composer
```

Do not introduce tenant, workspace, project, asset, chunk, public LightRAG API, or browser controller target unless a spec adds it.

## UI Rules

```text
Structure:
  old CE client routes/layout where F-009 says port

Skin:
  Local Studio dark-first compact workstation

Wire:
  API-001, EVT-001, DATA-001, AI-001 only
```

## Shared Stop Lines

- Unknown API field shape -> fixture-capture task.
- Contract drift -> update spec/contract before UI.
- Source navigation -> blocked until opaque source-ref contract.
- F-010 dashboards/node/cost/log browser -> blocked until F-010 contracts.
- F-011 wiki writes/review/publish -> blocked until F-011 contracts.

## Acceptance Reminder

Each frontend slice needs:

```text
spec read
contract read
typed API/SSE wrapper
member/admin authz proof
safe error/empty/loading state
dark/light visual check
no secret/path/raw payload scan
acceptance + traceability update
```
