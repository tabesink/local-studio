---
id: F-009-TABS
title: Chat Context Panel Tabs Contract
status: approved
owner: Context Engine frontend team
last_reviewed: 2026-07-02
depends_on: [F-009, ce-client-port-and-parity.md]
supersedes: []
---

# Chat Context Panel Tabs

## Governing Rule

Build `/chat` right panel as a **tabbed shell** from P9 slice 11. Ship **one tab in v1: `context`** (evidence + source inspector). Future tabs plug in via registry + router without restructuring `LightRagChatShell`.

```text
PORT content (v1)     ←  old CE SidePanel inner content
PORT tab pattern      ←  Local Studio AgentBrowserPanel / ComputerTabPanel / COMPUTER_TAB_IDS
RESTYLE               ←  DESIGN.md
```

## Target Layout

```text
LightRagChatShell
├── LEFT (unchanged)     ConversationView + ChatComposer
└── ContextPanelShell    evolves CE SidePanel
      ├── ContextPanelTabBar     LS ComputerHeader pattern when ≥2 tabs
      └── ContextPanelRouter
            context  → ContextTabPanel   (v1 — required)
            terminal → (future)
            side-chat → (future)
            operations → (future)
```

v1 may hide the tab bar when only `context` is registered. **Code must still use** `CONTEXT_PANEL_TAB_IDS` + router — not a hard-coded SidePanel-only implementation.

## v1 — Context Tab

Port CE client content inside `ContextTabPanel`:

```text
ContextTabPanel
└── ResizablePanelGroup
      ├── SessionContextNavigation   evidence list, filters, pins
      └── SourceInspectorPane        selected source detail
```

| CE client file | Role |
| --- | --- |
| `components/chat/SidePanel.tsx` | collapsible aside, resize, mobile drawer → `ContextPanelShell` |
| `components/chat/SessionContextNavigation.tsx` | evidence ledger |
| `components/chat/SourceInspectorPane.tsx` | source inspector |
| `lib/session-context-ledger.ts` | ledger state |

Evidence data comes from P7 SSE turn flow only. The tab shell does not add a second evidence fetch path.

Direct LLM turns have no Evidence and leave the context tab empty for that assistant message. Domain RAG turns populate the context tab only from P7 `evidence` SSE events.

## Tab Registry (required pattern)

```typescript
export const CONTEXT_PANEL_TAB_IDS = ["context"] as const;
export type ContextPanelTabId = (typeof CONTEXT_PANEL_TAB_IDS)[number];
```

Adding a tab later:

1. append id to `CONTEXT_PANEL_TAB_IDS`;
2. add panel component to `ContextPanelRouter`;
3. add tab bar label (and spec gate if product behavior is new).

Local Studio references for pattern only:

| LS | CE |
| --- | --- |
| `features/agent/tools/types.ts` | `features/chat/context-panel/types.ts` |
| `features/agent/ui/computer-tab-panel.tsx` | `ContextPanelRouter` |
| `features/agent/ui/agent-browser-panel.tsx` | `ContextPanelShell` + `ContextPanelTabBar` |
| `ui/tabs.tsx`, `ui/segmented-control.tsx` | tab bar styling |

## Future Tabs (out of v1 — reserved)

| Tab id | Purpose | Gate |
| --- | --- | --- |
| `context` | Evidence + source inspector | P9 slices 11–12 |
| `terminal` | Admin/dev terminal | product + backend contract; no Electron bridge in pilot by default |
| `side-chat` | Second domain-scoped chat | F-007 conversation model |
| `operations` | Prep/index operation tail | P9 slice 15 |

Do not implement future tabs in v1.

## Wiring To Chat SSE

```text
SSE evidence event
  → contextByAssistantId + sessionContextLedger
  → ContextTabPanel (context tab)
  → row select → SourceInspectorPane
```

`stage` SSE events may update a compact activity indicator in the shell. The context panel must ignore planning text because no planning text is allowed in EVT-001.

## Forbidden

- Hard-coded SidePanel with no tab registry
- LS agent PaneGrid / multi main-pane splits for v1
- New tab that fetches evidence outside chat turn SSE
- Route/model/tool/retrieval-mode controls in the chat shell
- Replacing context panel with documents-route `RightDetailPanel` pattern

## Evidence Pack

Terse junior notes: `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md` (not authority).
