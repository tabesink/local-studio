---
id: F-009
title: Frontend Delivery UX And State Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - UX And State Contract

## Surface

Production UI phase. **Port** old Context Engine client layout, routes, and interaction geometry from `.references/code/context-engine/client/`. **Restyle** every surface with Local Studio compact dark-first grammar from `DESIGN.md`.

Authoritative port contracts: `ce-client-port-and-parity.md`, `context-panel-tabs.md`.

## Shell And Navigation

```text
┌────┬──────────────────────────────────────────────┬──────────────┐
│Rail│              Primary canvas                  │ Route panel  │
│w-14│  /chat | /documents | /database-visualize  │ (per route)  │
│icon│                                              │              │
└────┴──────────────────────────────────────────────┴──────────────┘
Settings opens as global dialog overlay, not a primary rail route.
```

| Route | Layout pattern | Port source |
| --- | --- | --- |
| `/chat` | two-column: thread + **ContextPanelShell** (v1 tab: `context`) | `LightRagChatShell.tsx`, `context-panel-tabs.md` |
| `/documents` | list + inline PDF preview (50% lg+, drawer mobile) | `DocumentRoute.tsx`, `DocumentPreviewPanel.tsx` |
| `/database-visualize` | full-height sigma graph + floating controls | `GraphViewer.tsx` |
| Settings | dialog with left sub-nav + panels | `SettingsDialog.tsx` |

## User/System Flow

```text
Read F-009 spec + ce-client-port-and-parity.md
-> port CE structure for the slice
-> restyle with DESIGN.md / Local Studio primitives
-> wire P1-P8 contracts only
-> run proof checks
-> update acceptance and traceability
```

## Route-Specific UX Rules

### Documents

- Single `/documents` route; no nested document detail page.
- Table row click opens `DocumentPreviewPanel` in RoutePageShell `after` slot.
- PDF via blob URL + native `<object>`; panel chrome uses DESIGN.md tokens.
- Admin upload via modal; member sees read-only library.

### Chat

- Domain selector required every turn (backend enforced).
- Evidence renders before answer tokens (P7 SSE).
- Right panel: **ContextPanelShell** with tab registry; v1 **`context`** tab ports session context + source inspector from old CE.
- Tab bar may be minimal when only `context` is registered; router/registry required for future tabs (terminal, side-chat, operations).
- See `context-panel-tabs.md`.

### Graph

- Keep path `/database-visualize`.
- Domain-scoped graph refresh on domain change.
- Properties/detail in graph control stack or side inspector — not a competing dashboard layout.

## Loading, Empty, Error, Forbidden

- API clients preserve safe request IDs where returned.
- Use Local Studio `PageState`, `ErrorBox`, and compact loading from `DESIGN.md`.
- Backend-only phases expose safe status DTOs; UI does not guess private internals.
- `/forbidden` for member access to admin-only direct URLs.

## Accessibility And Visual Rules

- Follow `DESIGN.md`, `ce-client-port-and-parity.md`, and `context-panel-tabs.md`.
- Icon-only rail and toolbar controls need labels/tooltips.
- Settings dialog and preview drawer: focus trap, Escape close, title/description, opener focus restore.
- Tables/lists: keyboard access and stable 24–28px row heights.
- Status: dot/pill + text; never color alone.
