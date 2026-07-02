# 13 — Test and Evaluation Strategy

## Unit tests

```text
orchestrator
  - stops at each budget
  - cannot choose unknown operation
  - cannot emit answer after failed citation validation

retrieval adapter
  - always receives authorized domain
  - returns normalized evidence

evidence
  - deduplicates
  - rejects inactive/deleted sources
  - validates citation IDs

SSE projection
  - emits only allowed event schema
  - never emits internal prompts/reasoning
```

## Integration fixtures

| Fixture | Expected route |
|---|---|
| Direct answer in one passage | retrieve fact → answer |
| Document-level comparison | retrieve overview + fact → answer |
| Exact wording request | retrieve verbatim → answer |
| Multi-hop entity relation | plan → ≥2 retrievals → answer |
| Unanswerable question | retrieval → insufficiency |
| Deleted-source question | no retrieval / redacted citation |
| Unauthorized domain | reject before retrieval |

## Evaluation record

```text
question
expected source IDs
reference answer (when available)
retrieved evidence IDs
final citation IDs
stop reason
latency and token counts
manual reviewer verdict
```

## Metrics

- Deterministic: citation validity, source scope, source active state, loop-budget compliance, latency.
- Human: factual support, completeness, useful insufficiency behavior.
- Optional offline Ragas: answer correctness, faithfulness, answer relevancy, context recall/precision.

**OBSERVED:** upstream README presents Ragas metrics including answer correctness, faithfulness, answer relevancy, context recall, and answer similarity. Keep evaluation out of the online chat request path.
