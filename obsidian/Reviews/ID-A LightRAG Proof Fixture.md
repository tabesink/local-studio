---
type: id-a
phase: P5
feature: F-005
status: active
layer:
  - lightrag
spec: specs/04-features/F-005-lightrag-indexing-eligibility/spec.md
audience: junior-dev
lifecycle: review
tags:
  - phase/p5
  - feature/f-005
  - type/id-a
  - review/id-a
  - layer/lightrag
  - status/active
---

# ID-A — LightRAG Proof Fixture

Parent: [[ID-A LightRAG Indexing Contract]]

**Question:** What must be proven before P5 business code starts?

### Decision

T-001 is a hard gate. Build a pinned LightRAG proof fixture before schema/service code. If the fixture cannot prove health, typed provider injection, idempotent submit, readiness, deletion, `CE_BLOCK` preservation, and delete-after-ready fencing, F-005 is blocked.

### Why

| Bad | Good |
| --- | --- |
| assume LightRAG preserves marker text | prove marker survival before retrieval depends on it |
| implement against a fake only | use a fake for unit tests after the pinned contract is proven |
| store raw responses for debugging | record safe fixture result only |
| let retry create duplicate remote content | prove idempotency/absence before retry |

### Exact Proof Shape

The fixture should use a synthetic prepared Source Document with two Source Blocks and marker text. It must prove:

```text
1. backend-owned client reaches private runtime health
2. configured embedding/provider values are injected server-side
3. submit accepts deterministic rendered text
4. same request id is idempotent
5. native ready can be observed
6. deletion removes remote indexed content
7. retrieval/readback still contains a CE_BLOCK marker
8. late ready after delete/cancel cannot mark the source eligible
```

Do not include private endpoint details, credential values, raw runtime payloads, raw source content, or stack traces in committed fixtures.

### Implement Order

```text
1. Add fixture harness under tests or a private fixture helper.
2. Add synthetic Source Blocks in test setup.
3. Render marker text through the same function planned for production.
4. Submit with stable request id.
5. Poll/readiness through the private client.
6. Delete and verify absence.
7. Record safe pass/fail evidence in F-005 acceptance.
```

### Vs Reference

Old code shows useful questions: remote submit paths, track status, and deletion/status APIs. It also uses old chunk identities and broader pipeline state. Greenfield P5 must prove the exact active contract rather than copying those shapes.

### Red Flags In PR

- T-010 migration lands before T-001 fixture evidence.
- Fixture records endpoint URLs, provider payloads, or runtime response bodies.
- Test asserts only "request succeeded" and not `CE_BLOCK` survival.
- Idempotency is assumed from source id without retry proof.
- Delete proof does not verify remote absence.

### Tests

- `test_pinned_lightrag_fixture_preserves_ce_block_identity`
- `test_pinned_lightrag_submit_is_idempotent`
- `test_pinned_lightrag_delete_removes_remote_content`
- `test_late_ready_after_delete_or_cancel_is_ignored`

### One-line Summary

P5 starts with proof, not optimism: no `CE_BLOCK` preservation proof means no indexing feature.

---

## Related

- [[ID-A LightRAG Indexing Contract]]
- [[P4 Review Index]]
- [[F-005 P5 Readiness]]

## Repo sources

- `.devnotes/P4-post-impl-REVIEW/ID-A-lightrag-proof-fixture.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/test-plan.md`
