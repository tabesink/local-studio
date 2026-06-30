---
id: F-004
title: Source Documents And Canonical Preparation UX And State Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - UX And State Contract

## Surface

Admin API supports later documents library, upload dialog, outline, and operations surfaces. No member source-content route in this phase.

## User/System Flow

```text
Read feature spec
-> implement named contracts and state transitions
-> run proof checks
-> update acceptance and traceability
-> stop before next phase
```

## Loading, Empty, Error, Forbidden

- API clients must preserve safe request IDs where returned.
- UI-facing phases use Local Studio compact loading, empty, error, and forbidden states from `DESIGN.md`.
- Backend-only phases expose safe status DTOs that later UI slices can render without guessing private internals.

## Accessibility And Visual Rules

- Frontend work must follow `DESIGN.md`.
- Icon-only controls need labels/tooltips.
- Dialogs require focus trap, Escape close, title/description, and opener focus restore.
- Tables/lists must support keyboard access and stable row heights.
