---
id: F-009-PORT
title: CE Client Port And Local Studio Parity Contract
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-07-02
depends_on: [F-009, DESIGN.md]
supersedes: []
---

# CE Client Port And Local Studio Parity

## Governing Rule

P9 frontend uses a **two-source** model:

```text
PORT (structure, routes, interaction geometry)
  ←  .references/code/context-engine/client/

RESTYLE (tokens, typography, density, primitives)
  ←  DESIGN.md + .references/code/local-studio/

WIRE (API/SSE DTOs, auth, eligibility)
  ←  specs/03-contracts/ P1–P8 only
```

Do not substitute Local Studio product routes (Status, Usage, Recipes, Models) for Context Engine navigation. Do not invent a new information architecture.

## App Shell — Port

Reference: `client/src/components/layout/`

```text
layout.tsx → Providers → AppLayout (auth gate)
              └── AppPageFrame
                    ├── AppSideRail     ← w-14 compact icon rail
                    └── route children
              └── SettingsDialog (global overlay)
```

### Side rail (retain order)

| Item | Target | Behavior |
| --- | --- | --- |
| Chat | `/chat` | route link |
| Documents | `/documents` | route link |
| Knowledge graph | `/database-visualize` | route link; do not rename without spec change |
| Settings | dialog | `openSettingsDialog("general")`; not a main nav route |
| Logout | action | bottom of rail |

Restyle rail with Local Studio tokens (`--color-sidebar`, icon `Button`). **Keep** compact icon rail geometry; do not replace with Local Studio's wide text sidebar.

## Route Map — Port

| Route | CE page | CE feature entry |
| --- | --- | --- |
| `/` | `app/page.tsx` | redirect → `/chat` |
| `/login` | `app/login/page.tsx` | standalone, no rail |
| `/chat` | `app/chat/page.tsx` | `features/chat/ChatRoute.tsx` → `LightRagChatShell` |
| `/documents` | `app/documents/page.tsx` | `features/documents/DocumentRoute.tsx` |
| `/database-visualize` | `app/database-visualize/page.tsx` | `features/graph/GraphViewer.tsx` |

Optional compat: `/settings/users` full-page users panel with rail hidden.

## Shared Route Chrome

Documents and Graph use `RoutePageShell` from `client/src/components/layout/route-page-chrome.tsx`:

- title + domain selector row (`RouteDomainSelectorRow`)
- scroll or fill content layout modes
- optional `after` slot (documents PDF preview)

Chat uses its own two-column shell — **not** `RoutePageShell`.

Restyle: replace `bg-white`, `text-neutral-*`, and other retired white-canvas classes with DESIGN.md tokens.

## Documents — Port Including PDF Viewer

Single route `/documents`. **No** `/documents/[id]` nested page.

```text
DocumentRoute
├── RoutePageShell
│   ├── DocumentLibraryTable + DocumentLibraryToolbar
│   └── after: DocumentPreviewPanel
│         └── DocumentPdfPreview
└── DocumentUploadDialog
```

### PDF preview behavior (retain)

| CE file | Port |
| --- | --- |
| `DocumentPreviewPanel.tsx` | row click opens panel; 50% desktop split; mobile overlay drawer |
| `DocumentPdfPreview.tsx` | fetch blob → `URL.createObjectURL` → `<object type="application/pdf">`; revoke on unmount |
| `pdf/contracts.ts`, `pdf/highlight-adapter.ts` | highlight structure (wire when contract exists) |

Restyle panel chrome only. PDF render mechanism stays.

**API gate:** preview blob fetch requires a captured safe contract. Old reference used `GET /documents/{id}/preview`. Do not wire until API-001 or a follow-on contract approves the rebuild equivalent.

## Graph — Port

`/database-visualize` → `GraphViewer.tsx` with sigma canvas and floating controls (`GraphControl`, `ZoomControl`, `LayoutsControl`, `Legend`, `PropertiesView`, etc.). Domain selector in route header. Restyle floating control surfaces; keep canvas behavior.

## Chat — Port

`LightRagChatShell.tsx` two-column layout:

```text
main (flex-1): header + ConversationView + ChatComposer
ContextPanelShell (tabbed; v1: context tab only)
  ContextTabPanel → SessionContextNavigation + SourceInspectorPane
```

Implement tab registry + router per `context-panel-tabs.md` (pattern from Local Studio `ComputerTabPanel`; content from old CE `SidePanel`).

Restyle composer and messages with Local Studio tokens. **Do not** flatten to single column.

## Settings Dialog — Port

`SettingsDialog.tsx` with route ids:

`general` | `account` | `knowledge-graph` | `provider` | `document-parsing`

Admin-only panels gated in UI; backend remains authority. Restyle with Local Studio `SettingsLayout` row grammar.

## Forbidden

- Replacing CE icon rail with Local Studio product sidebar tabs
- Hard-coded chat right panel with no tab registry (see `context-panel-tabs.md`)
- Moving PDF preview to a separate route or dropping the 50% inline split
- Renaming `/database-visualize` without spec update
- Shipping old CE white-canvas styling in production
- Copying stale v1 API paths from reference client without contract reconciliation

## Junior Dev Pack (evidence)

Terse slice wiring notes: `.references/feature-ce-api-uiux-wirering-brainstorm/`

That pack is evidence only. **`specs/04-features/F-009-frontend-delivery/`** (`ce-client-port-and-parity.md`, `context-panel-tabs.md`) is implementation authority.
