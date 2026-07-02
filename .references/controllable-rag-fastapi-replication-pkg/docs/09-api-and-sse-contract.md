# 09 — API and SSE Contract

## One browser-facing turn endpoint

```http
POST /api/v1/chat/turns:stream
Content-Type: application/json
Accept: text/event-stream
```

```json
{
  "conversation_id": "optional-uuid",
  "domain_id": "manuals",
  "message": "What is the safe operating sequence?"
}
```

**Forbidden request fields:** model, provider, embedding model, system prompt, top_k, reranker, hidden filter, retrieval mode, API key, source path, tool choice.

## Safe SSE events

```text
turn.started
stage.changed           { stage: "planning" | "retrieving" | "verifying" | "answering" }
evidence.ready          { evidence: [safe citation metadata] }
answer.delta            { text: "..." }
answer.completed        { message_id, answer, citations, stop_reason }
turn.failed             { code, safe_message }
```

## Event sequence

```text
client request
  ↓
turn.started
  ↓
stage.changed(planning)
  ↓
stage.changed(retrieving)
  ↓
evidence.ready
  ↓
stage.changed(answering)
  ↓
answer.delta × N
  ↓
answer.completed
```

## Standardized errors

| Code | Client behavior |
|---|---|
| `domain_not_allowed` | Stop. Do not disclose domain existence details. |
| `retrieval_unavailable` | Show safe retry-later message. |
| `insufficient_grounded_evidence` | Render direct insufficiency response, not a fabricated answer. |
| `turn_budget_exhausted` | Persist safe partial trace; show concise unable-to-complete response. |
| `citation_validation_failed` | Do not emit answer as grounded. |

## Why SSE

**PROPOSED:** SSE is sufficient for one server-to-browser stream of stage and answer events. FastAPI supports streamed responses using generators/async generators; the chat endpoint can project orchestration state into `text/event-stream` without a second real-time protocol.
