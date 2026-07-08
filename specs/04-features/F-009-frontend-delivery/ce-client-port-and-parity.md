---
id: F-009-PORT
title: CE Client Port And Local Studio Parity Contract
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-07-08
depends_on: [F-009, DESIGN.md]
supersedes: []
---

# CE Client Port And Local Studio Parity

## Governing Rule

P9 frontend uses a **three-source** model:

```text
SHELL + SLICES (sidebar, layout, tokens, primitives, hook/API seams)
  ←  .reference-LS-frontend/ (Local Studio slice architecture)

PORT (documents + graph structure and interaction geometry only)
  ←  .references/code/context-engine/client/ (via F-009 port docs)

WIRE (API/SSE DTOs, auth, eligibility)
  ←  specs/03-contracts/ P1–P8 + F-012 only
```

The Local Studio shell and information architecture govern the app frame. Context Engine keeps its own routes embedded in the LS sidebar; LS product surfaces without CE contracts (Status/dashboard, Usage, Recipes/Models, Plugins, Server) stay hidden until F-010.

## App Shell — Local Studio Sidebar

Reference: `.reference-LS-frontend/templates/nextjs-feature-demos/features/navigation-sidebar/` and `_shared/shell/`.

```text
layout.tsx → Providers → AppLayout (auth gate)
              └── LS shell
                    ├── NavigationSidebar   ← wide text sidebar, collapse/pin, resize 188-320px
                    └── route children
```

### Sidebar nav (production registry)

| Item | Target | Behavior |
| --- | --- | --- |
| Chat | `/chat` | route link; conversation list in sidebar sessions section |
| Library | `/documents` | route link (CE port) |
| Graph | `/database-visualize` | route link (CE port); do not rename route without spec change |
| Logs | `/logs` | route link; admin-only (audit events + diagnostics) |
| Settings | `/settings` | full-page LS `SettingsLayout` route |
| Logout | action | bottom of sidebar |

Hidden until F-010 contracts: Status (dashboard), Usage, Models (recipes), Plugins, Server (environment controls).

## Route Map

| Route | Page | Feature entry |
| --- | --- | --- |
| `/` | `app/page.tsx` | redirect → `/chat` |
| `/login` | `app/login/page.tsx` | standalone, no sidebar |
| `/chat` | `app/chat/page.tsx` | `features/chat-shell/` (LS slice + CE adapter) |
| `/documents` | `app/documents/page.tsx` | `features/documents/` (CE port) |
| `/database-visualize` | `app/database-visualize/page.tsx` | `features/graph/` (CE port) |
| `/logs` | `app/logs/page.tsx` | `features/logs-observability/` (LS slice + CE adapter, admin) |
| `/settings` | `app/settings/page.tsx` | `features/settings-panel/` (LS slice + CE adapter) |

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

## Chat — LS chat-shell Slice + CE Adapter

Chat uses the Local Studio `chat-shell` slice (timeline, lifted composer, streaming reducer, evidence/context chips) from `.reference-LS-frontend/templates/nextjs-feature-demos/features/chat-shell/`. The slice's `api/` module is the only CE-aware layer:

```text
listSessions()          → GET  /api/v1/conversations
createSession()         → POST /api/v1/conversations
loadSession(id)         → GET  /api/v1/conversations/{id}   (turns → ChatMessage timeline)
submitTurn(args)        → POST /api/v1/conversations/{id}/turns:stream (SSE)
discoverRefs()          → POST /api/v1/composer-refs:discover (F-012)
```

EVT-001 SSE events translate to LS reducer payloads inside the adapter:

```text
stage    → running/status indicator
evidence → evidence chips + inspector data
token    → text delta
done     → finalize message (citations, acceptedRefs, budget)
error    → safe error state
```

Pi runtime frames, Computer panel, multi-pane grid, queue/steer/compact, and abort are **not** wired (no CE contracts). Abort control stays disabled until a CE cancel contract exists.

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

## Settings — LS Full-Page Route

`/settings` uses the LS `settings-panel` slice with `SettingsLayout` (200px sticky section nav). CE-contracted sections only:

| Section | CE endpoint |
| --- | --- |
| General/Personal | `user-preferences` slice (browser-local, storage allowlist) |
| Model Provider | `GET/PUT /api/v1/admin/runtime-settings` (admin) |
| Domains | `GET/POST /api/v1/admin/domains` + start/stop/delete (admin) |
| Users | `GET /api/v1/admin/users` (admin) |

Controller, Storage, Hardware, Plugins, and Skills sections stay absent or disabled until F-010 contracts. Admin-only panels gated in UI; backend remains authority.

Settings must be split by ownership even when porting compact Local Studio fact-row UI:

- personal preferences: appearance, density, font, sidebar behavior, and personal chat/archive options when contracted;
- administration: provider/model/parser settings from P2 and domain/source administration from P3-P5;
- reserved post-P9 node/workspace settings: node access, runtime engines, diagnostics, Docker environments, shared skills/tools, and workspace policy. These are F-010/F-011 gates and must not appear as working controls in P9 without approved contracts.

## Forbidden

- Registering LS product routes (Status, Usage, Recipes/Models, Plugins, Server) before F-010 contracts exist
- Exposing Pi runtime frames, Computer panel tools, terminal/filesystem/Git/browser tabs, or queue/steer/compact controls
- Moving PDF preview to a separate route or dropping the 50% inline split
- Renaming `/database-visualize` without spec update
- Shipping old CE white-canvas styling in production
- Copying stale v1 API paths from reference client without contract reconciliation
- Components or hooks calling CE endpoints directly; only each slice's `api/` adapter may

## Junior Dev Pack (evidence)

Terse slice wiring notes: `.references/feature-ce-api-uiux-wirering-brainstorm/`

That pack is evidence only. **`specs/04-features/F-009-frontend-delivery/`** (`ce-client-port-and-parity.md`, `context-panel-tabs.md`) is implementation authority.
