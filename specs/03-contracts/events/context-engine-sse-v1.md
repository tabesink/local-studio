---
id: EVT-001
title: Context Engine SSE v1
status: approved
owner: Context Engine chat team
last_reviewed: 2026-07-02
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
{ "stage": "classifying" }
```

Allowed stage values are `classifying`, `planning`, `retrieving`, `verifying`, `answering`, and `direct_answering`.

`done` payloads include a safe `route` of `direct_llm` or `domain_rag` and a safe `stopReason` such as `direct_llm`, `grounded`, `no_grounded_context`, `evidence_only`, `turn_budget_exhausted`, `provider_failure`, or `citation_validation_failed`.

## Safety Rules

SSE payloads must not include raw prompt, raw evidence source text beyond approved excerpts, raw provider payload, raw LightRAG hit, secret, path, runtime URL, stack trace, private source/block IDs, planning text, or chain-of-thought unless a later approved source-ref contract allows it.

## Fixture Requirement

Before P9 streaming UI is implemented, capture raw SSE transcripts for: direct LLM success, domain RAG success with stage/evidence/tokens/done, no grounded context, provider failure after evidence, validation error, auth failure, duplicate request, and client cancel.
