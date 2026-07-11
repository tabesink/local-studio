# F-007 — Context Panel Tabs (Modular Extension Architecture)

Build CE chat’s **right panel** as a **tabbed shell** from day one. Ship **one tab: Context / evidence** (port old CE `SidePanel`). Future tabs (terminal, side-chat, ops, etc.) plug in without restructuring `/chat`.

**Pattern source:** Local Studio — see `.references/local-studio-tab-patterns.md` (Computer tabs) and `AgentBrowserPanel` / `ComputerTabPanel` / `COMPUTER_TAB_IDS`.  
**Authority:** `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`

## 1. Target Layout

```text
/chat — LightRagChatShell
├── LEFT (unchanged)          ConversationView + ChatComposer
└── RIGHT ContextPanelShell   ← rename/evolve SidePanel
      ├── ContextPanelTabBar  ← LS ComputerHeader pattern
      │     [Context ●]  [+]        v1: only Context; + reserved
      └── ContextPanelRouter
            "context"  → ContextTabPanel (CE port)
            "terminal" → (future)
            "side-chat"→ (future)
```

v1 tab bar may show **Context only** (no visible bar) or a single active tab — but **code structure** must use the registry/router pattern so adding tabs is one file change + one panel component.

---

## 2. v1 Scope — Context Tab Only

Port existing CE right panel **inside** tab `"context"`:

```text
ContextTabPanel  (= today's SidePanel inner content)
├── ContextStatusStrip        (retrieval summary — optional v1)
└── ResizablePanelGroup
      ├── SessionContextNavigation   evidence list, filters, pins
      └── SourceInspectorPane        selected source detail
```

| CE client file | Role |
| --- | --- |
| `components/chat/SidePanel.tsx` | collapsible aside, resize, mobile drawer |
| `components/chat/SessionContextNavigation.tsx` | evidence ledger UI |
| `components/chat/SourceInspectorPane.tsx` | source inspector |
| `lib/session-context-ledger.ts` | ledger state |

Restyle with `DESIGN.md` / LS tokens. **Do not** change evidence-before-answer or assistant-click binding (see `F-007-chat-shell-flow.md`).

---

## 3. Modular Tab Registry (copy LS pattern)

Single source of truth — add a tab here, then panel + label.

```typescript
// features/chat/context-panel/types.ts  (new CE module)

export const CONTEXT_PANEL_TAB_IDS = ["context"] as const;
// Future: push "terminal" | "side-chat" | "operations" after spec gate

export type ContextPanelTabId = (typeof CONTEXT_PANEL_TAB_IDS)[number];

export type ContextPanelState = {
  open: boolean;
  activeTab: ContextPanelTabId;
  openTabs: ContextPanelTabId[];   // tabs with closable instances
  width: number;                   // px, resizable aside
};
```

Mirror LS:

| LS file | CE analogue |
| --- | --- |
| `features/agent/tools/types.ts` | `context-panel/types.ts` |
| `features/agent/tools/context.tsx` | `context-panel/store.tsx` or hook |
| `features/agent/tools/persistence.ts` | optional: persist width + open tabs |

**Rule (from LS comment on `COMPUTER_TAB_IDS`):** new tab = add id to const array + panel component + tab bar label. No scattered string literals.

---

## 4. Panel Router (copy LS `ComputerTabPanel`)

```typescript
// ContextPanelRouter.tsx

const panels: Record<ContextPanelTabId, ReactNode> = {
  context: <ContextTabPanel {...contextProps} />,
  // terminal: <TerminalTabPanel ... />,      // future
  // "side-chat": <SideChatTabPanel ... />,  // future
};

return panels[state.activeTab];
```

LS reference: `features/agent/ui/computer-tab-panel.tsx` (~77–100).

---

## 5. Tab Bar Shell (copy LS `ComputerHeader`)

When only `context` is registered, bar can be minimal (title + collapse). When ≥2 tabs, use LS row:

| LS file | What to copy |
| --- | --- |
| `features/agent/ui/agent-browser-panel.tsx` | Aside shell, width resize, `ComputerHeader` (~362–500) |
| `ui/tabs.tsx` or `ui/segmented-control.tsx` | simpler variant if &lt;4 tabs |

Tab bar rules (from LS):

- `h-10`, `border-b`, `bg-(--color-header)`
- Active: `bg-(--color-surface-hover)`
- Closable tabs except default (`context` = not closable, like LS `status`)
- `[+]` launcher → future tab picker (hide in v1 or show disabled)

---

## 6. Component Tree (CE target)

```text
LightRagChatShell
├── section (conversation column)     ← port unchanged
└── ContextPanelShell                 ← evolves SidePanel
      ├── ContextPanelTabBar
      ├── ContextPanelRouter
      │     └── ContextTabPanel
      │           ├── SessionContextNavigation
      │           └── SourceInspectorPane
      └── (future) PersistentTerminals mount slot — sibling, LS pattern
```

State stays in `chat-session-store` for ledger/navigator; add `contextPanel: ContextPanelState` or separate `context-panel-store`.

---

## 7. Future Tabs (explicitly out of v1 — slots reserved)

| Tab id | Purpose | LS reference | CE gate |
| --- | --- | --- | --- |
| `context` | Evidence + source inspector | CE SidePanel | **P9 slice 11–12** |
| `terminal` | Admin/dev terminal | `terminal-panel.tsx`, `persistent-terminals.tsx` | product + backend contract |
| `side-chat` | Second domain-scoped chat | `computer-tab-panel.tsx` SideChatTab | F-007 conversation model |
| `operations` | Prep/index op tail | `logs-view.tsx` | P9 slice 15 |

Do **not** implement future tabs in v1. **Do** implement registry + router so each is a vertical slice later.

---

## 8. LS Files to Pull (prioritized)

```text
PATTERN (required)
  local-studio/.../features/agent/tools/types.ts
  local-studio/.../features/agent/ui/computer-tab-panel.tsx
  local-studio/.../features/agent/ui/agent-browser-panel.tsx  (ComputerHeader + aside)
  local-studio/.../ui/tabs.tsx
  local-studio/.../ui/segmented-control.tsx

CONTENT v1 (CE client — not LS)
  context-engine/client/.../SidePanel.tsx
  context-engine/client/.../SessionContextNavigation.tsx
  context-engine/client/.../SourceInspectorPane.tsx

FUTURE tab bodies (when spec allows)
  local-studio/.../terminal-panel.tsx
  local-studio/.../persistent-terminals.tsx
  local-studio/.../chat-pane.tsx  (side-chat only)
```

---

## 9. Wiring to SSE / Evidence

Context tab consumes data **already** produced by `LightRagChatShell.submit()`:

```text
SSE sources/evidence event
  → contextByAssistantId[assistantId]
  → mergeRetrievalFrameIntoLedger(sessionContextLedger)
  → ContextTabPanel reads ledger + sourceNavigator
  → user selects row → SourceInspectorPane
```

Tab shell is **presentational boundary** only — no second fetch path for evidence.

---

## 10. Build Order (junior dev)

```text
1. Create context-panel/types.ts + store (activeTab = "context" only)
2. Wrap existing SidePanel content in ContextTabPanel
3. Rename SidePanel → ContextPanelShell; add ContextPanelRouter (single entry)
4. Restyle aside + inner split with DESIGN.md tokens
5. Wire to LightRagChatShell (same props/callbacks as today)
6. Add Playwright: panel open/collapse, evidence row → inspector, mobile drawer
7. (Later) Add tab to CONTEXT_PANEL_TAB_IDS + panel + bar label — no shell rewrite
```

---

## 11. Anti-Patterns

```text
✗ Hard-code SidePanel as only right-panel implementation with no tab type
✗ Copy LS agent runtime / PaneGrid for v1 (overkill)
✗ Copy Electron terminal bridge into CE pilot
✗ New tab that fetches evidence independently of chat turn SSE
✗ Hide context tab and use generic RightDetailPanel from documents route
```

---

## See Also

- **Authority:** `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`
- `F-007-chat-shell-flow.md` — full chat shell flow
- `02-ce-client-port-map.md` — CE chat port map
- `01-local-studio-parity-cheatsheet.md` — restyle tokens
