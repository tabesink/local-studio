# Feature: Chat Shell

## Purpose

The chat shell is the agent workspace experience: single or split chat panes, timeline, composer, attachments/context, queued follow-ups, runtime submit/abort/compact/replay contracts, and optional right-side tool tabs. For demos, implement one pane by default and document extension points.

## Current Code Map

- `app/agent/page.tsx`: renders `AgentWorkspace`.
- `features/agent/ui/agent-workspace-shell.tsx`: workspace shell, top banners, pane grid, right computer panel.
- `features/agent/ui/chat-pane.tsx`: chat pane composition and send flow.
- `features/agent/ui/agent-chat-pane-header.tsx`: pane/session header.
- `features/agent/ui/timeline/timeline.tsx`: message timeline and empty prompt.
- `features/agent/ui/agent-composer-frame.tsx`: composer surface.
- `features/agent/ui/chat-pane-composer.ts`: attachments, mention rows, textarea behavior.
- `features/agent/runtime/api.ts`: HTTP/SSE runtime client.
- `features/agent/runtime/engine.ts`: session engine over runtime client.
- `features/agent/messages/types.ts`: message, block, queue, token stats types.
- `features/agent/tools/types.ts`: right-side computer tabs and tool selection.

## User Workflow

1. User opens `/agent`.
2. Workspace hydrates sessions, selected project, selected model, and pane layout.
3. A focused `ChatPane` renders header, timeline, and composer.
4. User types prompt, attaches files, selects context/plugin/skill chips, or queues a follow-up.
5. Submit calls `POST /api/agent/turn`.
6. Runtime returns accepted/queued/rejected command result.
7. SSE subscription to `/api/agent/runtime/events` streams status and Pi events.
8. Engine applies events to messages, blocks, queue, token stats, and running/error state.
9. User may abort, retry, compact, replay a previous session, fork, or open right-side tabs.

Loading: models/session hydration and right panel lazy fallback. Empty: new chat prompt in timeline. Error: dismissible error bar with Retry when possible. Final UI: assistant/user messages and tool/thinking blocks stream into timeline, composer re-enables.

## UI/UX Parity Notes

- Main workspace is full height `bg-(--agent-bg)`.
- Composer is a lifted charcoal surface with border, radius, shadow, max width token.
- Timeline owns scrolling and stick-to-bottom behavior.
- Error banner sits above timeline inside the pane.
- Composer footer contains actions and model picker; status bar below shows cwd, git, tokens.
- Right "computer" panel is optional for demo; if included, use tab ids from `COMPUTER_TAB_IDS`.
- Multi-pane grid is an extension; default demo should be single pane.

## ASCII Mockup

```txt
+----------------------------------------------------+ optional right panel
| ChatPane header: title, model, branch, tools        | [Status][Files][Term]
+----------------------------------------------------+---------------------+
| timeline                                           | panel content        |
|   user message                                     |                     |
|   assistant text/tool/thinking blocks              |                     |
|                                                    |                     |
| [queued follow-ups]                                |                     |
| + composer --------------------------------------+ |                     |
| | loaded context chips                            | |                     |
| | textarea                                        | |                     |
| | attach browser canvas queue stop model send     | |                     |
| +-------------------------------------------------+ |                     |
| cwd | branch | token usage                         |                     |
+----------------------------------------------------+---------------------+
```

## Proposed Folder Structure

```txt
features/chat-shell/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `ChatShellDemo`: one-pane workspace demo.
- `ChatPane`: timeline plus composer plus error bar.
- `ChatTimeline`: renders user/assistant/system messages and blocks.
- `ComposerFrame`: attachments, loaded-context chips, textarea, action row.
- `QueuePanel`: queued follow-up chips.
- `ComputerTabsPanel`: optional right panel router.

## API Contracts

| Endpoint | Method | Source | Request | Response | Retry/SSE/Auth |
| --- | --- | --- | --- | --- | --- |
| `/api/agent/turn` | POST | `features/agent/runtime/api.ts`, `contracts.ts` | `SubmitTurnArgs` | `AgentTurnCommandResult` | rejected outcome throws |
| `/api/agent/abort` | POST | `runtime/api.ts` | `{ sessionId }` | ignored body | errors swallowed |
| `/api/agent/compact` | POST | `runtime/api.ts` | `CompactSessionArgs` | `{ status? }` | non-ok throws `error` |
| `/api/agent/runtime/status?sessionId&piSessionId` | GET | `runtime/api.ts` | query | `{ status?, events? }` | returns null on failure |
| `/api/agent/runtime/events?sessionId&after&piSessionId` | SSE GET | `runtime/api.ts` | query | message frames decoded by schema | `onerror` triggers status probe |
| `/api/agent/runtime/sessions` | GET | `runtime/api.ts` | none | `{ sessions }` | failures return `[]` |
| `/api/agent/sessions/{id}?cwd=...` | GET | `runtime/api.ts` | path/query | `{ events }` | non-ok throws |

## State Model

- Workspace state: sessions map, selected model, layout, focused pane.
- Pane state: active tab/session.
- Local React: composer input, attachments, mention picker, queue expanded, stick-to-bottom, errors.
- Runtime engine state: running, event sequence, Pi session id, context usage.
- Persistence: workspace layout/session metadata in localStorage in production; omit for minimal demo unless showing restore.
- SSE: per-runtime EventSource subscription.

## Types / Schemas

```ts
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  attachments?: ChatMessageAttachment[];
  blocks?: AssistantBlock[];
  timestamp?: string;
}

export type AssistantBlock =
  | { kind: "text"; id: string; text: string }
  | { kind: "thinking"; id: string; text: string }
  | { kind: "event"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; status: "running" | "done" | "error"; text: string };

export interface SubmitTurnArgs {
  sessionId: string;
  modelId: string;
  message: string;
  cwd?: string;
  piSessionId?: string | null;
  browserToolEnabled: boolean;
  canvasEnabled?: boolean;
  mode?: "steer" | "follow_up";
}
```

## Implementation Steps

1. Start with one pane and a fixture session.
2. Implement message timeline, empty prompt, error bar, and composer frame.
3. Add attachments/context chips as local UI state.
4. Implement `submitTurn` mock that returns accepted and streams fixture deltas.
5. Add abort/retry/queue behavior at the UI level.
6. Document but do not implement multi-pane and right-panel internals unless that slice is requested.

## Copy / Modify Map

- Copy visual structure from `chat-pane.tsx`, `agent-composer-frame.tsx`, `timeline.tsx`.
- Copy contracts from `runtime/api.ts`, `contracts.ts`, `messages/types.ts`.
- Modify runtime engine into fixture event stream for demos.
- Do not copy browser/filesystem/terminal panels into the base chat-shell slice.

## Acceptance Criteria

- Empty, streaming, queued, error, retry, abort, and completed states are visible.
- Composer visual treatment matches reference.
- Submit and SSE contracts are documented.
- One-pane demo has no project/plugin/provider framework beyond typed fixtures.

## Anti-Overengineering Notes

Do not build a new agent runtime, workflow engine, tool plugin system, or multi-pane manager for the base demo. Preserve those as documented extension points.
