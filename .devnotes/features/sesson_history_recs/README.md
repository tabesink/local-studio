# User Session History — Implementation Plans

**Audience:** junior devs, coding agents  
**Authority:** advisory — active specs/contracts win (`specs/03-contracts/`, F-007, F-009)  
**Product term:** **Conversation** (not session/thread in code or API)

**One-liner:** Port Local Studio session-list UX and localGPT sidebar wiring patterns onto CE's owner-scoped Postgres **Conversations + Turns**, with a **500 MiB per-user storage cap** and no filesystem/localStorage authority.

---

## Read Order

1. `AGENTS.md`, `CONTEXT.md`, `DESIGN.md`
2. `.devnotes/features/session-history-brainstorm.md` (UX verdict)
3. `specs/03-contracts/data/context-engine-data.md` (P7 tables)
4. `specs/03-contracts/api/context-engine-v1.md` (P7 routes)
5. `specs/04-features/F-007-grounded-streaming-chat/plan.md`
6. `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md` (slices 11–12)
7. `.devnotes/P6-post-impl-REVIEW/F-007-P7-reconciled-design-gates.md`
8. This folder — in numeric order
9. `reference-scripts/README.md` before touching UI

---

## Plan Index

| Doc | Scope |
| --- | --- |
| [00-boundaries-architecture-storage.md](./00-boundaries-architecture-storage.md) | End-to-end boundaries, API, DB, storage, auth, what NOT to copy |
| [01-backend-schema-quota-api.md](./01-backend-schema-quota-api.md) | Migrations, quota math, CRUD/list/rename, service layer |
| [02-frontend-session-history-ui.md](./02-frontend-session-history-ui.md) | Sidebar, command palette, list page, Local Studio parity |
| [03-wiring-chat-resume-and-stream.md](./03-wiring-chat-resume-and-stream.md) | Route `/chat/[conversationId]`, resume thread, SSE + cache invalidation |
| [reference-scripts/](./reference-scripts/) | Copied LS + localGPT scripts (read-only starting points) |

---

## Build Order (vertical slices)

```text
B0  Patch contracts (list cursor, list summary fields, PATCH title, quota error code)
B1  Migrations + models + owner filters + storage counter
B2  Conversation CRUD + list (cursor) + quota enforcement hooks
B3  Turn stream persists → updates conversation.updated_at + storage counter
B4  Frontend: conversation API module + query keys
B5  Frontend: sidebar list + new conversation + delete/rename
B6  Frontend: `/chat/[conversationId]` loads GET detail → renders turn thread
B7  Frontend: command palette (⌘K) + optional `/chat/history` dashboard
B8  Tests: owner isolation, quota reject, reload resume, stale-stream guard
```

**Gate:** B2–B3 depend on F-007 turn stream existing or being built in parallel. UI slices B4–B7 can mock against OpenAPI fixtures until P7 backend lands.

---

## Contract Patches Required Before Code

These are **not** in approved API-001 today; patch `specs/03-contracts/api/context-engine-v1.md` first:

- `GET /conversations?cursor=&limit=` — cursor pagination + list summary fields
- `PATCH /conversations/{id}` — safe title rename (owner only)
- `413` / `conversation_storage_limit_reached` — per-user 500 MiB cap
- List/detail summary fields: `turnCount`, `lastTurnAt`, `activeTurnStatus`

Archive/restore is **deferred** (brainstorm UX only). v1 uses hard `DELETE` per API-001.

---

## Open Decisions

| Item | Recommendation | Needs |
| --- | --- | --- |
| 500 MiB scope | Count UTF-8 bytes of `user_message` + `assistant_answer` + evidence `excerpt` per owner | Product sign-off |
| Over-quota behavior | Reject new turn content; allow read/delete | API-001 patch |
| Auto-evict oldest conversations | Defer | Product |
| LLM-generated titles | Defer; use first user message truncation in UI | F-007 gate A6 |
| Admin read other users' history | Out of scope P7 | — |
