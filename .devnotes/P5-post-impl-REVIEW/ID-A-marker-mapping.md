# ID-A - Marker mapping (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`, `specs/03-contracts/ai/grounded-answering.md`, `specs/03-contracts/data/context-engine-data.md`, `context_engine/services/indexing.py`.

**Question:** How should P6 map raw retrieval hits to Evidence?

### Decision

Use strict `CE_BLOCK` marker parsing and exact Source Block lookup only.

No fuzzy mapping. No source order fallback. No remote chunk id fallback. No parser-native id fallback.

### Why

| Bad | Good |
| --- | --- |
| Raw hit text has no marker, but looks similar to a Source Block. | Discard it. |
| Raw hit has two markers. | Discard it. |
| Marker points to another domain. | Discard it. |
| Marker points to deleted or ineligible source. | Discard it. |
| Marker maps to one eligible Source Block. | Return safe Evidence DTO. |

### Exact Flow Sketch

```text
for raw_hit in lightrag_hits:
  marker = parse_exactly_one_CE_BLOCK(raw_hit.text)
  if marker missing or ambiguous:
    discard

  block = load SourceBlock by marker.id
  if missing:
    discard

  source = block.source_document
  if source.domain_id != selected_domain.id:
    discard

  if not source_is_query_eligible(source, selected_domain):
    discard

  emit safe Evidence DTO
```

The DTO may include a bounded safe excerpt and safe source label only after API-001 names the exact shape.

### Implement Order

1. Write pure parser tests.
2. Write mapper tests with fake raw hits.
3. Add eligibility tests that call the P5 helper.
4. Add API tests only after parser/mapper behavior is locked.

### Red Flags In PR

- Mapper accepts first marker when two markers exist.
- Mapper accepts a hit because source order matches.
- Mapper trusts raw LightRAG source ids.
- Mapper exposes `SourceBlock.id` to the browser.
- Mapper reimplements P5 readiness checks.

### Tests

- Accept exactly `[CE_BLOCK id=<id> order=<n>]` once.
- Reject no marker, malformed marker, and multiple markers.
- Reject known block from a different Knowledge Domain.
- Reject known block whose Source Document is not query-eligible.
- Return `no_grounded_context` when every hit is discarded.

### One-line summary

Evidence exists only after one raw hit maps to one eligible Source Block by exact `CE_BLOCK` identity.
