---
id: EVT-001
title: Context Engine SSE v1
status: approved
owner: Context Engine chat team
last_reviewed: 2026-06-30
depends_on: [CON-000, API-001]
supersedes: []
---

# Context Engine SSE v1

## Events

Context Engine emits product events, not provider-native events:

```text
event: evidence
event: token
event: done
event: error
```

## Ordering Rules

- `evidence` is emitted before any `token`.
- `token` text is answer text only; it is never evidence.
- Exactly one terminal event is emitted: `done` or `error`.
- Citations in `done` must reference current-turn evidence IDs only.
- Client cancel aborts the upstream stream and the server settles the running turn safely.

## Safety Rules

SSE payloads must not include raw prompt, raw evidence source text beyond approved excerpts, raw provider payload, raw LightRAG hit, secret, path, runtime URL, stack trace, or private source/block IDs unless a later approved source-ref contract allows it.

## Fixture Requirement

Before P9 streaming UI is implemented, capture raw SSE transcripts for: success with evidence/tokens/done, no grounded context, provider failure after evidence, validation error, auth failure, duplicate request, and client cancel.
