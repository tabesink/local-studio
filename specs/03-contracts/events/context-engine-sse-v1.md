---
id: EVT-001
title: Context Engine SSE v1
status: approved
owner: Context Engine chat team
last_reviewed: 2026-07-06
depends_on: [CON-000, API-001]
supersedes: []
---

# Context Engine SSE v1

## Events

Context Engine emits product events, not provider-native events:

```text
event: stage
event: evidence
event: token
event: done
event: error
```

## Ordering Rules

- `stage` may be emitted before, between, or after other non-terminal events. It must contain only a closed safe stage label.
- For `domain_rag`, `evidence` is emitted before any grounded answer `token`.
- For `direct_llm`, no `evidence` event is emitted.
- `token` text is answer text only; it is never evidence.
- Exactly one terminal event is emitted: `done` or `error`.
- Citations in `done` must reference current-turn evidence IDs only. Direct LLM `done` events have an empty citation list.
- Client cancel aborts the upstream stream and the server settles the running turn safely.

## Payload Rules

`stage` payload:

```json
{ "turnId": "turn_01", "stage": "classifying" }
```

Allowed stage values are `classifying`, `planning`, `retrieving`, `verifying`, `answering`, and `direct_answering`.

`evidence` payload:

```json
{
  "turnId": "turn_01",
  "evidence": [
    {
      "id": "evref_01",
      "citationLabel": "[1]",
      "sourceLabel": "manual.md",
      "excerpt": "Bounded evidence excerpt."
    }
  ]
}
```

`id` is the turn-scoped public evidence reference id, not a Source Document or Source Block id. `citationLabel` is stable for the turn and is the only label that `done.citations` may reference.

`token` payload:

```json
{ "turnId": "turn_01", "text": "answer text" }
```

`done` payload:

```json
{
  "turnId": "turn_01",
  "route": "domain_rag",
  "status": "completed",
  "stopReason": "grounded",
  "citations": [
    { "evidenceRefId": "evref_01", "citationLabel": "[1]" }
  ],
  "acceptedRefs": [
    {
      "id": "turnref_01",
      "kind": "source",
      "order": 1,
      "label": "manual.md",
      "description": "Source"
    }
  ],
  "budget": {
    "planStepCount": 1,
    "retrievalOperationCount": 1,
    "repairAttemptCount": 0
  },
  "replay": false
}
```

`done.route` is `direct_llm` or `domain_rag`. `done.status` is `completed` or `redacted`. `done.stopReason` is one of `direct_llm`, `grounded`, `no_grounded_context`, `evidence_only`, `turn_budget_exhausted`, or `redacted`. Direct LLM `done` events have an empty `citations` array. F-012 `done.acceptedRefs` contains safe accepted composer-ref metadata only and is emitted only on terminal `done` and idempotent terminal replay, not in `stage`, `evidence`, or `token` events.

`error` payload:

```json
{
  "turnId": "turn_01",
  "code": "provider_failure",
  "message": "The answer could not be completed.",
  "replay": false
}
```

`error` is terminal and maps to `conversation_turns.status = failed` unless the request failed before a turn row was created. Validation, authentication, authorization, duplicate-running-turn, and other pre-stream failures return the canonical JSON API error envelope instead of SSE.

## Terminal Outcome Rules

| Outcome | Events | Data result |
| --- | --- | --- |
| Direct LLM success | `stage` -> `token`* -> `done` | `route=direct_llm`, `status=completed`, `stopReason=direct_llm`, no Evidence/citations |
| Grounded domain answer | `stage`* -> `evidence` -> `token`* -> `done` | `route=domain_rag`, `status=completed`, `stopReason=grounded` |
| No grounded context | `stage`* -> optional empty `evidence` -> `done` | `status=completed`, `stopReason=no_grounded_context`, no answer tokens |
| Provider failure after Evidence | `stage`* -> `evidence` -> `done` | `status=completed`, `stopReason=evidence_only`, no answer tokens after failure |
| Provider failure before Evidence or direct LLM failure | `stage`* -> `error` | `status=failed`, safe error code/message |
| Client disconnect/cancel | stream closes, no further client event required | persisted `status=failed`, `stopReason=cancelled`, `safeErrorCode=turn_cancelled` |
| Idempotent completed replay | persisted safe events -> `done` | `replay=true`, no provider/retrieval call |
| Idempotent failed replay | persisted safe terminal `error` | `replay=true`, no provider/retrieval call |

`token`* and `stage`* mean zero or more events. `domain_rag` must emit all non-empty Evidence before any grounded answer token. `no_grounded_context` and `evidence_only` do not emit answer tokens in P7.

## Safety Rules

SSE payloads must not include raw prompt, template body, raw source/wiki text, raw evidence source text beyond approved excerpts, raw provider payload, raw LightRAG hit, secret, path, runtime URL, stack trace, private source/block IDs, private template/wiki ids, planning text, or chain-of-thought. F-012 accepted-ref projection is limited to turn-scoped accepted-ref id, kind, order, safe label, and optional safe description.

P8 request/log/trace context must not change SSE event names, ordering, or payload shape. `trace_id` is private operational metadata and is never emitted in SSE payloads in P8.

## Fixture Requirement

Before P9 streaming UI is implemented, capture raw SSE transcripts for: direct LLM success, domain RAG success with stage/evidence/tokens/done, no grounded context, provider failure after evidence, validation error, auth failure, duplicate request, and client cancel.
