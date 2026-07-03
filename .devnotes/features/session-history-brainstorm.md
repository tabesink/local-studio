## Executive verdict

**Use Local Studio as a session-history UX reference, not as the Context Engine persistence foundation.**

Its strongest reusable ideas are:

* searchable session command palette;
* session dashboard with filters, running/idle status, sorting, refresh,([GitHub][1])onversation;
* separation of live/runtime sessions from stored history;
* archive/restore UX instead of default deletion.

Its session implementation is local-workstation oriented: it scans Pi JSONL files, archives through a local JSON metadata file, stores active session snapshots in browser `localStorage`, and accepts a caller-provided absolute `cwd` path in session APIs. That must be replaced for a multi-user web application. ([GitHub][2])the complete junior-developer review](sandbox:/mnt/data/local-studio-session-history-context-engine-review.md)

## What to copy

| Local Studio script                                                              | Decision             | Context Engine adaptation                                                                                                                                                |
| -------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `frontend/src/features/agent/ui/sessions-command.tsx`                            | Copy and modify      | Rebuild as `features/sessions/session-command.tsx` using shadcn `Command` + `Dialog`. Retain search, keyboard navigation, active-session section, and direct navigation. |
| `frontend/src/features/agent/ui/sessions-page.tsx`                               | Copy and modify      | Use as the basis for a session-history page or sidebar: search, filters, session rows, archive toggle, loading/empty states.                                             |
| `frontend/src/features/agent/ui/agent-workspace-navigation.ts`                   | Rewrite conceptually | Keep URL-driven session selection, but use `/workspace/[sessionId]` rather than `?project=&session=` plus local pane replay.                                             |
| `frontend/src/features/agent/session-contracts.ts`                               | Copy concepts only   | Replace Pi/project fields with `domainId`, `sessionId`, `archivedAt`, `lastMessageAt`, `activeTurn`, and ownership/visibility fields.                                    |
| `frontend/src/features/agent/active-sessions.ts`                                 | Reference only       | Reuse the “unseen activity” concept for background streams; do not use its local browser merge as application persistence.                                               |
| `frontend/src/app/agent/page.tsx` and `frontend/src/app/agent/sessions/page.tsx` | Copy pattern         | Keep routes thin and render feature modules from the route shell.                                                                                                        |

Local Studio’s command palette loads recent sessions, mixes in currently active sessions, supports arrows/Enter/Escape, then routes a selected record to `/agent?project=<id>&session=<id>`. Its dashboard loads recent sessions, filters by project/status/query, and links each row to that same route. ([GitHub][3])t to copy

| Local Studio script                        | Why not                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `features/agent/sessions-store.ts`         | It scans local Pi JSONL files and replays raw events. Context Engine needs database-backed sessions and paginated messages.   |
| `features/agent/session-metadata-store.ts` | Archive state is stored in a local JSON file with a file lock; this is not multi-user durable state.                          |
| `features/agent/workspace/store.ts`        | It uses browser `localStorage` to persist active sessions and pane state. Use local storage only for harmless UI preferences. |
| `app/api/agent/sessions/route.ts`          | It accepts a user-provided absolute `cwd` and reads filesystem contents. This is unsafe for a browser-facing multi-user app.  |
| `app/api/agent/sessions/[id]/route.ts`     | It retrieves raw JSONL events and stores archive state locally rather than through authenticated database records.            |

The session list endpoint accepts `cwd`, validates that it is an absolute directory, then scans that location. The detail route also requires a path to load session events. This is a local-machine API contract, not a user/domain authorization contract. ([GitHub][1])end Local Studio flow

```text
User opens Sessions page or command palette
        |
        v
UI fetches recent local Pi session summaries
        |
        v
Next.js session API scans Pi JSONL files
        |
        v
Session list renders title, project, model, updated time, active status
        |
        v
User selects a session
        |
        v
/agent?project=<projectId>&session=<sessionId>
        |
        v
Workspace navigation effect selects project and opens/replays a tab
        |
        v
Chat workspace renders the session
```

Local Studio uses `project` and `session` URL parameters, then attempts to recover a persisted active tab from browser storage before dispatching workspace navigation. ([GitHub][4])nded Context Engine flow

```text
User opens /workspace/<sessionId>
        |
        v
Next.js route resolves current authenticated user
        |
        v
API verifies:
  organization
  knowledge-domain membership
  session owner or explicit share permission
        |
        v
Server returns session summary + latest message page
        |
        v
Chat UI renders thread
        |
        v
User sends message with clientMessageId
        |
        v
Server transaction:
  persist user message
  create assistant placeholder
  update session timestamp
        |
        v
RAG + LLM stream response
        |
        v
Client applies only matching:
  sessionId + assistantMessageId + sequence
        |
        v
Assistant message finalizes
Session list cache revalidates
```

## Recommended Context Engine structure

```text
src/
  app/
    workspace/
      page.tsx
      [sessionId]/
        page.tsx

  features/
    sessions/
      api.ts
      query-keys.ts
      session-list.tsx
      session-command.tsx
      session-actions-menu.tsx
      use-session-route.ts

    chat/
      api.ts
      chat-workspace.tsx
      message-list.tsx
      composer.tsx
      use-session-messages.ts
      use-send-message.ts
      use-turn-stream.ts
      stream-reducer.ts

  components/
    ui/
    app-shell.tsx
    error-state.tsx
    empty-state.tsx

  lib/
    api/client.ts
    auth/current-user.ts
    query-client.ts

  types/
    chat.ts
```

Use:

* **TanStack Query** for session lists, message pages, mutations, invalidation, focus revalidation, and cursor pagination.
* **Small local state or Zustand** only for sidebar width, command palette open state, filters, and UI preferences.
* **Postgres** as the session/message source of truth.
* **SSE** only for the currently streaming assistant answer, not a global websocket system.

## Minimum data contract

```ts
export interface ChatSession {
  id: string;
  domainId: string;
  title: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  archivedAt: string | null;
  messageCount: number;
  activeTurn: "idle" | "streaming" | "failed" | null;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  status: "complete" | "streaming" | "failed" | "cancelled";
  clientMessageId: string | null;
  createdAt: string;
  completedAt: string | null;
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
  }>;
  citations: Array<{
    sourceDocumentId: string;
    chunkId: string;
    label: string;
  }>;
}
```

```text
POST   /api/chat-sessions
GET    /api/chat-sessions?domainId=<id>&cursor=<cursor>&limit=40

GET    /api/chat-sessions/:sessionId
PATCH  /api/chat-sessions/:sessionId
DELETE /api/chat-sessions/:sessionId   # archive by default

GET    /api/chat-sessions/:sessionId/messages?before=<cursor>&limit=50
POST   /api/chat-sessions/:sessionId/messages
```

## Production gaps to fix

1. **Authorization:** Local Studio’s session routes do not apply the `requireApiAccess` guard visible on the agent-turn route, and that guard itself is a shared token check rather than user/tenant authorization. Context Engine must authenticate the user and authorize organization, domain, and ownership on every session query. ([GitHub][1]) UX:** The sessions page catches fetch errors and turns them into an empty session array, so an outage can look like “no sessions.” Build separate loading, request-error, empty-history, and no-filter-match states. ([GitHub][5])ation:** Local Studio fetches a fixed 30- or 90-day aggregate and filters it in the browser. Context Engine should use cursor pagination and server-side domain/permission filtering. ([GitHub][3])stence:** Local Studio stores transcript history in Pi JSONL and archive metadata in `agent-session-metadata.json`. Context Engine needs normalized `chat_sessions` and `chat_messages` tables. ([GitHub][2])-tab behavior:** Local Studio merges browser-local active-session snapshots across windows. Keep the UX idea, but use server turn state plus revalidation; do not depend on browser storage as the session authority. ([GitHub][6])developer build order

2. Create session/message schema with `domain_id`, `owner_user_id`, archive state, message sequence, and a unique `client_message_id`.

3. Implement authorized session list/create endpoints with cursor pagination.

4. Build session sidebar/list from the Local Studio dashboard pattern.

5. Add `/workspace/[sessionId]` and server-authorized route loading.

6. Add searchable session command palette.

7. Add latest-message loading plus “load older messages.”

8. Add idempotent send plus assistant streaming.

9. Add persisted rename, archive, restore, and audit events.

10. Test user isolation, refresh restoration, double-send prevention, stale-stream rejection, and multi-tab generation handling.

The Local Studio UI is a worthwhile reference because its session navigation is clear and junior-developer-friendly. The correct Context Engine implementation is to preserve that UX while replacing its local-first session subsystem with authenticated, domain-scoped, database-backed chat records.

## Implementation plans

Terse build docs for junior devs and coding agents: [sesson_history_recs/README.md](./sesson_history_recs/README.md)

[1]: https://github.com/sybil-solutions/local-studio/raw/refs/heads/main/frontend/src/app/api/agent/sessions/route.ts "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/sessions-store.ts "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/sessions-command.tsx "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/agent-workspace-navigation.ts "raw.githubusercontent.com"
[5]: https://github.com/sybil-solutions/local-studio/blob/main/frontend/src/features/agent/ui/sessions-page.tsx "local-studio/frontend/src/features/agent/ui/sessions-page.tsx at main · sybil-solutions/local-studio · GitHub"
[6]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/active-sessions.ts "raw.githubusercontent.com"
