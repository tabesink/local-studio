---
id: F-006
title: Server-Owned Conversation History
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004, F-005]
supersedes: []
---
# Server-Owned Conversation History

## User outcome

Users can create, resume, rename, and delete their own conversation history without expanding retrieval across domains.

## In scope

- Implement conversation list/detail client integration.
- Persist turns server-side through approved data contract.
- Allow per-turn domain selection while preserving the current-turn retrieval rule.
- Support owner-only rename/delete.

## Explicitly out of scope

- No shared chat memory, semantic retrieval over chats, admin chat browsing, cross-user sharing, or browser-local authoritative history.

## Routes affected

- `/chat`, optional `/chat/{conversationId}`.

## API contracts consumed

- `API-CONV-001`, `API-CHAT-001`, `DATA-CONV-001`.

## Data models

- `ConversationSummary`, `ConversationDetail`, `ConversationTurn`.

## Authorization behaviour

Backend filters by owner. Admin controls do not override conversation ownership without an explicit future decision.

## UI states

- Loading: conversation list/detail.
- Empty: no history.
- Error: list/load/update/delete failure.
- Unauthenticated: redirect.
- Forbidden: 403/404 safe handling.
- Success: history and ordered turns.
- Conflict: `conversation_busy` on parallel send.

## Original source references

- `src/components/chat-view/ChatListDropdown.tsx`
- `src/hooks/useChatHistory.ts`
- `src/database/json/chat/`
- `src/components/chat-view/Chat.tsx`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
