---
id: F-009-MAP
title: Frontend Vertical Slice Map
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-07-02
depends_on: [F-009]
supersedes: []
---

# Frontend Vertical Slice Map

Build in this order. Each slice **ports** structure from `.references/code/context-engine/client/` where noted, **restyles** with `DESIGN.md`, and consumes backend contracts only after the named gate exists.

Port authority: `ce-client-port-and-parity.md`, `context-panel-tabs.md`.

| Slice | User outcome | Backend gate | Port from CE client | Restyle with |
| --- | --- | --- | --- | --- |
| 01 Runtime foundation | typed config/API/error surface | P1 | — | LS tokens.css first |
| 02 Login cookie session | sign in/out; protected routes | P1 auth | `app/login/page.tsx` | compact form |
| 03 App shell/nav/settings | authenticated shell, icon rail, Settings dialog | P1 `/auth/me` | `AppPageFrame`, `AppSideRail`, `SettingsDialog` | LS rail/button tokens |
| 04 Settings general | general UI preferences | P1 | `GeneralSettingsPanel` | `SettingsLayout` rows |
| 05 Settings users | admin user management | P1 admin | `AccountSettingsPanel` | LS table |
| 06 Settings domains | domain configuration | P3 | `KnowledgeGraphSettingsPanel` | LS list + status |
| 07 Settings model provider | provider profiles, no secret leak | P2 | `AIModelSettingsPanel` | masked secret rows |
| 08 Settings document parser | parser choice/status | P2/P4 | `DocumentParsingSettingsPanel` | LS select |
| 09 Documents library | browse document status | P4/P5 list | `DocumentRoute`, `DocumentTable` | LS table density |
| 10 Upload + PDF preview | upload, track prep/index, inline PDF | P4/P5 | `DocumentUploadDialog`, `DocumentPreviewPanel`, `DocumentPdfPreview` | LS panel tokens |
| 11 Chat route shell | direct general chat, selected-domain RAG composer, two-col shell, context tab | P3 + P7 | `LightRagChatShell`, `ContextPanelShell` | LS composer + tab bar pattern |
| 12 Chat SSE evidence | streamed direct/domain answer, stage/evidence; context tab from SSE | P7 SSE + P6 | `ConversationView`, `ChatComposer`, `ContextTabPanel` | `MarkdownContent` |
| 13 Knowledge graph | inspect graph workspace | graph contract TBD | `GraphViewer`, `components/graph/*` | LS popover on controls |
| 14 Domain lifecycle | admin start/stop/delete | P3 | settings/lifecycle panels | confirm modal |
| 15 Operations recovery | retry/cancel operations | P3/P4/P5 ops | new (no old CE route) | LS logs table |
| 16 Source navigation | evidence→source context | API-001 opaque resolve + Library deep-link | Evidence Panel Open in Library; pdf.js page jump; Back to chat | LS panel + Library chrome |
| 17 Audit diagnostics | safe audit/diagnostics | P8 | new | LS logs pattern |

## Shared Frontend Gates

- No route, component, hook, or test stores auth tokens in browser storage.
- Shared UI primitives never call API.
- Feature modules own endpoint wrappers and DTO mapping.
- Unknown API field shape creates a fixture capture task.
- Port CE **structure**; do not copy stale v1 API paths blindly.
- Playwright covers desktop and narrow viewport for each route group.
- Visual checks: dark + light at `1440x900`, `1280x800`, narrow viewport.

## Slice Notes

### 03 — Shell

Retain w-14 **icon rail** nav order: Chat → Documents → Knowledge graph → Settings (dialog) → Logout. Do not substitute Local Studio wide text sidebar.

### 09–10 — Documents + PDF

Single `/documents` route. Row click → `DocumentPreviewPanel` (50% lg+ | mobile drawer) → shared pdf.js PDF viewer or plain/markdown text panel. Preview wires to API-001 `GET /domains/{domain_id}/sources/{source_id}/preview`; member list uses `GET /domains/{domain_id}/sources`. Citation deep-links may pass `domainId`/`sourceId`/optional `page` plus return `conversationId`/`turnId` after opaque resolve. Members are read-only; admins retain upload/ops.

### 16 — Source navigation

Evidence Panel selected detail shows Open in Library. Click calls `GET /evidence-refs/{evidence_ref_id}/source`; on success navigate to Library deep-link; on failure stay in chat with Source unavailable. Do not put Source Document or Source Block ids on Evidence rows. Citation chips and Source inspector tab remain deferred.

### 11–12 — Chat

Port two-column `LightRagChatShell`; chat does not use `RoutePageShell`.

Right panel: implement **ContextPanelShell** with `CONTEXT_PANEL_TAB_IDS = ["context"]` and `ContextPanelRouter`. Port CE `SessionContextNavigation` + `SourceInspectorPane` inside `ContextTabPanel`. See `context-panel-tabs.md`.

The shell consumes `stage`, `evidence`, `token`, `done`, and `error` events. It never exposes route/model/tool/retrieval controls. Direct LLM turns render no evidence rows; domain RAG turns populate context from `evidence` before grounded tokens.

### 13 — Graph

Keep route `/database-visualize`. Port sigma canvas + floating controls from `GraphViewer.tsx`.
