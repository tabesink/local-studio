# Reference Scripts — Session History UX

Read-only starting points copied from reference repos. **Do not import these paths directly in CE code.** Adapt into `client/src/features/conversations/` per doc 02.

---

## Local Studio (`local-studio/`)

| File | Copy for | CE adaptation |
| --- | --- | --- |
| `session-contracts.ts` | Shared list row types, sort fields, active index helper | Replace `projectId`/`piSessionId` with `ConversationSummary`; drop `cwd`/`filename` |
| `sessions-command.tsx` | Command palette UX: search, keyboard nav, relative time, active section | Remove `APP_DESTINATIONS`; API → `GET /api/v1/conversations`; route → `/chat/{id}` |
| `sessions-page.tsx` | Dashboard table: filters, sort, refresh, status badges | Remove project filter column; fix error vs empty states; server cursor pagination |

**Source paths (read-only):**

```text
.references/code/local-studio/frontend/src/features/agent/session-contracts.ts
.references/code/local-studio/frontend/src/features/agent/ui/sessions-command.tsx
.references/code/local-studio/frontend/src/features/agent/ui/sessions-page.tsx
```

**Do not copy:** `sessions-store.ts`, `session-metadata-store.ts`, `workspace/store.ts`, `app/api/agent/sessions/*`

---

## localGPT (`localGPT/`)

| File | Copy for | CE adaptation |
| --- | --- | --- |
| `session-sidebar.tsx` | Sidebar list, new/delete/rename, loading/error, scroll area | Types → CE DTOs; `chatAPI.*` → `conversations/api.ts`; cookie auth client |
| `api.ts` | Session CRUD fetch patterns, error handling | Extract only `getSessions`, `createSession`, `getSession`, `deleteSession`, `renameSession` shapes; map to CE routes (`PATCH` not `/rename`) |

**Source paths (read-only):**

```text
.references/code/localGPT/src/components/ui/session-sidebar.tsx
.references/code/localGPT/src/lib/api.ts
```

**Do not copy:** session uploads, index linking, `localhost:8000` base URL, SQLite-backed message POST.

---

## API Shape Delta (localGPT → CE)

| localGPT | Context Engine |
| --- | --- |
| `GET /sessions` | `GET /api/v1/conversations?cursor&limit` |
| `POST /sessions` | `POST /api/v1/conversations` |
| `GET /sessions/{id}` + messages array | `GET /api/v1/conversations/{id}` with `turns[]` |
| `POST /sessions/{id}/messages` | `POST /api/v1/conversations/{id}/turns:stream` (SSE) |
| `POST /sessions/{id}/rename` | `PATCH /api/v1/conversations/{id}` |
| `DELETE /sessions/{id}` | `DELETE /api/v1/conversations/{id}` |
| No auth | HttpOnly session cookie |

---

## Helpers to Extract (both references)

Copy into `features/conversations/format-relative.ts`:

```ts
// From LS sessions-command.tsx / sessions-page.tsx
function formatRelative(iso: string): string { ... }
function isRunning(activeTurnStatus: string): boolean { ... }
```

---

## Parity Targets

See `DESIGN.md` + `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`:

- Icon rail stays w-14 (not LS wide agent sidebar)
- Conversation list lives **inside chat shell** or slide-over — match old CE `LightRagChatShell` layout when ported
- Command palette is global overlay from app shell (slice 03)
