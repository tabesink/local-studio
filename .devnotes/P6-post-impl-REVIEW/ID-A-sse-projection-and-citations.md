# ID-A - SSE projection and citation identity (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/03-contracts/events/context-engine-sse-v1.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/ai/grounded-answering.md`, `.references/controllable-rag-fastapi-replication-pkg/docs/09-api-and-sse-contract.md`.

**Question:** Can the P7 SSE stream be implemented from the current event catalog alone?

## Decision

No. EVT-001 decides event names and ordering, but P7 still needs exact payload shapes for `evidence`, `done.citations`, and terminal outcomes before implementation.

This is the main P7 public-contract blocker.

## Why

| Missing shape | Risk |
| --- | --- |
| Public Evidence reference id | Citations need to point at current-turn Evidence without exposing Source Block ids. |
| `done.citations` payload | Frontend and tests cannot validate citation identity consistently. |
| `no_grounded_context` terminal | Teams may split between `done` and `error`. |
| `evidence_only` terminal | Provider failure after Evidence must preserve partial context safely. |
| Duplicate request transcript | Idempotency replay may create incompatible client behavior. |

## What Is Already Decided

EVT-001 events:

```text
stage
evidence
token
done
error
```

Ordering:

```text
domain_rag:
  stage*
  evidence
  token*
  exactly one done or error

direct_llm:
  stage*
  token*
  exactly one done or error
  no evidence event
```

Allowed stages:

```text
classifying | planning | retrieving | verifying | answering | direct_answering
```

## Recommended Contract Patch

Patch EVT-001 and API-001 with a shape like this, or an equivalent approved shape:

```text
event: evidence
data:
  {
    "evidence": [
      {
        "evidenceId": "turn-scoped-opaque-id",
        "excerpt": "bounded approved excerpt",
        "sourceLabel": "safe label",
        "citationLabel": "optional display label"
      }
    ]
  }
```

```text
event: done
data:
  {
    "route": "domain_rag",
    "stopReason": "grounded",
    "citations": [
      {
        "evidenceId": "turn-scoped-opaque-id",
        "citationLabel": "same safe display label"
      }
    ]
  }
```

Rules:

```text
evidenceId is current-turn scoped and opaque.
evidenceId must not be Source Document id or Source Block id.
done.citations references only evidenceIds emitted for this Turn.
direct_llm done has citations = [].
token text is answer text only; it is never Evidence.
stage contains labels only, not planning text.
```

Open decision: exact field names and whether `conversation_turn_evidence_refs.id` is the public `evidenceId` or mapped to a separate turn-scoped id.

## Implementation Order

1. Patch EVT-001/API-001 with exact `evidence`, `done`, and `error` payloads.
2. Add SSE transcript fixtures before route code.
3. Implement internal progress events separately from public SSE DTOs.
4. Persist evidence refs before emitting citations that reference them, or define a deterministic turn-scoped id generated before stream emission.
5. Validate final citations against current-turn evidence refs.
6. Snapshot direct success, domain success, no-grounded-context, evidence-only, auth/validation/duplicate, and client-cancel transcripts.

## Red Flags In PR

- `done.citations` contains Source Document id or Source Block id.
- `evidence` event includes raw hit text, scores, private runtime details, source path, or provider payload.
- `stage` event includes plan text, reasoning, prompt content, or tool internals.
- Provider-native stream chunks are forwarded directly.
- Domain RAG emits `token` before `evidence`.
- Direct LLM emits `evidence`.
- More than one terminal event is possible.
- `no_grounded_context` behavior differs between API docs, SSE fixtures, and tests.

## Tests

- SSE fixture: domain RAG success emits evidence before token and one terminal done.
- SSE fixture: direct LLM emits no evidence and done citations are empty.
- SSE fixture: no grounded context uses the approved terminal payload.
- SSE fixture: evidence-only fallback preserves Evidence and avoids raw provider error.
- Citation test: citations reference only evidence ids emitted in same Turn.
- Safety scan: no private ids, prompt text, provider payloads, LightRAG hits, source content, runtime details, or raw errors in SSE fixtures.

## One-line summary

Name the Evidence event identity before streaming; citations cannot be safe if their target id is guessed in code.
