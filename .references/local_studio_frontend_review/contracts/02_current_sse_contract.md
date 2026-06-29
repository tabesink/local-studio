# 02 — Current SSE Event Contract

## Why SSE

One chat request. One server -> browser stream. No bidirectional live control after request body.

```text
Use fetch POST + ReadableStream.
Do not use EventSource. EventSource cannot send POST body.
Do not use WebSocket.
```

## Request

```http
POST /api/v1/domains/{domain_id}/chat/turns
Content-Type: application/json
Accept: text/event-stream
Cookie: context_engine_session=...
```

```json
{
  "question": "What are main safety requirements?",
  "mode": "hybrid",
  "top_k": 12
}
```

## Event envelope

```text
event: turn.delta
data: {"type":"turn.delta","turn_id":"turn_123","sequence":4,"text":"..."}
```

## Current events

| Event | Required data | UI action | Terminal |
|---|---|---|---:|
| `turn.started` | turn ID, time | Add assistant placeholder. | No |
| `turn.status` | `retrieving`/`synthesizing`, message | Update compact state row. | No |
| `turn.evidence` | evidence refs | Populate citation map/inspector. | No |
| `turn.delta` | sequence, text | Append answer text in order. | No |
| `turn.completed` | citations, duration | Mark done. | Yes |
| `turn.failed` | code, message, retryable | Render compact error. | Yes |

## Event models

```ts
type EvidenceReference = {
  citation_id: string;
  document_id: string;
  chunk_id: string;
  title: string;
  source_path: string;
  page_number?: number;
  score?: number;
  snippet?: string;
};

type ChatTurnEvent =
  | { type: "turn.started"; turn_id: string; occurred_at: string }
  | { type: "turn.status"; turn_id: string; stage: "retrieving" | "synthesizing"; message?: string }
  | { type: "turn.evidence"; turn_id: string; evidence: EvidenceReference[] }
  | { type: "turn.delta"; turn_id: string; sequence: number; text: string }
  | { type: "turn.completed"; turn_id: string; citations: EvidenceReference[]; duration_ms: number }
  | { type: "turn.failed"; turn_id?: string; code: string; message: string; retryable: boolean };
```

## Parser rule

```text
One parser: `client/src/lib/stream/parse-sse.ts`.
Unknown event -> structured debug log -> ignore UI.
Malformed frame -> fail current turn safely.
Duplicate sequence -> ignore duplicate.
Out-of-order sequence -> buffer or fail explicitly; choose one rule and test it.
```

## Stop

```text
UI owns AbortController.
Click Stop -> controller.abort().
FastAPI observes disconnect.
No cancel endpoint now.
```

Add server cancel route only after measurement proves upstream provider continues expensive work after disconnect.

## Future events

Do not emit now:

```text
agent.status
tool.started
tool.delta
tool.completed
terminal.output
artifact.created
session.saved
```

Future agent project adds those with separate model, authorization, tests, and UI. Current parser remains safe because unknown types do not break it.
