# Context Engine — API ↔ UI/UX Wiring (Junior Dev Pack)

Terse vertical-slice docs for the greenfield rebuild. **Backend owns truth.** Frontend ports **old CE layout/routes** (`.references/code/context-engine/client/`) with **Local Studio visual skin** (`DESIGN.md`).

## Read First

| Order | Doc | Why |
| --- | --- | --- |
| 1 | `AGENTS.md` | Non-negotiable rules |
| 2 | `CONTEXT.md` | Product vocabulary |
| 3 | `DESIGN.md` | Local Studio visual parity |
| 4 | `00-system-wiring-map.md` | End-to-end architecture |
| 5 | `02-ce-client-port-map.md` | **What to port from old CE client vs restyle** |
| 6 | `01-local-studio-parity-cheatsheet.md` | LS primitives for restyle |
| 7 | Feature slice for your phase | `F-000` … `F-009` |
| 8 | `F-007-chat-shell-flow.md` | **Chat route UI/UX end-to-end** (port old CE shell) |
| 9 | `F-007-context-panel-tabs.md` | **Modular right-panel tabs** (v1: Context/evidence) |
| 10 | `../local-studio-tab-patterns.md` | **LS tab systems** (Computer + PaneGrid + primitives) |
| 11 | `F-009-frontend-slices.md` | 17 ordered UI slices (P9 only) |

## Authority

```text
specs/04-features/F-###/spec.md  >  this pack  >  .references/code/*
```

Unknown API field? **Stop.** Capture fixture. Do not guess UI.

**Authority for port/restyle:** `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md` (this pack is evidence only).

## Build Order

```text
P0 contract → P1 auth → P2 runtime config → P3 domains → P4 sources
→ P5 index → P6 evidence → P7 chat SSE → P8 observability → P9 frontend
```

## Package Layout

```text
feature-ce-api-uiux-wirering-brainstorm/
├── README.md                          ← you are here
├── 00-system-wiring-map.md            ← system diagram + boundaries
├── 01-local-studio-parity-cheatsheet.md
├── 02-ce-client-port-map.md           ← CE client structure to port + LS restyle
├── F-000-shared-contract.md
├── F-001-trusted-application-foundation.md
├── F-002-trusted-runtime-config.md
├── F-003-knowledge-domains-runtime.md
├── F-004-source-documents-preparation.md
├── F-005-lightrag-indexing-eligibility.md
├── F-006-scoped-evidence-retrieval.md
├── F-007-grounded-streaming-chat.md
├── F-007-chat-shell-flow.md           ← chat route UI/UX deep dive
├── F-007-context-panel-tabs.md        ← modular context panel tabs (v1: evidence)
├── F-008-observability-pilot-gate.md
├── F-009-frontend-delivery.md
├── F-009-frontend-slices.md           ← 17 UI vertical slices

../local-studio-tab-patterns.md        ← LS Computer tabs + PaneGrid + ui/tabs
```

## One Rule for Every Slice

```text
Browser ──HTTP/SSE──► Context Engine API ──private──► Postgres / Worker / LightRAG
         ▲                              ✗ never direct
         └── cookie ce_session only; no token in storage
```
