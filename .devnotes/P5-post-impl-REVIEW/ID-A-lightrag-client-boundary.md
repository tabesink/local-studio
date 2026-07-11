# ID-A - LightRAG client boundary (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`, `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`, `specs/03-contracts/ai/grounded-answering.md`, `context_engine/services/indexing.py`, `tests/test_lightrag_indexing.py`.

**Question:** Can P6 retrieval build on the P5 app indexing code as-is?

### Decision

No. T-060 is closed, but the retrieval client boundary still must be resolved.

F-005's product outcome is private LightRAG indexing. The current app boundary writes sidecar records through `LocalLightRAGIndexClient`; the native LightRAG proof appears in tests as a separate fixture. ADR-002 and F-005 T-060 say the native runtime must be promoted into `vendor/lightrag/` from pinned LightRAG 1.4.16 before production native wiring. P6 needs `retrieve()` hits that contain preserved `CE_BLOCK` markers. A sidecar record is not that proof.

### Why

| Bad path | Good path |
| --- | --- |
| Treat the local sidecar as retrievable Evidence. | Retrieve from the private LightRAG runtime or patch the contract first. |
| Let P6 parse stored `blockIds`. | Parse `CE_BLOCK` from raw runtime hit text. |
| Assume fixture proof covers app worker writes. | Prove the app worker writes the corpus P6 retrieves. |
| Keep importing from `.references/code/lightrag/`. | Promote to `vendor/lightrag/` and import/build from the vendored tree. |
| Keep docs saying implemented while traceability says planned. | Align feature register, matrix, and acceptance evidence. |

### Exact Implementation Sketch

Target shape:

```text
P5 submit:
  render_lightrag_input()
  -> private LightRAG client submit()
  -> native request/readiness/delete identity

P6 retrieve:
  private LightRAG client retrieve()
  -> raw hit text containing CE_BLOCK
  -> strict mapper
```

If the implementation intentionally keeps the local sidecar, patch F-005, F-006, API-001, DATA-001, and AI-001 to state that sidecar retrieval is the approved private runtime. Do that before code. T-060 is now closed; the next proof is app-boundary retrieval.

### Implement Order

1. Promote pinned LightRAG 1.4.16 from `.references/code/lightrag/` to `vendor/lightrag/`.
2. Repoint native proof imports and runtime build paths to `vendor/lightrag/`.
3. Decide whether `LocalLightRAGIndexClient` becomes a real private LightRAG client or remains a test/local stand-in.
4. If real, wire submit/readiness/delete to the vendored LightRAG runtime boundary.
5. Add a retrieval fixture that uses content submitted through the app boundary.
6. Only then implement P6 `retrieve()`.
7. Update F-005 acceptance and traceability matrix.

### Red Flags In PR

- P6 reads `blockIds` from local JSON records.
- P6 test inserts fake hit records directly instead of retrieving app-indexed content.
- Docs say native LightRAG is proven while app code does not call the native boundary.
- Runtime imports from `.references/code/lightrag/` or pip-only `lightrag-hku` after T-060.
- The review resolves the gap only in prose, with no contract or test patch.

### Tests

- Import native LightRAG from `vendor/lightrag/` in the pinned proof test.
- Submit a prepared Source Document through P5 worker, then retrieve through the same private runtime boundary and assert one hit contains exactly one `CE_BLOCK`.
- Delete indexed content through P5 cleanup and assert later retrieval returns no mapped Evidence.
- Repeat submit with the same request identity and assert retrieval does not duplicate Evidence.

### One-line summary

P6 needs the corpus P5 actually indexed, not a second private truth hidden in a test fixture.
