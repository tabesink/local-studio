---
id: F-004
title: Grounded Streamed Chat Turn
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---
# Grounded Streamed Chat Turn

## User outcome

A domain-scoped answer streams from FastAPI into the workspace with reliable cancellation and typed terminal states.

## In scope

- Implement one SSE parser and one chat-turn reducer.
- Submit request with idempotency key.
- Render user message, partial assistant response, stop, retry/new conversation entry points.
- Handle evidence-ready, delta, completed, failed events.

## Explicitly out of scope

- No direct model client, provider selection, tools, MCP, continuation-after-tool, or local prompt generation.
- No server-sent raw provider payload.

## Routes affected

- `/chat` only.

## API contracts consumed

- `API-CHAT-001` SSE contract.

## Data models

- `TurnViewState`, `StreamEvent`, `ApiError`.

## Authorization behaviour

FastAPI validates session/domain/reference permissions before creating a turn and during stream continuation.

## UI states

- Loading: submitting.
- Empty: no messages.
- Error: start failure or `turn.failed`.
- Unauthenticated: safe session expiry flow.
- Forbidden: rejected domain/reference.
- Success: completed answer and citations received.
- Cancelled: user stop disconnects; server settles safe terminal status.

## Original source references

- `src/components/chat-view/useChatStreamManager.ts` for AbortController/pending UX only.
- `src/components/chat-view/Chat.tsx` for message sequencing reference.
- `src/utils/chat/responseGenerator.ts` is non-portable runtime code.

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
