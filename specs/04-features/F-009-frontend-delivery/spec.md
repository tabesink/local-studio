---
id: F-009
title: Frontend Delivery Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-11
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Frontend Delivery

Phase: P9

## Outcome

Build the Next.js UI as a thin client over Context Engine contracts by adopting the **Local Studio shell and slice architecture** (`.reference-LS-frontend` wide navigation sidebar, feature-slice layout, tokens, primitives) as the app frame, and **porting** old Context Engine structure for the documents (library) and graph routes only. F-012 supersedes the earlier two-column chat direction with a governed chat workbench; chat adopts Local Studio `chat-shell` ergonomics over CE conversations + EVT-001 SSE via a frontend-only adapter. LS surfaces without CE contracts (dashboard, recipes/models, setup wizard, environment controls, usage/cost) remain hidden until F-010.

## Why Now

Users need a coherent app experience that preserves familiar CE navigation and document/graph workflows while matching Local Studio product-family aesthetics.

## Actors

Members, Administrators, frontend developers, design reviewers.

## In Scope

- Next.js App Router, TypeScript, Tailwind, Local Studio slice architecture and primitives from `.reference-LS-frontend`.
- Public login and authenticated app shell using the Local Studio **wide navigation sidebar** (`navigation-sidebar` slice: collapse/pin, resize 188-320px, session search) restyled for Context Engine navigation.
- Routes: `/chat`, `/documents` (Library), `/database-visualize` (Graph), `/logs` (admin), `/settings`; optional `/forbidden`.
- Documents: CE-ported library table + **inline PDF preview panel** (50% split desktop, drawer mobile), restyled with LS tokens.
- Graph: sigma workspace at `/database-visualize` with domain-scoped controls (CE port).
- Chat: Local Studio `chat-shell` slice (timeline, lifted composer, streaming reducer) wired to CE conversations + EVT-001 SSE via a frontend-only adapter; composer supports direct general chat, selected-domain RAG, governed composer refs (F-012), and P7/F-012 SSE/history state.
- Local Studio chat-shell adaptation: retain timeline scrolling, streaming state, compact composer, stop/retry/error UX, Markdown rendering, safe session actions where contracted, and contextual evidence inspection.
- Settings as an LS full-page `/settings` route with `SettingsLayout` section nav, split by ownership: personal preferences, admin/provider/runtime settings, and future node/workspace sections stay separated by role and contract.
- LS slices without CE contracts (dashboard, recipes-models, setup-wizard, environment-controls, usage-cost-reporting, MCP/runtime-jobs admin sections) stay unregistered/hidden until F-010 contracts exist.
- Typed API/SSE client and feature-owned endpoint wrappers.
- Auth/session via HttpOnly cookie only.
- Local Studio tokens, dark-first theme, dense rows, status grammar, visual acceptance.

## Out Of Scope

- Local Studio agent runtime, terminal, filesystem, or recipe/model product routes as working surfaces (nav/routes stay hidden until F-010)
- Nested `/documents/[id]` route (preview stays inline on `/documents`)
- Electron/Pi/controller mechanics
- frontend-owned authorization
- mock persistence disguised as product behavior
- browser provider/model/prompt controls
- Local Studio local-agent tools: terminal, filesystem editor, Git panel, browser automation, host skills, Pi runtime, local JSONL session authority, absolute working-directory paths
- browser-selected controller URLs/API keys, runtime ports, Docker access, node credentials, URL-keyed controller caches, or browser-side cost/storage calculations
- wiki creation, edit, review, publish, or Smart Composer durable writes; these belong to F-011 after API/data contracts are approved
- dashboard, logs, usage/cost, storage summaries, node runtime controls, and Docker environments; these belong to F-010 after API/data contracts are approved

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Frontend consumes only Context Engine API/SSE through typed wrappers. | API-001, EVT-001 |
| FR-002 | Browser storage contains no token and 401/403 behavior is stable. | QA-002 |
| FR-003 | Shell uses the Local Studio wide navigation sidebar and route model: login, sidebar nav (Chat, Library, Graph, Logs, Settings), logout. CE-specific routes `/documents` and `/database-visualize` are embedded as sidebar items. LS routes without CE contracts stay hidden. | ce-client-port-and-parity.md |
| FR-004 | Documents route retains list + inline PDF preview panel pattern from old CE client. | ce-client-port-and-parity.md |
| FR-005 | Chat route uses the LS chat-shell slice (timeline, composer, streaming reducer) over CE conversations + EVT-001 SSE through a frontend adapter. Direct LLM turns render without Evidence; domain RAG turns populate Evidence from SSE/history; accepted refs render from safe F-012 metadata. | F-012, ce-client-port-and-parity.md |
| FR-006 | Visual implementation uses Local Studio tokens/primitives; no white-canvas CE styling in production. | DESIGN.md |
| FR-007 | Unknown backend shape creates a fixture capture task instead of guessed UI fields. | CON-000 |
| FR-008 | Future context-panel tabs extend via `CONTEXT_PANEL_TAB_IDS` + router without restructuring chat shell. | context-panel-tabs.md |
| FR-009 | `/chat` adapts Local Studio chat ergonomics only where they preserve Context Engine authority: timeline, composer, streaming, stop/retry, safe session actions, and right-panel evidence. It must not port terminal/filesystem/Git/browser-agent/model-controller behavior. | ce-client-port-and-parity.md |
| FR-010 | Settings UI separates personal preferences, admin runtime/provider configuration, and reserved node/workspace sections; browser-local changes must never imply infrastructure mutation. | DESIGN.md, F-010 |

## Contracts And Data

- Contracts: API-001, EVT-001, DESIGN.md, ce-client-port-and-parity.md, context-panel-tabs.md, QA-001
- Data: Frontend owns local UI state only. It does not persist product state or credentials.

## Foundation Gates

P9 starts with the gated foundation path only: `T-000` through `T-030`. Later slices remain blocked until their contract or fixture gate is proven.

### OpenAPI And Client Strategy

- `tests/snapshots/f008_openapi.json` is the frozen P1-P8 OpenAPI snapshot for the first P9 foundation pass.
- P9 uses small feature-owned wrappers over a shared `ceFetch`/SSE foundation rather than exposing generated or raw fetch shapes to components.
- Unknown public fields, missing response examples, or mismatched DTOs create a fixture-capture or contract-patch task before UI wiring.
- Components must not call `fetch` directly.

### API Error Boundary

Frontend code normalizes API-001 errors to:

```text
ApiError:
  code: string
  message: string
  requestId: string | null
  fields?: { path: string; message: string }[]
```

Components may display the safe message and request id. They must not log or persist raw response bodies, request bodies, stack traces, provider payloads, source text, prompts, answers, paths, runtime URLs, or private ids.

### Browser Storage Allowlist

Allowed browser storage keys for P9 foundation:

```text
ce.appearance
ce.theme
ce.density
ce.railCollapsed
ce.panelWidths
ce.lastRouteGroup
```

`ce.appearance` is the canonical JSON blob for Mode, themeId, density, typography, scale, radius, and token overrides. Legacy `ce.theme` / `ce.density` remain on the allowlist for one migration window with write-through sync.

Forbidden in browser storage:

```text
auth token
session token
provider credential
controller target
runtime target
runtime port
storage target
prompt
user question
assistant answer
source text
evidence excerpt
raw API/SSE payload cache
```

Auth uses the opaque HttpOnly `ce_session` cookie only.

### Settings Ownership

Settings must be separated by ownership from the first shell implementation:

- Personal: UI-local appearance (Mode, Theme catalog, token editor, typography, Density + scale) via the central appearance runtime, and other browser-only preferences on the storage allowlist.
- Administration: captured P1-P8 routes only, such as users, provider/model/parser status, domains, sources, audit, and diagnostics. Settings -> Users may list users and toggle `isDisabled` through the admin-only API; backend authz and lockout guards remain authoritative.
- Reserved: Runtime Node, workspace, Logs, Usage, storage, Docker, Wiki, and Smart Composer. Reserved sections are absent or inactive until F-010/F-011 and affected API/data contracts are approved.

Settings must not expose raw controller URLs, API keys, host paths, runtime ports, storage targets, node credentials, provider secret values, or browser-local infrastructure mutation.

### Chat Layout And SSE Gate

- F-012 explicitly accepts the three-region `/chat` workbench and supersedes the earlier two-column `LightRagChatShell` gate for the governed context assembly slice.
- The right-side tab registry/router pattern remains required, but v1 F-012 tabs are Evidence, Refs, Source, and Wiki only.
- Raw EVT-001/F-012 SSE transcripts or reducer fixtures must cover direct LLM success, domain RAG success, no grounded context, evidence-only, terminal error, validation/auth pre-stream JSON errors, duplicate request, cancel settlement, and accepted-ref terminal/replay projection.

### Blocked Surfaces

- Evidence-to-source navigation is contracted: API-001 `GET /evidence-refs/{evidence_ref_id}/source` is the opaque resolve-before-navigate gate. Evidence rows still expose only public evidence ref ids; the browser must resolve before Library deep-link and must not invent Source Document or Source Block ids from Evidence.
- `/database-visualize` graph data remains blocked until graph API/data DTOs are approved. P9 may port the route shell/canvas unavailable state only.
- F-010 Logs/Usage/node surfaces and F-011 Wiki/Smart Composer durable writes are not P9 implementation scope without contract patches.

### Captured Preview Contract

API-001 captures member-readable source list and preview:

- `GET /domains/{domain_id}/sources` — safe source summaries for authenticated Members and Administrators when the domain is available
- `GET /domains/{domain_id}/sources/{source_id}/preview` — same-origin cookie-authenticated stream of the stored original (`application/pdf`, `text/plain`, `text/markdown`) with `Cache-Control: private, no-store` and no attachment disposition

Library (`/documents`) may wire list + inline PDF/text preview for domain readers. Members are read-only (no upload/retry/cancel/delete). Admin source mutation routes remain Administrator-only. Docx and other non-previewable types show unsupported; missing/unauthorized fail closed.

### Captured Source-Ref Resolve Contract

API-001 captures opaque evidence→source resolve for F-009 slice 16:

- `GET /evidence-refs/{evidence_ref_id}/source` — cookie-authenticated resolve keyed by public Evidence `id`; success returns Library-safe `domainId`, `sourceId`, optional `page`, and safe `sourceLabel`; redacted/missing/unauthorized fail closed as `source_ref_unavailable`
- Evidence Panel may show Open in Library on the selected detail only; navigate to `/documents` with domain/source/optional page plus return `conversationId`/`turnId` only after successful resolve
- Citation chips, Source inspector tab / figure-table asset cards, and in-chat PDF drawers remain deferred

## Acceptance Criteria

- AC-001: no browser token storage
- AC-002: 401 clears auth once
- AC-003: 403 forbidden without redirect loop
- AC-004: member cannot see/call admin controls, including Settings -> Users enable/disable actions
- AC-005: SSE ordering fixtures pass
- AC-006: no secret/path/raw payload in client errors/logs
- AC-007: Playwright desktop/mobile key flows for login, chat, documents (incl. preview panel), graph
- AC-008: visual checks at 1440x900, 1280x800, and narrow viewport dark/light
- AC-009: shell nav order and routes match ce-client-port-and-parity.md (LS sidebar: Chat, Library, Graph, Logs, Settings; hidden F-010 surfaces absent)
- AC-010: chat workbench uses the LS chat-shell layout with CE adapter; Evidence and accepted refs populate from CE SSE/history before unsafe browser-owned context is possible
- AC-011: direct LLM chat turn renders without evidence rows/citations and without exposing route/model/tool controls
- AC-012: chat shell proves Local Studio timeline/composer/streaming UX is adapted without terminal, filesystem, Git, browser automation, host-skill, Pi-runtime, raw model-controller, or local path controls
- AC-013: settings surfaces show personal/admin/provider/runtime ownership separately; Users toggle account active/disabled state only through the admin API and do not expose raw controller URLs/API keys, host paths, runtime ports, or secret values

## Open Decisions

- Attachments, model-profile selection, pin/archive/export, and right-panel tabs beyond F-012 Evidence/Refs/Source/Wiki inspection are blocked until API/data contracts capture their safe DTOs and permission rules.
- Workspace-scoped settings/tool registries are blocked until a Workspace product model is approved; do not introduce `workspaceId` in P9 implementation.
- Citation chips, Source inspector figure/table asset cards, docx inline preview, download/export, and in-chat PDF drawer remain deferred after the opaque resolve + Open in Library slice.
