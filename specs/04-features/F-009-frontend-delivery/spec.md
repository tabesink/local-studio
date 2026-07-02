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

## Contracts And Data

- Contracts: API-001, EVT-001, DESIGN.md, ce-client-port-and-parity.md, context-panel-tabs.md, QA-001
- Data: Frontend owns local UI state only. It does not persist product state or credentials.

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

## Open Decisions

- Safe Source Document preview blob API for PDF viewer wiring (blocked until contract captured; UI shell may port first).
- Opaque source-ref contract for slice 16 evidence→source navigation.
