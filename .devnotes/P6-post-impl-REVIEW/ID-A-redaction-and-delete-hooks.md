# ID-A - Redaction and delete hooks (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-007-grounded-streaming-chat/spec.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/01-product/business-rules.md`, `specs/02-architecture/data-ownership.md`, `specs/02-architecture/component-boundaries.md`.

**Question:** Can P7 persist grounded answers and citations before delete/redaction hooks exist?

## Decision

Only if the same P7 slice includes redaction hooks before completion.

DATA-001 and BR-010 require source/domain delete to redact derived answer and citation content while preserving the user's original question. This is backend state, not UI masking.

## Why

| Bad path | Good path |
| --- | --- |
| Delete source rows and rely on cascade to hide citations. | Redact affected Turns deliberately and test the state transition. |
| Keep assistant answers after cited source deletion. | Clear derived answer content. |
| Delete the user's question. | Preserve `user_message`. |
| Treat redaction as a frontend display rule. | Persist `status = redacted` and `stop_reason = redacted`. |
| Lose lookup data before redaction can find affected Turns. | Redact before source/block rows disappear or preserve private refs until redaction completes. |

## Exact Contract Sketch

Affected Turn:

```text
conversation_turns.route == domain_rag
AND (
  turn.domain_id == deleted domain
  OR conversation_turn_evidence_refs.source_document_id == deleted source
  OR conversation_turn_evidence_refs.source_block_id belongs to deleted source
)
```

Redaction transition:

```text
assistant_answer = null
status = redacted
stop_reason = redacted
safe_error_code = null or approved redaction code
safe_error_message = null or approved safe message
user_message remains unchanged
evidence refs retained with redacted_at set; citation_label, source_label, excerpt cleared
```

**Locked decision (2026-07-06): Option C — retain rows with `redacted_at`.**

- Public API DTO for redacted turns: keep `userMessage`; `status=redacted`; `stopReason=redacted`; `assistantAnswer=null`; `evidence=[]`; `citations=[]`.
- Do not delete `conversation_turn_evidence_refs` rows on redaction. Set `redacted_at`, clear public fields, keep private source/block ids for internal audit until source rows are removed.
- Public mappers and SSE replay omit rows where `redacted_at IS NOT NULL`.

## Delete Ordering Rule

For source delete:

```text
fence source from future retrieval
delete/verify remote indexed content per P5
redact affected Turns while source/block identity is still available
delete local source rows/files
```

For domain delete:

```text
fence domain from future retrieval/chat
redact all domain_rag Turns for the Knowledge Domain
complete runtime/source cleanup
delete local domain/source rows when safe
```

If existing delete implementation removes rows before redaction can identify affected Turns, patch the delete service sequence before marking F-007 done.

## Implementation Order

1. Patch DATA-001/API-001 if redacted DTO/ref retention shape is missing.
2. Add conversation/evidence-ref schema with private source/domain lookup fields.
3. Add a pure redaction service that operates by source id and domain id.
4. Call redaction from source delete path.
5. Call redaction from domain delete worker path.
6. Add integration tests that create grounded Turns, delete cited source/domain, and read the Conversation afterward.
7. Add safety snapshot for redacted turn summary.

## Red Flags In PR

- Evidence refs have no private source/block fields, so redaction cannot find affected Turns.
- Redaction relies on frontend filtering only.
- Source delete cascades evidence refs before Turn redaction.
- Assistant answer remains visible after cited source/domain delete.
- User question is removed.
- Direct LLM Turns are redacted by source delete.
- Redacted API response exposes private delete internals.

## Tests

- Source delete redacts domain-grounded Turn that cited the Source Document.
- Domain delete redacts all domain-grounded Turns for that Knowledge Domain.
- Direct LLM Turn survives source/domain delete unchanged.
- Redaction preserves `user_message`.
- Redaction clears derived answer/citation content from API response.
- Repeated delete/redaction is idempotent.
- Conversation owner filter still applies to redacted Turns.

## One-line summary

Grounded chat is not complete until delete can retract derived answers and citations without erasing the user's question.
