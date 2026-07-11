# Chat Sessions

Status: implementation handoff draft.

## Purpose

Conversation list for owned chat history. This is a compact list surface, not a Local Studio project tree.

In the proposed `/chat` shell this is the left-most panel with `Chats` and future `Wiki` tabs.

This panel is not the global app nav. Chat, Library/Documents, Graph, and Settings stay in the main shell rail.

## Specs

- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
- `specs/04-features/F-007-grounded-streaming-chat/ux.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md` slice 11
- `specs/03-contracts/api/context-engine-v1.md`

## Reference Pack Notes

Folded from `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-grounded-streaming-chat.md` and `F-009-frontend-slices.md`.

```text
slice 11 -> conversation shell and list
slice 12 -> persisted turns plus SSE replay/terminal states
```

Also compare `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md` chat history anchors for list/history interaction ideas only. Context Engine owns conversation persistence, redaction, and access control.

## Frontend Module

`src/features/chat/`

## ASCII Mockup

```text
left library panel (inside /chat or narrow drawer)
+-----------------------------------+
| Context Engine                    |
| [ Chats ] [ Wiki ]                |
|-----------------------------------|
| + New chat                        |
| [search conversations..........]  |
|-----------------------------------|
| > Manual startup                  |
|   2026-07-02 12:05     domain_rag |
|                                   |
|   Untitled conversation           |
|   2026-07-02 11:18     direct_llm |
|                                   |
|   Safety procedure draft          |
|   2026-07-01 16:44     redacted   |
|-----------------------------------|
| loading: skeleton rows keep height |
+-----------------------------------+

row states:
  selected -> --ui-selected, rounded-md
  hover    -> --ui-hover
  failed   -> StatusDot danger + safe label
  redacted -> muted row, no evidence excerpt
```

## Wiring

| UI event | API |
| --- | --- |
| Load list | `GET /api/v1/conversations` |
| Create | `POST /api/v1/conversations` with optional `{ title }` |
| Select | `GET /api/v1/conversations/{conversation_id}` |
| Rename | `PATCH /api/v1/conversations/{conversation_id}` when contracted in UI slice |
| Delete/archive | `DELETE /api/v1/conversations/{conversation_id}` if hard delete is chosen by slice |

Conversation rows are owner-scoped. Another user's conversation is `404`, not an ownership reveal.

## Data Shape

```text
ConversationSummary:
  id
  title | null
  createdAt
  updatedAt

Local fallback title:
  null/blank -> "Untitled conversation"
```

## Parity Rules

- Use `ListGroup` / `ListRow`, 24/28px row rhythm where possible.
- Keep `Chats` / `Wiki` as compact tabs in the left panel; no separate route switch for chat-library navigation.
- Do not include main app nav items in this panel.
- Title in Geist Sans; timestamp/id metadata in Geist Mono.
- Keep search compact. No giant empty-state card.
- On mobile, list can be drawer or route-level stacked panel.

## Do Not Wire

- No team/global conversation browser.
- No prompt/answer text in list metadata.
- No semantic search of old turns in P9.
- No localStorage conversation authority.
- No wiki create/edit/publish from the left `Wiki` tab; it is browse/navigation only until F-011.
