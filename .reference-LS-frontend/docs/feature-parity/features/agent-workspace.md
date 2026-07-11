# Feature: Agent Workspace

## Purpose

The agent workspace is the bulk of the app: the `/agent` shell hosting one or more chat panes in a splittable grid, the right "computer" panel with nine tool tabs, the `/agent/sessions` index page, the ⌘K command palette, and the composer extras (steer/queue, context chips, mention picker, model picker, status bar). It renders the live agent runtime stream.

## Reference Code Map

- `.references/local-studio/frontend/src/features/agent/ui/agent-workspace-shell.tsx`: full-height `bg-(--agent-bg)` column, error/warning overlay banners, project empty state, pane grid rendering.
- `.../agent/workspace/layout.ts`: binary split tree (leaf/split), ratio clamp, persistence.
- `.../agent/ui/chat-pane.tsx`, `timeline.tsx`: pane header + ⋯ menu (Rename/Pin/Fork/Export/Show reasoning), block timeline, empty-state copy.
- `.../agent/ui/agent-composer-frame.tsx`, `agent-model-picker.tsx`, `agent-mention-picker.tsx`: composer surface, queue panel, chips, pickers, Steer/Queue/Stop, status bar.
- `.../agent/tools/agent-browser-panel.tsx` + panels (`plan-panel.tsx`, `filesystem-panel.tsx`, `git-diff-panel.tsx`, `canvas-panel.tsx`, terminal/browser hosts): computer panel tab bar + tab bodies; `TAB_LABELS`.
- `.../agent/sessions/sessions-page.tsx`, `sessions-command.tsx`: sessions table + ⌘K palette.
- `.../agent/runtime-schema.ts`, `runtime/pi-event-applier.ts`: SSE frame envelope and Pi event application.

## User Workflow

1. `/agent` restores the persisted pane layout and computer panel state, then subscribes to the runtime SSE stream.
2. User types in the composer; Enter submits a turn (`POST /api/agent/turn`); the timeline builds from streamed `pi` events (thinking → tool call → text deltas).
3. While a turn runs: Enter = Steer (interrupt with new direction), Tab = Queue (follow-up), Esc/Stop square = abort (`POST /api/agent/abort`). Queued items render in the queue panel above the composer and drain after the turn.
4. Pane header ⋯ menu: Fork splits the pane (both halves on the same session); close button appears when >1 pane; separators drag with ratio clamped 0.15–0.85; layout persists.
5. The computer panel (right, 440px default, left-edge resize) exposes nine tabs: Status, Tools, Plan, Filesystem, Git, Terminal, Browser, Canvas, Side chat. Status offers Compact (`POST /api/agent/compact`).
6. `/agent/sessions` lists sessions with summary chips, search (⌘K hint), All/Running/Idle pills, project select, and a sortable table; clicking a row opens it in the focused pane.
7. ⌘K opens the command palette anywhere: App destinations / Running now / Recent sessions, keyboard navigable.

## UI/UX Parity Notes

- Workspace column is `bg-(--agent-bg)`; pane headers are `h-10` on `--color-header` with a hairline border.
- Timeline empty state: "A dream is something you build for yourself." / "Just talk to it."
- Composer: `max-w-[var(--composer-w)]`, `rounded-[var(--composer-radius)]`, `bg-(--composer)`, `shadow-[var(--composer-shadow)]`; send is a round `bg-(--fg)/90` arrow button; Stop is a red round square.
- Context chips: `@` plugins sky (`--link`), `$` skills emerald (`--ok`), `/` templates amber (`--warn`).
- Model picker popover is `w-[340px]` with mono model ids and R/V/running badges.
- Status bar: mono `cwd` left; `branch · +N -M · K files` and `tokens/contextWindow` right; the token counter opens the Status tab.
- Computer panel: `bg-(--color-panel)`, `h-10` tab bar, resize handle on the left edge (min `max(280px, 25vw)`, max 65vw).
- Command palette: `w-[min(720px,92vw)] rounded-2xl` over `bg-black/55 backdrop-blur-sm`; ↑↓ ↵ esc footer.
- Sessions table running dots pulse (`animate-pulse` on `--ui-success`).

## ASCII Mockup

```txt
+-- pane: Wire usage panel... ● --------------+--- computer (440px) ---+
| user: Wire the usage panel to ...           | Status Plan Files Git  |
| thinking: The usage page polls /stats ...   | Terminal Browser ... + |
| [tool] read_file  DONE  use-usage.ts        |------------------------|
| The hook already isolates fetching ...      | SESSION                |
|                                             |  Title  Wire usage...  |
| +--------------- composer ----------------+ |  Model  qwen3-32b-awq  |
| | @filesystem $code-review /plan          | | CONTEXT                |
| | Ask anything                            | |  41,230/131,072 · 31%  |
| | [clip][brain qwen3-32b-awq v]   [Send ↑]| |  [====      ] Compact  |
| +-----------------------------------------+ | WORKSPACE              |
| ~/code/local-studio   feat/usage · +214 -38 |  Project local-studio  |
+---------------------------------------------+------------------------+
```

## Folder Structure

```txt
templates/nextjs-feature-demos/features/agent-workspace/
  components/
    agent-workspace-demo.tsx   ← shell + view switch + palette mount
    pane-grid.tsx              ← split tree + drag separators
    chat-pane.tsx              ← header/timeline/composer extras
    computer-panel.tsx         ← 9 tabs
    sessions-page.tsx
    sessions-command.tsx
  hooks/use-agent-workspace.ts
  api/index.ts                 ← backend seam (SSE stream + POSTs)
  types/index.ts               ← runtime frame + Pi event types
  fixtures/index.ts
  constants/index.ts
  index.ts
  README.md
```

## API Contracts

| Endpoint | Method | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| `/api/agent/runtime/events` | GET (SSE) | none | `{"type":"status",...}` and `{"type":"pi","seq":n,"event":PiEvent}` frames | one long-lived stream per client |
| `/api/agent/turn` | POST | `{ sessionId, text, mode?: "steer" \| "follow_up" }` | 202 | results arrive on the SSE stream |
| `/api/agent/abort` | POST | `{ sessionId }` | `{ success }` | Stop control |
| `/api/agent/compact` | POST | `{ sessionId }` | `{ success, message }` | Status tab Compact |
| `/api/agent/sessions/all?since=90d` | GET | none | session index rows | sessions page |
| `/api/agent/sessions/{piSessionId}` | GET | none | canonical event log | replay on open |

Pi event grammar (must match the fixture stream): `message_start`, `message_update` (`text_delta` / `thinking_delta` / `toolcall_start` / `toolcall_end`), `message_end`, `tool_execution_start`, `tool_execution_end`, `agent_end`, `compaction_end`, `queue_update`.

## State Model

- Hook state: view, sessions, per-session messages, running session, split-tree layout + focused pane, computer open/tab/width, queue items, plan tasks, canvas text, banner, palette open, reasoning visibility.
- localStorage: `local-studio.agent.paneState` (layout + focus), `local-studio.agent.computer.width`, `local-studio.agent.computer.tab`.
- Simulations: `streamTurn()` replays a canned frame list (~260ms cadence); queue drains after `agent_end`.

## Types

`RuntimeSseFrame` (`status` | `pi`), `PiEvent`, `TimelineBlock`, `WorkspaceMessage`, `PaneLayout`, `ComputerTab` (9 ids), `AgentSession`, `AgentProject`, `PlanTask`, `GitDiffFile`, `FsNode`, `ModelOption`, `QueueItem`.

## Implementation Steps

1. Define the runtime frame/Pi event types first — they are the backend contract.
2. Build the split-tree layout helpers (collect/split/remove/ratio) with persistence.
3. Build the chat pane: header menu, timeline block renderer, composer extras.
4. Build the computer panel tab bar and the nine tab bodies from fixtures.
5. Build the sessions page and the ⌘K palette; bind Cmd/Ctrl+K globally.
6. Wire the fixture stream through a Pi-event applier so streaming demos exercise the real grammar.

## Copy / Modify Map

- Copy `TAB_LABELS`, timeline empty copy, steer/queue key behavior, and the frame envelope from the reference files listed above.
- Copy composer chrome classes from `agent-composer-frame.tsx` (already ported for chat-shell).
- Modify: Terminal/Browser are fixtures (no PTY/CDP); side chat reuses the fixture stream; the route switcher strip is demo-only.

## Acceptance Criteria

- Fork splits the focused pane; separators drag within 0.15–0.85; layout survives reload.
- Sending a turn streams thinking → tool → text blocks and drains queued follow-ups.
- Steer/Queue/Stop controls appear only while running; Tab queues; Esc aborts.
- All nine computer tabs render; Status Compact appends a compaction event; Plan toggles List/Raw.
- Sessions table filters (search/status/project), sorts, and opens rows into the workspace.
- ⌘K opens the palette with the three sections and keyboard navigation.

## Anti-Overengineering Notes

Do not embed a real terminal emulator, CDP screencast, or agent SDK. The fixture stream must keep the exact `status`/`pi` envelope so a FastAPI backend can slot in behind `api/index.ts` without UI changes.
