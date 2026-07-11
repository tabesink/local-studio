# 10 — Retrieval, Evidence, and Grounding

## Canonical evidence object

```python
EvidenceRef(
    reference_id: str,
    domain_id: str,
    source_id: str,
    source_revision_id: str,
    document_title: str,
    locator: str,              # page / section / chunk identifier
    excerpt: str,
    score: float | None,
    active: bool,
)
```

## Retrieval operation

```text
PlanStep(intent=fact|overview|verbatim, query)
  │
  ▼
RetrievalPort.retrieve(domain_id, query, intent, server_policy)
  │
  ▼
EvidenceRef[]
  │
  ▼
Deduplicate + token budget + active source check
  │
  ▼
EvidenceBundle
```

## Grounding layers

```text
raw evidence
  │
  ├─ deterministic: active source / scope / citation / duplicate checks
  │
  └─ optional LLM verifier: "are proposed claims entailed by these excerpts?"
         │
         ├─ pass → usable fact
         └─ fail → one repair or insufficiency
```

## Mandatory policy

1. An answer may cite only `EvidenceRef` items returned for this turn.
2. Evidence must be current and active.
3. Citations are validated after final answer generation.
4. No evidence means: say the available sources do not establish the answer.
5. “Grounded” is a runtime verdict, not an absolute factual guarantee.

## Upstream preservation

**OBSERVED:** upstream separately filters retrieved text and asks an LLM whether distilled content and generated answers are grounded. The target preserves this as evidence filtering plus a bounded verifier, but keeps excerpts and source locators structured from the beginning.
