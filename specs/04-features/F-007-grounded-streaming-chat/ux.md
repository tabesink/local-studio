---
id: F-007
title: Agentic Chat UX And State Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-006]
supersedes: []
---


# F-007 - UX And State Contract

## Surface

Chat UI (P9) **ports** old CE client two-column `LightRagChatShell`: thread + composer + **ContextPanelShell** with v1 **`context`** tab (`SessionContextNavigation`, `SourceInspectorPane`). Restyle with Local Studio tokens. Tab registry/router required for future panel tabs. Renders direct LLM turns, current-turn domain Evidence, token stream, safe stage labels, terminal states, and cancel. No source navigation until F-009 slice 16 contract exists.

The shell is route-agnostic. It shows no evidence rows for `direct_llm`, fills the context tab from `domain_rag` evidence SSE events, and never exposes route/model/tool/retrieval controls.

Port references: `ce-client-port-and-parity.md`, `context-panel-tabs.md`.

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
