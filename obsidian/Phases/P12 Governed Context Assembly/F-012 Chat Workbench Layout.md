---
type: architecture
phase: P12
feature: F-012
status: active
layer:
  - frontend
spec: specs/04-features/F-012-governed-context-assembly/ux.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p12
  - feature/f-012
  - type/architecture
  - layer/frontend
  - status/active
  - architecture
---

# F-012 Chat Workbench Layout

Three-region `/chat` inside authenticated shell. Local Studio visual parity; no LS runtime tools.

Parent: [[P12 Index]]. UX contract: `specs/04-features/F-012-governed-context-assembly/ux.md`.

---

## Desktop layout (≥1180px)

```text
Authenticated shell + compact icon rail
┌───────────────┬──────────────────────────────────────┬──────────────────────┐
│ LEFT          │ CENTER                               │ RIGHT                │
│ discover      │ conversation                         │ inspect              │
│               │                                      │                      │
│ Chats         │ timeline + running/terminal state    │ [Evidence][Refs]     │
│ Sources       │ anchored composer                    │ [Source][Wiki]       │
│ Wiki          │ ref chips + message                  │                      │
│ Templates     │ stop / retry / safe errors           │ safe metadata only   │
└───────────────┴──────────────────────────────────────┴──────────────────────┘
```

Narrow viewports: center primary; left/right as drawers or tabs.

---

## Composer behavior

- `@` opens ref discovery (`POST /composer-refs:discover`)
- Filters: Sources, Evidence, Wiki, Templates
- `Enter` submit; `Shift+Enter` newline; `Esc` close picker
- Chips show kind + safe label + remove — never token strings or private ids

---

## Frontend layering

```text
Components  →  render hook state only
Hooks       →  use-chat-workbench
API seam    →  typed ceFetch / SSE wrappers (no raw fetch in components)
Reducer     →  CE events: stage, evidence, token, done, error
```

Scaffold reference: `.reference-LS-frontend` chat-shell + agent-workspace slices. CE contracts replace LS fixture/runtime shapes.

---

## Forbidden controls (must stay absent)

Attachments, terminal, filesystem, Git, browser automation, Pi session id, host paths, model picker, provider controls, queue, steer, compact, plugin/skill discovery, raw prompt editor.

---

## Related

- [[P12 Index]]
- [[F-012 Governed Context Assembly Overview]]
- [[P9 Index]]
- [[Architecture Index]]

## Repo sources

- `specs/04-features/F-012-governed-context-assembly/ux.md`
- `specs/04-features/F-009-frontend-delivery/spec.md`
- `DESIGN.md`
- `.reference-LS-frontend/templates/nextjs-feature-demos/features/chat-shell/`
- `.reference-LS-frontend/templates/nextjs-feature-demos/features/agent-workspace/`
