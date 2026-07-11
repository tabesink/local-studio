---
id: F-009-TABS
title: Chat Context Panel Tabs Contract
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-07-08
depends_on: [F-009, ce-client-port-and-parity.md]
supersedes: []
---

# Chat Context Panel Tabs

## Governing Rule

Build the `/chat` right panel as a **turn-scoped Evidence Panel** in v1: a single-column,
Local Studio `ComputerPanel`-style aside that displays the safe Evidence rows
(`id`, `citationLabel`, `sourceLabel`, `excerpt`) for the current or selected turn.
The tabbed shell (registry + router + tab bar) is the **growth path**, not the v1 deliverable:
the tab id type stays in code so future tabs plug in without restructuring the chat shell.

Grill decisions recorded 2026-07-08 (supersede the earlier v1 sketch in this file):

1. v1 data depth is SSE Evidence only — no figure/table asset cards, no workspace source fetch.
2. v1 layout is a single column (list + selected excerpt), not the old CE 33/67 nested split.
3. Inline timeline "Evidence (N)" blocks are removed; the panel owns Evidence display.
4. Panel scope is the current/selected turn only — no session ledger, no All/This answer/Pinned filters, no pins.
5. Panel is closed by default and auto-opens when the active turn has Evidence; the user may collapse it.
6. Clicking an assistant message selects that turn's Evidence; streaming follows the in-flight turn.
7. Inline citation chips (`[n]` → panel selection) are deferred.
8. No tab bar renders while only one panel body exists.

```text
PORT geometry         ←  Local Studio ComputerPanel (aside, resize, --color-panel)
PORT list grammar     ←  LS quiet surface rows / panel sections
DEFER content parity  ←  old CE SessionContextNavigation ledger + SourceInspectorPane assets
RESTYLE               ←  DESIGN.md
```

## Target Layout (v1)

```text
ChatShell (flex-row)
├── LEFT (existing)      timeline + composer
└── EvidencePanel        evidence-only aside
      ├── header         "Evidence" + row count + collapse control
      ├── list           [citationLabel] sourceLabel rows (selectable)
      └── detail         selected row excerpt (bounded text)
```

Geometry per LS `ComputerPanel`: default 440px width, left-edge pointer resize,
min `max(280px, 25vw)`, max `65vw`, `--color-panel` surface, `h-10` header on
`--color-header`.

## v1 Data Wiring

Evidence data comes from the P7 SSE turn flow and conversation history only.
The panel does not add a second evidence fetch path.

```text
SSE evidence event (domain_rag; before token)
  → streamEvidence (in-flight turn rows) → panel auto-open
turn completes → GET /conversations/{id} refresh → turns[].evidence[]
click assistant message → selectedTurnId → panel shows that turn's evidence
direct_llm turn → no evidence event → panel does not open for that turn
```

`stage` SSE events may update a compact activity indicator in the chat header.
The panel must ignore planning text because no planning text is allowed in EVT-001.

## Tab Registry (types retained for growth)

```typescript
export const CONTEXT_PANEL_TAB_IDS = ["context"] as const;
export type ContextPanelTabId = (typeof CONTEXT_PANEL_TAB_IDS)[number];
```

While `CONTEXT_PANEL_TAB_IDS` has one entry, no tab bar renders and the single
body is the Evidence Panel content. Adding a tab later:

1. append id to `CONTEXT_PANEL_TAB_IDS`;
2. introduce the tab bar (LS ComputerHeader pattern) and a panel router;
3. add tab bar label (and spec gate if product behavior is new).

## Deferred Beyond v1 (reserved)

| Item | Gate |
| --- | --- |
| Session ledger (cross-turn merge, All/This answer/Pinned, pins, caps) | product decision to restore old CE ledger UX |
| Source inspector with figure/table asset cards | deferred product slice (opaque resolve + Open in Library is contracted; figure/table cards are not) |
| Inline citation chips selecting panel rows | markdown/citation rendering slice |
| `terminal` tab | product + backend contract; no Electron bridge in pilot by default |
| `side-chat` tab | F-007 conversation model |
| `operations` tab | P9 slice 15 |

Do not implement deferred items in v1.

## Forbidden

- Evidence fetched outside chat turn SSE + conversation history
- Private identifiers in panel data (`sourceBlockId`, `documentId`, `chunkId`, paths, URLs)
- Porting old CE `loadSourceNavigator` / workspace-context fetch (leaks private ids)
- LS agent PaneGrid / multi main-pane splits for v1
- Route/model/tool/retrieval-mode controls in the chat shell
- Replacing the panel with the documents-route `RightDetailPanel` pattern
- Naming or presenting the Evidence Panel as Smart Composer (separate governed surface)

## Evidence Pack

- Wiring map (junior/agent guide): `.devnotes/02-evidence-panel-wiring-map.md`
- Terse junior notes: `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md` (not authority)
