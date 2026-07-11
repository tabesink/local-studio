# ID-A - Query eligibility (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** What should `source_is_query_eligible()` own?

### Decision

P5 implements one server-side predicate: `source_is_query_eligible(source, domain)`. P6/P7 call it. Frontend never copies it. Retrieval must ignore any source that fails the predicate, even if LightRAG returns a hit.

### Why

| Bad | Good |
| --- | --- |
| P6 repeats index-state conditions | P6 calls helper |
| frontend computes queryability | backend computes queryability |
| ready means only native ready | ready also requires source/domain lifecycle fences |
| deleted source can be cited from old hit | eligibility blocks deleted/fenced source |

### Predicate Sketch

Patch DATA/API if field names differ:

```text
source_is_query_eligible(source, domain) =
  domain is available by P3 rules
  AND source.state == "prepared"
  AND source.index_state == "ready"
  AND source index generation is current
  AND source is not deleting/cancelling
  AND no active destructive fence exists
```

Domain availability remains P3-owned. Source preparation remains P4-owned. Index readiness/fences are P5-owned.

### Implementation Order

```text
1. Add pure helper in indexing/source service.
2. Add table-driven unit tests for every false condition.
3. Use helper in any P5 readiness/status service that needs queryability.
4. Document P6 must call helper before mapping Evidence.
```

### Red Flags In PR

- Helper queries LightRAG directly.
- Helper returns true for source `prepared` but index not ready.
- Helper ignores domain deleting/active operation availability rules.
- Frontend/client code has a copied boolean formula.
- P6 mapper accepts a raw hit before checking helper.

### Tests

- Prepared + ready + available domain returns true.
- Domain stopped/deleting/active op returns false.
- Source pending/deleting returns false.
- Index queued/submitting/accepted/failed/cancelled returns false.
- Stale generation or cancel/delete fence returns false.

### One-line Summary

Query eligibility is one backend predicate joining P3 domain availability, P4 source preparation, and P5 index readiness.
