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

## Local Studio Chat Shell - Adapt, Do Not Copy

The Local Studio chat shell is evidence for interaction quality, not runtime authority. P9 may adapt:

- conversation timeline behavior: auto-scroll at bottom, "new messages" affordance when the user scrolls away, Markdown rendering, collapsible retrieval/activity rows, visible streaming state, retry, stop, and safe error recovery;
- compact composer grammar: text entry, selected domain/context chips, disabled/running state, keyboard submit, and clear stop/retry affordances;
- safe session actions when contracted: rename, pin/archive, and export.

P9 must not port Local Studio local-agent behavior:

- terminal, filesystem editor, Git panel, browser automation, host skills, Pi runtime, queue/steer/split-pane runtime controls, local JSONL session authority, or absolute `cwd` paths;
- browser-held model/controller selection, controller URL/API key storage, runtime port display, provider credentials, prompt/model/tool/retrieval route controls;
- attachments/source mentions/model-profile controls unless approved API/data contracts exist.

Context Engine chat remains server-authoritative: FastAPI owns conversation persistence, turn routing, domain authorization, model/profile resolution, retrieval, evidence, citations, redaction, and SSE.

## Settings Dialog — Port

`SettingsDialog.tsx` with route ids:

`general` | `account` | `knowledge-graph` | `provider` | `document-parsing`

Admin-only panels gated in UI; backend remains authority. Restyle with Local Studio `SettingsLayout` row grammar.

Settings must be split by ownership even when porting compact Local Studio fact-row UI:

- personal preferences: appearance, density, font, sidebar behavior, and personal chat/archive options when contracted;
- administration: provider/model/parser settings from P2 and domain/source administration from P3-P5;
- reserved post-P9 node/workspace settings: node access, runtime engines, diagnostics, Docker environments, shared skills/tools, and workspace policy. These are F-010/F-011 gates and must not appear as working controls in P9 without approved contracts.

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
