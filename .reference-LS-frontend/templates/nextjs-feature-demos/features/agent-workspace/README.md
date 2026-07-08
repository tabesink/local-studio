# Agent Workspace

Carbon copy of the Local Studio agent surfaces beyond the basic chat pane: the
`/agent` workspace shell (binary-split pane grid + right "computer" panel with all
nine tabs) and the `/agent/sessions` index page, plus the ⌘K command palette and
the composer extras (queue/steer, context chips, mention picker, model picker,
status bar).

## What it demonstrates

- **Workspace shell** — full-height `--agent-bg` column, dismissible error/warning
  banner slot, demo route switcher between `/agent` and `/agent/sessions`.
- **Pane grid** — binary split tree (leaf/split) with draggable separators clamped
  to 0.15–0.85; the pane-header ⋯ menu's **Fork** splits the pane; a close button
  appears when more than one pane exists. Layout persists to
  `localStorage["local-studio.agent.paneState"]`.
- **Computer panel** — right aside, default 440px, left-edge resize
  (min `max(280px, 25vw)`, max 65vw), `h-10` tab bar, all nine tabs:
  Status (token totals + Compact + workspace rows), Tools (launcher cards),
  Plan (List/Raw toggle, progress bar, checkbox todos), Filesystem (tree + viewer),
  Git (branch bar + unified diff), Terminal (fixture scrollback), Browser (URL bar +
  static screencast frame), Canvas (scratchboard textarea), Side chat (embedded
  mini chat pane without a header).
- **Sessions page** — eyebrow "Agent" / title "Sessions", summary chips
  (Sessions/Running/Projects/Refresh), search with ⌘K hint, All/Running/Idle pills,
  project select, sortable table with pulsing running dots.
- **Command palette** — ⌘K overlay (`w-[min(720px,92vw)] rounded-2xl` over
  `bg-black/55 backdrop-blur-sm`), sections App destinations / Running now /
  Recent sessions, ↑↓ ↵ esc footer.
- **Composer extras** — queue panel (steer vs queue), context chips (`@` plugins
  sky, `$` skills emerald, `/` templates amber), mention picker, attachment tray,
  model picker popover (340px with R/V/running badges), Steer/Queue/Stop
  running-turn controls, and the mono `cwd | git | tokens/contextWindow` status bar.
- **Runtime event grammar** — sending a message streams fixture SSE frames typed
  after the real runtime contract (`status` frames plus `pi` frames:
  `message_start`, `message_update` with `text_delta`/`thinking_delta`/
  `toolcall_*`, `tool_execution_start/end`, `message_end`, `agent_end`,
  `compaction_end`, `queue_update`), so the streaming demo exercises exactly the
  envelope a FastAPI backend must emit.

## Reference copy map

| This slice | Reference source |
| --- | --- |
| `components/agent-workspace-demo.tsx` | `.references/local-studio/frontend/src/features/agent/ui/agent-workspace-shell.tsx` |
| `components/pane-grid.tsx` | `.../agent/workspace/layout.ts` + shell split rendering |
| `components/chat-pane.tsx` | `.../agent/ui/chat-pane.tsx`, `agent-composer-frame.tsx`, `agent-model-picker.tsx`, `agent-mention-picker.tsx`, `timeline.tsx` |
| `components/computer-panel.tsx` | `.../agent/tools/agent-browser-panel.tsx` + per-tab panels (`plan-panel`, `filesystem-panel`, `git-diff-panel`, `canvas-panel`, terminal/browser hosts) |
| `components/sessions-page.tsx` | `.../agent/sessions/sessions-page.tsx` |
| `components/sessions-command.tsx` | `.../agent/sessions/sessions-command.tsx` |
| `types/index.ts` runtime frames | `.../agent/runtime-schema.ts`, `runtime/pi-event-applier.ts` |
| `hooks/use-agent-workspace.ts` | `.../agent/use-agent-*.ts` orchestration hooks |

## Backend wiring

`api/index.ts` is the swap point. The runtime SSE endpoint, turn/abort/compact
POSTs, and the sessions index API — including a worked FastAPI SSE example for the
chat pipeline — are documented in
[`docs/feature-parity/backend-wiring.md`](../../../../docs/feature-parity/backend-wiring.md).

## Known simplifications

- No real PTY, CDP, or Pi SDK: Terminal shows a fixture scrollback, Browser shows a
  static screencast frame, and turns replay a canned Pi event stream.
- Side chat reuses the same fixture stream against a separate session.
- Projects nav / project switching is represented by the sessions page project
  select rather than the left-rail project tree.
- Pane drag-and-drop reordering is not implemented (Fork/close/resize are).
