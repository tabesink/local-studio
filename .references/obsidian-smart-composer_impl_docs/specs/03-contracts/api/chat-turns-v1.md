---
id: API-CHAT-001
title: Grounded chat turns v1
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Grounded chat turns v1

## Purpose

Create and stream one domain-scoped grounded answer. This replaces Smart Composer’s direct provider/client `ResponseGenerator` path.

## Proposed endpoint

```http
POST /api/v1/domains/{domainId}/chat/turns
Content-Type: application/json
Accept: text/event-stream
Idempotency-Key: <UUID>
```

```ts
type CreateChatTurnRequest = {
  conversationId?: string
  question: string
  contextReferences?: Array<{ kind: 'source' | 'evidence'; id: string }>
}
```

### Validation

- `question` is non-empty after trim and subject to server length limits.
- caller can access `domainId`.
- context references belong to that domain and caller can read them.
- idempotency key is unique for the same authenticated user and request intent.
- a conversation cannot have more than one `running` turn.

## Proposed SSE event sequence

```text
event: turn.started
{ turnId, conversationId, domainId, requestId }

event: evidence.ready
{ turnId, evidence: EvidenceItem[] }

event: answer.delta
{ turnId, delta }

event: turn.completed
{ turnId, answer, metadata, citations: Citation[] }
```

Failure:

```text
event: turn.failed
{ turnId?, code, message, requestId }
```

The client must tolerate `turn.failed` after `turn.started`, and must never fabricate completion or citations.

## Source references

- UX stream/cancellation reference: `src/components/chat-view/useChatStreamManager.ts`
- source orchestration reference: `src/components/chat-view/Chat.tsx`
- source response runtime: `src/utils/chat/responseGenerator.ts` — **do not port execution ownership**.
