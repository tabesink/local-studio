# 02 — Frontend: Session History UI (Local Studio Parity)

**Target (when F-009 client exists):** `client/src/features/conversations/`, routes under `client/src/app/chat/`

**Style:** `DESIGN.md` tokens + Local Studio density. **Structure:** port reference scripts in `reference-scripts/`.

**Prerequisite:** Slice 01–03 app shell + slice 11 chat shell scaffold.

---

## Module Layout

```text
features/conversations/
  api.ts                 # GET/POST/PATCH/DELETE wrappers
  query-keys.ts          # ['conversations', 'list', cursor], ['conversations', id]
  types.ts               # ConversationSummary, ConversationDetail (from OpenAPI)
  conversation-list.tsx  # sidebar rows — port localGPT session-sidebar
  conversation-command.tsx # ⌘K palette — port LS sessions-command
  conversation-actions.tsx # rename/delete menu
  use-conversation-route.ts # sync URL ↔ selected id
  format-relative.ts     # shared relative time (from LS)

app/chat/
  page.tsx               # new chat / redirect last or empty state
  [conversationId]/page.tsx
  history/page.tsx       # optional full dashboard — port LS sessions-page
```

---

## Reference → CE Mapping

| Reference | CE target | Adapt |
| --- | --- | --- |
| `localGPT/session-sidebar.tsx` | `conversation-list.tsx` | `ChatSession` → `ConversationSummary`; API base `/api/v1/conversations`; cookie auth |
| `local-studio/sessions-command.tsx` | `conversation-command.tsx` | Remove app destinations; route `/chat/{id}`; fetch CE list API |
| `local-studio/sessions-page.tsx` | `app/chat/history/page.tsx` | Remove project filter; add domain-agnostic history; separate error vs empty states |
| `local-studio/session-contracts.ts` | `types.ts` | Replace Pi fields with CE summary fields |

---

## ConversationSummary (frontend type)

```ts
export type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  turnCount: number;
  lastTurnAt: string | null;
  activeTurnStatus: "idle" | "running" | "failed";
};
```

Display title fallback when `title` is null:

```text
truncate(first user_message of latest turn, 60 chars) || "New conversation"
```

Client-side only — no extra API call if list includes `turnCount`; optional `preview` field if added to contract later.

---

## UI States (fix LS anti-pattern)

LS sessions-page swallows errors → empty list. CE **must** distinguish:

| State | UI |
| --- | --- |
| Loading | skeleton rows |
| Request error | retry banner (not empty list) |
| Empty history | CTA "Start a conversation" |
| No filter match | "No matches" (search local only) |
| Quota exceeded on send | toast from 413; link to manage history |

---

## Sidebar (localGPT pattern)

Port from `reference-scripts/localGPT/session-sidebar.tsx`:

- [ ] Load list on mount via TanStack Query
- [ ] Highlight `currentConversationId`
- [ ] "New conversation" → `POST /conversations` → navigate
- [ ] Row menu: Rename (PATCH), Delete (confirm → DELETE)
- [ ] Expose `refresh()` via query invalidation (not imperative ref hack)
- [ ] Restyle: DESIGN.md sidebar tokens; keep compact row height

**Do not port:** session-scoped index linking, file upload, model picker.

---

## Command palette (Local Studio pattern)

Port from `reference-scripts/local-studio/sessions-command.tsx`:

- [ ] shadcn `Command` + `Dialog`
- [ ] Fetch recent conversations on open (`limit=60`)
- [ ] Keyboard: ↑↓ navigate, Enter select, Esc close
- [ ] Optional section: "Active" if `activeTurnStatus === 'running'`
- [ ] Select → `router.push(/chat/${id})`
- [ ] Register shortcut in app shell (slice 03)

Remove LS `APP_DESTINATIONS` block unless product adds CE-wide command palette later.

---

## History dashboard (optional v1.1)

Port `sessions-page.tsx` table layout to `/chat/history`:

- Search (client filter on title + first message preview)
- Sort: `updatedAt` \| `turnCount` (client sort on fetched page; server sort if contract adds)
- Status filter: all \| running \| idle
- Refresh button → query refetch
- Row click → `/chat/{id}`

No project/domain column — domain is per-turn, show in thread not list.

---

## Visual Parity Checklist (DESIGN.md)

- [ ] Dark + light at 1440×900, 1280×800, narrow viewport
- [ ] Geist Sans 12px dense rows
- [ ] Relative timestamps (`formatRelative`)
- [ ] Running badge: subtle pulse dot (LS pattern)
- [ ] No white dashboard chrome; use `--color-sidebar`, `--color-surface`

---

## TanStack Query Patterns

```ts
// list
useInfiniteQuery({
  queryKey: conversationKeys.list(),
  queryFn: ({ pageParam }) => fetchConversations({ cursor: pageParam }),
  getNextPageParam: (last) => last.nextCursor ?? undefined,
});

// invalidate after turn done
queryClient.invalidateQueries({ queryKey: conversationKeys.list() });
queryClient.invalidateQueries({ queryKey: conversationKeys.detail(conversationId) });
```

---

## Do Not

- Store conversation list in Zustand as source of truth
- Persist transcript in localStorage
- Call LightRAG or domain runtime URLs
- Use LS `/api/agent/sessions` paths
- Copy localGPT `localhost:8000` hardcoded API

---

## Tests

```text
Vitest: formatRelative, title fallback helper
Playwright:
  - create conversation → appears in sidebar
  - rename → list updates
  - delete → navigates away if current
  - command palette keyboard select
  - error state when API 500 (mock)
```
