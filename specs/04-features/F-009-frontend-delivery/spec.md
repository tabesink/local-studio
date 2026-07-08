---
id: F-009
title: Frontend Delivery Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Frontend Delivery

Phase: P9

## Outcome

Build the Next.js UI as a thin client over P1-P8 contracts by **porting** old Context Engine client structure (routes, shell, documents PDF split, graph workspace, chat two-column shell) and **restyling** with Local Studio visual parity.

## Why Now

Users need a coherent app experience that preserves familiar CE navigation and document/graph workflows while matching Local Studio product-family aesthetics.

## Actors

Members, Administrators, frontend developers, design reviewers.

## In Scope

- Next.js App Router, TypeScript, Tailwind, Local Studio-adapted primitives.
- Public login and authenticated app shell ported from `.references/code/context-engine/client/`.
- Compact **icon rail** (`AppSideRail`), `AppPageFrame`, global Settings dialog.
- Routes: `/chat`, `/documents`, `/database-visualize`; optional `/operations`, `/forbidden`.
- Documents: library table + **inline PDF preview panel** (50% split desktop, drawer mobile).
- Graph: sigma workspace at `/database-visualize` with domain-scoped controls.
- Chat: two-column shell with **tabbed `ContextPanelShell`** (v1 tab: `context` evidence); composer supports direct general chat and selected-domain RAG; P7 SSE.
- Local Studio chat-shell adaptation: retain timeline scrolling, streaming state, compact composer, stop/retry/error UX, Markdown rendering, safe session actions where contracted, and right-panel contextual inspection.
- Shared Settings dialog split by ownership: personal preferences, admin/provider/runtime settings, and future node/workspace sections stay separated by role and contract.
- Typed API/SSE client and feature-owned endpoint wrappers.
- Auth/session via HttpOnly cookie only.
- Local Studio tokens, dark-first theme, dense rows, status grammar, visual acceptance.

## Out Of Scope

- Local Studio agent runtime, terminal, filesystem, or recipe/model product routes
- Replacing CE icon rail with Local Studio wide text sidebar
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
| FR-003 | Route and shell structure ports old CE client: login, w-14 icon rail, `/chat`, `/documents`, `/database-visualize`, Settings dialog, logout. | ce-client-port-and-parity.md |
| FR-004 | Documents route retains list + inline PDF preview panel pattern from old CE client. | ce-client-port-and-parity.md |
| FR-005 | Chat route retains two-column shell; right panel uses modular tab registry with v1 `context` tab porting old CE session context and source inspector. Direct LLM turns render with empty context; domain RAG turns populate context from SSE evidence. | context-panel-tabs.md, ce-client-port-and-parity.md |
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
ce.theme
ce.density
ce.railCollapsed
ce.panelWidths
ce.lastRouteGroup
```

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

- Personal: UI-local appearance, density, compact preferences, and other browser-only preferences on the storage allowlist.
- Administration: captured P1-P8 routes only, such as users, provider/model/parser status, domains, sources, audit, and diagnostics.
- Reserved: Runtime Node, workspace, Logs, Usage, storage, Docker, Wiki, and Smart Composer. Reserved sections are absent or inactive until F-010/F-011 and affected API/data contracts are approved.

Settings must not expose raw controller URLs, API keys, host paths, runtime ports, storage targets, node credentials, provider secret values, or browser-local infrastructure mutation.

### Chat Layout And SSE Gate

- The approved P9 chat layout remains the two-column `LightRagChatShell` plus `ContextPanelShell` until F-009 explicitly accepts a different layout.
- The proposed three-panel `/chat` mockup is advisory and must be accepted or rejected in F-009 before `T-060` chat shell implementation.
- Raw EVT-001 SSE transcripts must be captured before streaming UI work: direct LLM success, domain RAG success, no grounded context, evidence-only, terminal error, validation/auth pre-stream JSON errors, duplicate request, and cancel settlement.

### Blocked Surfaces

- PDF preview blob fetch remains blocked until API-001 captures a safe preview route. The documents preview panel may be shell-only.
- Evidence-to-source navigation remains blocked until an opaque source-ref API/data contract exists. P9 may select current-turn Evidence by public evidence ref id only.
- `/database-visualize` graph data remains blocked until graph API/data DTOs are approved. P9 may port the route shell/canvas unavailable state only.
- F-010 Logs/Usage/node surfaces and F-011 Wiki/Smart Composer durable writes are not P9 implementation scope without contract patches.

## Acceptance Criteria

- AC-001: no browser token storage
- AC-002: 401 clears auth once
- AC-003: 403 forbidden without redirect loop
- AC-004: member cannot see/call admin controls
- AC-005: SSE ordering fixtures pass
- AC-006: no secret/path/raw payload in client errors/logs
- AC-007: Playwright desktop/mobile key flows for login, chat, documents (incl. preview panel), graph
- AC-008: visual checks at 1440x900, 1280x800, and narrow viewport dark/light
- AC-009: shell nav order and routes match ce-client-port-and-parity.md
- AC-010: chat right panel uses ContextPanelShell with `context` tab registry/router; evidence populates context tab from SSE before answer tokens
- AC-011: direct LLM chat turn renders without evidence rows/citations and without exposing route/model/tool controls
- AC-012: chat shell proves Local Studio timeline/composer/streaming UX is adapted without terminal, filesystem, Git, browser automation, host-skill, Pi-runtime, raw model-controller, or local path controls
- AC-013: settings surfaces show personal/admin/provider/runtime ownership separately and do not expose raw controller URLs/API keys, host paths, runtime ports, or secret values

## Open Decisions

- Attachments, source mentions, model-profile selection, pin/archive/export, and right-panel tabs beyond `context` are blocked until API/data contracts capture their safe DTOs and permission rules.
- Workspace-scoped settings/tool registries are blocked until a Workspace product model is approved; do not introduce `workspaceId` in P9 implementation.

- Safe Source Document preview blob API for PDF viewer wiring (blocked until contract captured; UI shell may port first).
- Opaque source-ref contract for slice 16 evidence→source navigation.
