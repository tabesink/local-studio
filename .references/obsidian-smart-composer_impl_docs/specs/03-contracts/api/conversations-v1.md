---
id: API-CONV-001
title: Conversations v1
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Conversations v1

## Proposed endpoints

```http
GET    /api/v1/conversations?limit=50&cursor=<opaque>
POST   /api/v1/conversations
GET    /api/v1/conversations/{conversationId}
PATCH  /api/v1/conversations/{conversationId}
DELETE /api/v1/conversations/{conversationId}
```

## Rules

- Every query filters `owner_user_id = current_user.id`.
- Admin status does not imply access to another member’s conversation unless a later explicit policy changes this.
- The server returns summaries for the list and full authorized turns for detail.
- Conversation title is user-editable only by its owner.
- Delete semantics follow the approved data retention policy; client optimistic removal is optional and must roll back on error.

## Source references

- list/select/delete/rename UX: `src/components/chat-view/ChatListDropdown.tsx`
- local persistence hook: `src/hooks/useChatHistory.ts`
- local persistence implementation: `src/database/json/chat/`
