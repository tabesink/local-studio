# CE Client Port Map — Structure from Old CE, Skin from Local Studio

**Rule:** Port layout, routes, and interaction geometry from `.references/code/context-engine/client/`. Restyle every surface with `DESIGN.md` / Local Studio tokens. Do not invent a new information architecture.

```text
PORT (behavior + structure)     ←  .references/code/context-engine/client/
RESTYLE (tokens + primitives)   ←  .references/code/local-studio/ + DESIGN.md
WIRE (data)                     ←  specs/03-contracts/ P1–P8 only
```

---

## App Shell — PORT

```text
layout.tsx → Providers → AppLayout (auth gate)
              └── AppPageFrame
                    ├── AppSideRail          ← icon nav (w-14)
                    └── {route children}     ← bordered content card
              └── SettingsDialog (global overlay, not a main route)
```

| CE file | Port |
| --- | --- |
| `src/app/layout.tsx` | root providers |
| `src/app/providers.tsx` | AppLayout + SettingsDialog + Toaster |
| `src/components/layout/AppLayout.tsx` | auth redirect: unauth→`/login`, auth on login→`/chat` |
| `src/components/layout/AppPageFrame.tsx` | rail + content card; hide rail on `/settings/*` |
| `src/components/layout/AppSideRail.tsx` | **nav panel — retain item order** |

### Side rail items (keep order + behavior)

```text
[logo]
──────
 Chat          → /chat
 Documents     → /documents
 Knowledge graph → /database-visualize
 Settings      → openSettingsDialog("general")   ← dialog, not route
────── (bottom)
 Logout
```

Restyle: replace `bg-muted/50`, `text-muted-foreground`, white active states with `--color-sidebar`, `--color-selected`, LS `Button variant="icon"`. Keep **compact icon rail** geometry (w-14), not a wide LS text sidebar.

---

## Route Map — PORT

| Route | CE page | CE feature entry | Port |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | redirect → `/chat` | yes |
| `/login` | `app/login/page.tsx` | standalone, no rail | yes |
| `/chat` | `app/chat/page.tsx` | `features/chat/ChatRoute.tsx` | yes — custom 2-col shell |
| `/documents` | `app/documents/page.tsx` | `features/documents/DocumentRoute.tsx` | yes — list + PDF panel |
| `/database-visualize` | `app/database-visualize/page.tsx` | `features/graph/GraphViewer.tsx` | yes — sigma canvas |
| `/settings/users` | `app/settings/users/page.tsx` | full-page users panel | optional compat |

**Do not rename** `/database-visualize` to `/graph` without spec change.

---

## Shared Route Chrome — PORT + RESTYLE

Documents and Graph use `RoutePageShell` from `src/components/layout/route-page-chrome.tsx`:

```text
RoutePageShell
├── RoutePageHeaderSection (title + domain selector row)
├── main section (scroll | fill)
└── after slot (optional — documents preview uses this)
```

| Element | Port | Restyle target |
| --- | --- | --- |
| `RoutePageTitle` | 22px title placement | `--fs-2xl`, `--color-foreground` |
| `RouteDomainSelectorRow` | domain selector + trailing actions | LS `Select`, `StatusPill` |
| `ROUTE_PAGE_*_CLASS` constants | scroll vs fill layout modes | drop `bg-white`; use `--color-background` |
| `LightRagDomainSelector` | domain-scoped routes | LS compact select; data from `GET /domains` |

Chat **does not** use `RoutePageShell` — port its own split layout (see below).

---

## Documents Route — PORT (incl. PDF viewer)

Single route `/documents`. **No** `/documents/[id]` nested page.

```text
/documents  (DocumentRoute.tsx)
├── RoutePageShell
│   ├── DocumentLibraryTable        ← list (left / main)
│   ├── DocumentLibraryToolbar      ← search, upload (admin)
│   └── after: DocumentPreviewPanel ← 50% split on lg+
└── DocumentUploadDialog
```

### PDF preview — retain pattern

| CE file | Behavior to port |
| --- | --- |
| `DocumentPreviewPanel.tsx` | row click → open panel; 50% desktop split; mobile overlay drawer |
| `DocumentPdfPreview.tsx` | fetch blob → `URL.createObjectURL` → `<object type="application/pdf">` |
| `pdf/contracts.ts`, `pdf/highlight-adapter.ts` | highlight hooks (future; structure OK to port) |

```text
Table row click
  → previewDocumentId state
  → DocumentPreviewPanel (after slot)
  → DocumentPdfPreview
       → fetch preview blob (API TBD in P6+ source-ref contract)
       → native PDF <object>
       → revokeObjectURL on unmount
```

Restyle: panel `bg-white` / `border-neutral-200` → `--color-panel`, `--color-border`. Viewer chrome only; PDF render mechanism stays.

**API note:** old client used `GET /documents/{id}/preview`. Rebuild must capture equivalent safe preview contract before wiring — port UI shell first, block blob fetch until contract exists.

---

## Graph Route — PORT

```text
/database-visualize
  └── GraphViewer.tsx
        ├── RoutePageShell (contentLayout="fill")
        ├── @react-sigma/core canvas
        └── floating controls: GraphControl, ZoomControl, LayoutsControl,
            Legend, PropertiesView, Settings, FullScreenControl
```

| CE path | Port |
| --- | --- |
| `src/features/graph/GraphViewer.tsx` | canvas + control stack |
| `src/components/graph/*` | controls, properties panel |
| `src/hooks/useLightragGraph.tsx` | domain-scoped graph fetch |
| `src/stores/graph.ts` | graph UI state |

Restyle: floating panels `bg-white/85 backdrop-blur` → `--color-popover` / `--color-card`. Keep sigma layout and domain-change refresh behavior.

---

## Chat Route — PORT

**End-to-end flow:** `F-007-chat-shell-flow.md`

```text
/chat  (ChatRoute → LightRagChatShell)
main (flex row)
├── section (flex-1)
│   ├── RoutePageHeaderSection (domain + title)
│   ├── ConversationView / MessageBubble
│   └── ChatComposer
└── ContextPanelShell (tabbed; v1: context tab)
    ContextTabPanel → SessionContextNavigation + SourceInspectorPane
```

**Tab extension:** `F-007-context-panel-tabs.md`

| CE file | Port |
| --- | --- |
| `components/chat/LightRagChatShell.tsx` | 2-column shell |
| `components/chat/SidePanel.tsx` | → `ContextPanelShell` (tabbed aside) |
| `components/chat/ConversationView.tsx` | message thread |
| `components/chat/ChatComposer.tsx` | anchored composer |
| `components/chat/SourceInspectorPane.tsx` | source/evidence inspector |

Restyle: composer raised tray (DESIGN.md §6.2 shadow), LS markdown for messages. **Keep** side panel + resizable split — do not flatten to single column.

---

## Settings Dialog — PORT

| CE file | Port |
| --- | --- |
| `components/settings/SettingsDialog.tsx` | modal + left sub-nav |
| `stores/settings-dialog-store.ts` | route id state |
| `panels/GeneralSettingsPanel.tsx` | general |
| `panels/AccountSettingsPanel.tsx` | users |
| `panels/KnowledgeGraphSettingsPanel.tsx` | domains |
| `panels/AIModelSettingsPanel.tsx` | provider (admin) |
| `panels/DocumentParsingSettingsPanel.tsx` | parser (admin) |

Route ids: `general`, `account`, `knowledge-graph`, `provider`, `document-parsing`.

Restyle: white dialog sidebar → LS `SettingsLayout` (`ui/settings.tsx`). Keep dialog-over-app pattern (not a full settings route tree).

---

## Port vs Restyle Checklist

| Layer | Source | Action |
| --- | --- | --- |
| Route paths | CE client | copy |
| Nav items + order | `AppSideRail.tsx` | copy |
| Shell composition | `AppPageFrame`, `AppLayout` | copy |
| Documents list + PDF split | `DocumentRoute`, `DocumentPreviewPanel` | copy structure |
| Graph sigma workspace | `GraphViewer` | copy |
| Chat 2-col + SidePanel | `LightRagChatShell` | copy |
| Settings dialog routes | `SettingsDialog` | copy |
| Colors, type, spacing | `DESIGN.md` | replace all CE neutrals |
| Buttons, inputs, tables | LS `ui/*` | swap primitives |
| API endpoints | `specs/03-contracts/` | rewire — do not copy old paths blindly |

## Anti-Pattern

```text
✗ Rebuild CE as LS "recipes/models" page layout
✗ Replace icon rail with unrelated LS left-sidebar tabs (Status/Usage/Models)
✗ Move PDF preview to a new route or generic RightDetailPanel-only flow
✗ Drop /database-visualize or rename without spec update
✗ Keep CE white-canvas classes (bg-white, text-neutral-950) in production UI
```
