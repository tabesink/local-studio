---
id: F-009
title: Frontend Delivery Specification
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Frontend Delivery

Phase: P9

## Outcome

Build the Next.js UI as a thin client over P1-P8 contracts, using old Context Engine route/shell structure and Local Studio visual parity.

## Why Now

Users need a coherent app experience, but the frontend must not become product truth or visually drift from Local Studio.

## Actors

Members, Administrators, frontend developers, design reviewers.

## In Scope

- Next.js App Router, TypeScript, Tailwind, shadcn/Radix-style primitives.
- Public login and authenticated app route group.
- Compact left rail, route content canvas, Settings dialog/panels, right detail panel patterns.
- Typed API/SSE client and feature-owned endpoint wrappers.
- Auth/session handling with no browser credential persistence.
- Documents, upload/operations, chat/evidence, graph, domain lifecycle, audit/diagnostics slices as backend gates allow.
- Local Studio tokens, dark-first theme, dense rows, compact dialogs, status grammar, visual acceptance screenshots.

## Out Of Scope

- Local Studio agent runtime
- terminal/filesystem UI
- Electron/Pi/controller mechanics
- command queue/replay model
- frontend-owned authorization
- mock persistence disguised as product behavior
- browser provider/model/prompt controls

## Functional Requirements

| ID | Requirement | Source |
| --- | --- | --- |
| FR-001 | Frontend consumes only Context Engine API/SSE through typed wrappers. | API-001, EVT-001 |
| FR-002 | Browser storage contains no token and 401/403 behavior is stable. | QA-002 |
| FR-003 | Route shape includes login, chat, documents, graph, operations, and settings dialog/panels. | DESIGN.md |
| FR-004 | Visual implementation follows Local Studio tokens/primitives and old Context Engine layout structure. | DESIGN.md |
| FR-005 | Unknown backend shape creates a fixture capture task instead of guessed UI fields. | CON-000 |

## Contracts And Data

- Contracts: API-001, EVT-001, DESIGN.md, QA-001
- Data: Frontend owns local UI state only. It does not persist product state or credentials.

## Acceptance Criteria

- AC-001: no browser token storage
- AC-002: 401 clears auth once
- AC-003: 403 forbidden without redirect loop
- AC-004: member cannot see/call admin controls
- AC-005: SSE ordering fixtures pass
- AC-006: no secret/path/raw payload in client errors/logs
- AC-007: Playwright desktop/mobile key flows
- AC-008: visual checks at 1440x900, 1280x800, and narrow viewport dark/light

## Open Decisions

No open product decisions are allowed before implementation starts. If a backend/runtime/frontend contract is unknown, create a fixture-capture task and keep the feature blocked until evidence exists.
