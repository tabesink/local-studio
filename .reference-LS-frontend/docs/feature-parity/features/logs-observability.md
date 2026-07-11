# Feature: Logs / Observability

## Purpose

Logs and observability provide two related surfaces: `/logs` for session log browsing and `/server` for controller status, runtime facts, logs, and embedded API docs.

## Current Code Map

- `app/logs/page.tsx`: wires `useLogs` into `LogsView`.
- `features/logs/use-logs.tsx`: session list, selected logs, filters, auto-refresh SSE, auto-scroll, delete, download.
- `features/logs/logs-view.tsx`: split layout with session sidebar and content pane.
- `features/logs/logs-sessions-sidebar.tsx`: desktop sidebar and mobile drawer.
- `features/logs/server-view.tsx`: server console with status aside, logs/docs tabs, realtime status.
- `lib/api/logs.ts`: `getLogSessions`, `getLogs`, `deleteLogSession`.

## User Workflow

1. User opens `/logs`.
2. `useLogs` loads sessions from `GET /logs`.
3. First available session is selected automatically.
4. Selected session loads `GET /logs/{sessionId}?limit=2000`.
5. User filters sessions, filters log content, toggles auto-scroll, toggles auto-refresh, refreshes manually, downloads, or deletes.
6. Auto-refresh opens `EventSource('/api/proxy/logs/{id}/stream?tail=0[&api_key=...]')`, listens for `log` events, appends lines, and caps to `20_000`.
7. `/server` reuses `useLogs` plus realtime status, status facts, logs/docs tabs, and API docs iframe/srcdoc.

Loading: full-page loading for sessions; content loading for selected log. Empty: no sessions or no content states. Error: failed content becomes `Failed to load log content`; delete errors alert. Final UI: selected session visible and filtered log lines colored by severity.

## UI/UX Parity Notes

- `/logs`: full-height horizontal split, 18rem left session list, mono content pane.
- Mobile: session sidebar becomes overlay drawer.
- Header controls: selected ID, auto-refresh, auto-scroll, content filter, refresh, download.
- Log content uses mono, tiny text, severity colors, hover row background.
- `/server`: header with controller URL and status pills, left status aside, main logs/docs viewer.
- API docs tab uses proxy spec/docs and should not require a full admin shell.

## ASCII Mockup

```txt
/logs
+--------------------+---------------------------------------+
| Log Sessions       | > session-id                 [r][dl] |
| [filter]           | [auto-refresh] [auto-scroll] [filter]|
| model A    vllm    |                                       |
| model B    sglang  |  INFO server started                  |
| controller         |  WARN ...                             |
| 3 sessions         |  ERROR ...                            |
+--------------------+---------------------------------------+

/server
+------------------------------------------------------------+
| SERVER Controller http://127.0.0.1:8080 [online][idle][r]   |
+--------------------------+---------------------------------+
| Connection               | tabs: Server Logs | API Docs     |
| Runtime                  | logs or docs viewer              |
| Backends                 |                                 |
| Sessions                 |                                 |
+--------------------------+---------------------------------+
```

## Proposed Folder Structure

```txt
features/logs-observability/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `LogsObservabilityDemo`: route-like switch between logs and server mode.
- `LogsView`: split session/content view.
- `LogsSessionsSidebar`: session filter and rows.
- `LogContentPanel`: header controls and log lines.
- `ServerConsole`: status aside plus logs/docs tabs.
- `StatusGroup`: key-value status sections.

## API Contracts

| Endpoint | Method | Source | Request | Response | Retry/Polling/Auth |
| --- | --- | --- | --- | --- | --- |
| `/logs` | GET | `lib/api/logs.ts` | none | `{ sessions: LogSession[] }` | default API retry |
| `/logs/{sessionId}?limit=2000` | GET | `lib/api/logs.ts`, `use-logs.tsx` | path and limit | `{ logs: string[] }` | manual refresh |
| `/logs/{sessionId}` | DELETE | `lib/api/logs.ts` | path id | empty body | cannot delete `controller` in UI |
| `/api/proxy/logs/{sessionId}/stream?tail=0` | SSE GET | `use-logs.tsx` | path, optional `api_key` query | `log` event with `{ data: { session_id, line } }` | EventSource auto reconnect |
| `/api/proxy/api/spec` | GET | `server-view.tsx` | none | OpenAPI spec | used for docs srcdoc |

## State Model

- Local React: sessions, selected session, log lines, filters, loading flags, toggles, drawer open.
- Ref: scroll container and EventSource.
- External store: realtime status for `/server`.
- Browser-only: download creates Blob URL.

## Types / Schemas

```ts
export interface LogSession {
  id: string;
  model?: string;
  backend?: string;
  status: string;
  created_at: string;
  started_at?: string;
}

export interface LogStreamEvent {
  data?: {
    session_id?: string;
    line?: string;
  };
}
```

## Implementation Steps

1. Build session and log fixtures with INFO/WARN/ERROR lines.
2. Implement hook state for selection, filters, loading, auto-scroll, and auto-refresh simulation.
3. Render desktop split and mobile drawer.
4. Add download/delete actions with fixture behavior.
5. Add server console mode with status facts and logs/docs tabs.
6. Document SSE event shape and cap rendered lines.

## Copy / Modify Map

- Copy interaction flow from `use-logs.tsx`.
- Copy layout split from `logs-view.tsx` and `logs-sessions-sidebar.tsx`.
- Copy server grouping from `server-view.tsx`.
- Modify EventSource to fixture timer in templates.

## Acceptance Criteria

- First session auto-selects.
- Session filter and content filter work independently.
- Auto-refresh appends lines and auto-scroll follows when enabled.
- Delete is disabled for `controller`.
- `/server` mode shows connection/runtime/process facts and logs/docs tabs.

## Anti-Overengineering Notes

Do not add log indexing, virtualization, query languages, or observability backends. The reference is a simple session log browser.
