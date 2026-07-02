# F-009 — Frontend Vertical Slices (17)

Build in order. Each slice = one shippable UI increment.

## Slice Table

| # | Outcome | Backend gate | Key routes/modules | LS pattern |
| --- | --- | --- | --- | --- |
| 01 | typed boot + errors | P1 envelope | `api-client.ts`, tokens.css | `tokens.css`, `error-box` |
| 02 | login/logout | P1 auth | `/login`, auth hooks | compact form |
| 03 | shell + settings entry | P1 `/auth/me` | port `AppPageFrame`, `AppSideRail` | LS tokens on CE w-14 rail |
| 04 | general settings | P1 | port `GeneralSettingsPanel` | `settings.tsx` rows |
| 05 | user admin | P1 admin | port `AccountSettingsPanel` | `table.tsx` |
| 06 | domain settings | P3 | port `KnowledgeGraphSettingsPanel` | `list.tsx` + status |
| 07 | model/provider | P2 | port `AIModelSettingsPanel` | masked secret rows |
| 08 | parser settings | P2/P4 | port `DocumentParsingSettingsPanel` | `select.tsx` |
| 09 | documents library | P4/P5 list | port `DocumentRoute`, `DocumentTable` | LS table density |
| 10 | upload + PDF preview | P4/P5 ops | port `DocumentUploadDialog`, `DocumentPreviewPanel`, `DocumentPdfPreview` | LS panel tokens |
| 11 | chat shell | P3+P7 | port `LightRagChatShell`, `ContextPanelShell` (tabbed) | LS composer + tab bar pattern |
| 12 | chat SSE | P7+P6 | Context tab + SSE stream | `markdown-content` |
| 13 | knowledge graph | graph contract TBD | port `GraphViewer`, `components/graph/*` | restyle float controls |
| 14 | domain lifecycle | P3 | admin domain actions | confirm modal |
| 15 | operations recovery | P3/P4/P5 ops | `/operations` | `logs-view.tsx` |
| 16 | source navigation | opaque ref contract | evidence links | **blocked until contract** |
| 17 | audit/diagnostics | P8 | audit table | `logs-view.tsx` |

## Standard Slice Shape

```text
route/page
  → feature hook (fetch + map)
  → typed api wrapper
  → view states: loading | empty | error | forbidden | success
  → LS primitives only
```

## Slice 03 — Shell (detail)

Port from `client/src/components/layout/AppPageFrame.tsx` + `AppSideRail.tsx`.

```text
┌──┬──────────────────────────┐
│▣ │  {route children}        │  w-14 icon rail (NOT LS 224px text sidebar)
│💬│                          │
│📄│                          │
│🗂│                          │
│⚙│  Settings → dialog       │
│  │                          │
│⎋ │  Logout (bottom)         │
└──┴──────────────────────────┘
```

Restyle rail: `--color-sidebar`, LS icon `Button`. Keep CE nav order and Settings-as-dialog.

## Slice 09–10 — Documents + PDF (detail)

Port from `client/src/features/documents/DocumentRoute.tsx`.

```text
/documents  (single route — no /documents/[id])
  RoutePageShell
    ├── DocumentLibraryTable + Toolbar
    └── after: DocumentPreviewPanel (50% lg+ | mobile drawer)
          └── DocumentPdfPreview (<object> blob URL)
  Admin: DocumentUploadDialog
```

- **Retain** list + inline PDF split from old CE — do not move preview to a separate route.
- **Restyle** white panel/borders → DESIGN.md tokens.
- Preview blob API: capture safe contract before wiring (old path was `/documents/{id}/preview`).

## Slice 11–12 — Chat (detail)

Port from `client/src/components/chat/LightRagChatShell.tsx` — **2-column**, not RoutePageShell.

**Full flow:** `F-007-chat-shell-flow.md`  
**Context panel tabs:** `F-007-context-panel-tabs.md`

```text
/chat
  main | ContextPanelShell (tabbed; v1: context)
    ConversationView + ChatComposer
    ContextTabPanel → SessionContextNavigation + SourceInspectorPane
  SSE (slice 12): evidence → tokens → terminal
```

## Slice 15 — Operations (detail)

```text
/operations
  merge domain_operations + source prep/index ops
  columns: type | resource | status | started | [Detail]
  Detail panel: safe message, timestamps, retry/cancel if admin + API allows
```

## Slice 16 — Gate

Do **not** link evidence to source viewer using private UUIDs. Wait for opaque source-ref contract in specs.

## Per-Slice Done Checklist

- [ ] Playwright: desktop + narrow viewport
- [ ] Visual: dark + light at 1440×900 and 1280×800
- [ ] No token in storage; network uses cookies
- [ ] 401/403 paths tested
- [ ] Unknown API fields not invented

## Slice 13 — Graph (detail)

Port from `client/src/app/database-visualize/page.tsx` + `features/graph/GraphViewer.tsx`.

```text
/database-visualize   ← keep path name
  RoutePageShell (fill)
  sigma canvas + GraphControl / Zoom / Layout / Legend / PropertiesView
  domain selector in header (RouteDomainSelectorRow)
```

Restyle floating controls only; keep canvas behavior and domain-scoped refresh.

## Reference Docs

- CE client port map: `02-ce-client-port-map.md`
- Reference slice docs: `.references/context_engine_fullstack_impl_docs/slices/01_*.md` … `17_*.md`

## Spec

`specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`
