# Local Studio Tab Patterns — Junior Dev Guide

Terse reference for LS tab UX. Context Engine **restyles** with `DESIGN.md` tokens; port **patterns** only where product specs allow.

**Read-only source:** `.references/code/local-studio/frontend/src/`

**CE wiring pack:** `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md`

---

## Two Tab Systems (do not confuse)

Local Studio has **two independent tab models**:

```text
┌──────┬────────────────────────────────────────────┬─────────────────────┐
│ Rail │         MULTI-PANE GRID (main canvas)      │  COMPUTER TABS      │
│      │  ┌──────────────┬──────────────────────┐  │  (right aside)      │
│      │  │ ChatPane A   │ ChatPane B           │  │                     │
│      │  │              │                      │  │ [Ctx][Term][Chat]…  │
│      │  └──────┬───────┴──────────────────────┘  │  tab bar + content  │
│      │         │ resize splitter                 │                     │
└──────┴─────────┴────────────────────────────────┴─────────────────────┘
     SYSTEM 1: PaneGrid + layout tree          SYSTEM 2: ComputerHeader
     (split main work area)                    (switch right panel content)
```

| System | Purpose | CE relevance |
| --- | --- | --- |
| **PaneGrid** | Split canvas into 2+ chat columns | Future: dual-domain compare |
| **Computer tabs** | Right panel: terminal, side-chat, etc. | **First** — extend CE `SidePanel` |
| **ui/tabs** | Simple tab rows in panels | Filters, settings, small modes |

---

# System 1 — Computer Panel Tabs (right aside)

## What it looks like

```text
┌─────────────────────────────────────────┬──┬──────────────────────────┐
│ Main chat (PaneGrid or single pane)    │█│ ComputerHeader           │
│                                         │█│ [Status][Side chat][×]…  │
│                                         │█├──────────────────────────┤
│                                         │█│                          │
│                                         │█│  ComputerTabPanel        │
│                                         │█│  (one panel per tab id)  │
│                                         │█│                          │
└─────────────────────────────────────────┴──┴──────────────────────────┘
                                          ↑ drag resize (computer.width)
```

Tab bar row (`ComputerHeader` in `agent-browser-panel.tsx`):

```text
┌─────────────────────────────────────────────────────────────────────┐
│ [●Status] [Side chat ×] [Terminal ×] [Term-2 ×]  [+]              │
│  ^active     ^closable tabs              ^per-owner terminal tabs   │
└─────────────────────────────────────────────────────────────────────┘
  h-10 | border-b | bg-(--color-header) | horizontal scroll
```

## Tab registry (single source of truth)

```typescript
// features/agent/tools/types.ts
export const COMPUTER_TAB_IDS = [
  "status", "tools", "canvas", "side-chat",
  "browser", "files", "diff", "terminal", "plan",
] as const;
export type ComputerTab = (typeof COMPUTER_TAB_IDS)[number];
```

**Rule:** add tab id → add panel in router → add label in header.

## Tab → panel router

```text
ComputerTabPanel (computer-tab-panel.tsx)
  panels: Record<ComputerTab, ReactNode>
    status     → ComputerStatusPanel
    side-chat  → ChatPane (mini chat)
    terminal   → (null; PersistentTerminals mounts below)
    browser    → AgentBrowser
    files      → FilesystemPanel
    …
  return panels[tools.computer.tab]
```

## State API

```text
tools/computer: { open, tab, tabs[], width, … }
tools.setComputerTab(tab)
tools.closeComputerTab(tab)
tools.setComputerOpen(open)
tools.setComputerWidth(px)
```

Persistence: `features/agent/tools/persistence.ts`

## Key files

| File | Role |
| --- | --- |
| `features/agent/tools/types.ts` | `COMPUTER_TAB_IDS`, `ComputerState` |
| `features/agent/tools/context.tsx` | Tab state + toggles |
| `features/agent/tools/persistence.ts` | localStorage width/tabs |
| `features/agent/ui/agent-browser-panel.tsx` | Aside shell, `ComputerHeader`, resize |
| `features/agent/ui/computer-tab-panel.tsx` | Tab → content router |
| `features/agent/ui/terminal-panel.tsx` | xterm slot |
| `features/agent/ui/persistent-terminals.tsx` | Keep terminals mounted when switching tabs |
| `features/agent/ui/chat-pane.tsx` | Reused for `side-chat` tab |

## CE mapping (SidePanel extension)

```text
CE SidePanel today:
  SessionContextNavigation | SourceInspectorPane  (fixed split)

Future (Computer pattern):
  ContextPanelHeader: [Context][Terminal][Side chat]
  ContextPanelRouter:
    context    → current CE evidence inspector (v1)
    terminal   → stub until backend contract
    side-chat  → slim LightRagChatShell instance
```

Suggested CE tab ids: `"context" | "terminal" | "side-chat"`.

---

# System 2 — Multi-Pane Workspace Grid (main canvas)

## What it looks like

**Single pane (boot):**

```text
┌─────────────────────────────────────────────────────────────┐
│ [Session title ▼]                          [···] [⊞ tools] │
├─────────────────────────────────────────────────────────────┤
│                    Timeline (messages)                      │
├─────────────────────────────────────────────────────────────┤
│ Composer                                                    │
└─────────────────────────────────────────────────────────────┘
```

**Two panes (vertical split):**

```text
┌─────────────────────────────┬─┬─────────────────────────────┐
│ ChatPane  p-left  (focused) │█│ ChatPane  p-right           │
│                             │█│                             │
│                             │█│  ← 1px drag splitter         │
└─────────────────────────────┴─┴─────────────────────────────┘
              50% ratio (clamped 15%–85%)
```

**Three panes (nested tree):**

```text
        [ split vertical 0.5 ]
        /                      \
  [ leaf p1 ]        [ split vertical 0.5 ]
                     /              \
              [ leaf p2 ]    [ leaf p3 ]
```

## Layout tree (data model)

```text
Layout =
  { kind: "leaf", paneId }           → one ChatPane
  OR
  { kind: "split", direction, ratio, a, b }

direction "vertical"   = side-by-side  (│ bar)
direction "horizontal" = stacked       (─ bar)
```

## Workspace state

```text
WorkspaceState
├── layout: Layout              ← binary tree
├── panesById: Map<paneId, { sessionId }>
├── sessions: Map<sessionId, Session>
├── focusedPaneId               ← keyboard + computer panel follows this
└── models, error, hydrated…
```

One leaf = one pane = one visible session = one `ChatPane`.

## Drag split (sidebar → pane)

While dragging a session, edge drop zones appear on each leaf:

```text
              ┌── TOP    → horizontal split, pane above
              │
        LEFT ─┤  CENTER  → open session in this pane
              │
              └── BOTTOM → horizontal split, pane below

        RIGHT ─┘           → vertical split, pane right
```

Drag MIME types (`projects-nav/helpers.ts`):

```text
application/x-vllm-agent-session  → JSON payload
application/x-vllm-session        → piSessionId (legacy)
```

## Orchestration flow

```text
AgentWorkspaceShell
  └─ PaneGrid
       layout={state.layout}
       renderPane={(id) => ChatPane}
       onSplit={splitPaneWithPayload}
       onOpenTab={openSessionPayloadInPane}
       onResize={setSplitRatio}
```

Actions → `reducer.ts` → `pane-controller.ts` → persistence.

## Key files

| Tier | File |
| --- | --- |
| Shell | `features/agent/ui/agent-workspace-shell.tsx` |
| Grid UI | `features/agent/ui/pane-grid.tsx` |
| Tree | `features/agent/workspace/layout.ts` |
| State | `features/agent/workspace/types.ts` |
| Logic | `features/agent/workspace/pane-controller.ts` |
| Reducer | `features/agent/workspace/reducer.ts` |
| Hooks | `features/agent/ui/use-workspace.ts` |
| Pane UI | `features/agent/ui/chat-pane.tsx` |
| Sidebar bridge | `features/agent/workspace/commands.ts` |
| Drag | `features/agent/ui/projects-nav/helpers.ts` |
| Persist | `features/agent/workspace/store.ts`, `persistence.ts` |

## CE relevance

| LS feature | CE v1? |
| --- | --- |
| PaneGrid splits | No — single `LightRagChatShell` |
| Drag from project sidebar | No — no LS projects in CE |
| localStorage pane layout | No — F-007 server conversations |
| ChatPane layout ideas | Yes — composer + timeline density |
| Multi-pane later | Optional phase 3 |

---

# System 3 — Shared UI Primitives

For simple tab rows (settings, filters, 2–4 modes):

| File | Variants |
| --- | --- |
| `ui/tabs.tsx` | `underline` \| `pill` \| `button-group` |
| `ui/segmented-control.tsx` | Compact `role="tablist"`, DESIGN.md aligned |

Use **`ComputerHeader`** density for workbench tab bars; use **`Tabs`/`SegmentedControl`** for in-panel switches (e.g. CE context filters: All | This answer | Pinned).

---

# Comparison

| | Computer tabs | PaneGrid | ui/tabs |
| --- | --- | --- | --- |
| **Where** | Right aside | Main canvas | Anywhere |
| **Model** | Flat id list | Binary tree | Props array |
| **Close tab** | Yes (most) | Close pane | Optional |
| **Resize** | Panel width | Split ratio | N/A |
| **CE priority** | High | Low | Medium |

---

# Recommended CE Build Order

```text
1. Port CE LightRagChatShell (single main pane)     ← F-007-chat-shell-flow.md
2. ContextPanelShell + registry (v1: context tab)   ← F-007-context-panel-tabs.md
3. Restyle with DESIGN.md tokens
4. Add terminal / side-chat tabs (Computer pattern)
5. (Optional) PaneGrid if product wants split chat columns
```

---

# Do NOT Pull Wholescale

```text
✗ features/agent/runtime/*, pi-runtime*
✗ features/agent/projects/* (LS folder model)
✗ Electron PTY bridge (terminal-panel localStudioDesktop)
✗ localStorage pane/session persistence as product truth
✗ Browser/filesystem/git panels unless spec adds them
```

---

# See Also

| Doc | Topic |
| --- | --- |
| `feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md` | CE chat shell |
| `feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md` | CE tabbed SidePanel plan |
| `feature-ce-api-uiux-wirering-brainstorm/02-ce-client-port-map.md` | CE client port map |
| `DESIGN.md` §7.3 | Tabs / segmented controls |
