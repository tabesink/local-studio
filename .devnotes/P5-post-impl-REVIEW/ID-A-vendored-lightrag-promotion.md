# ID-A - Vendored LightRAG promotion (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/02-architecture/decisions/ADR-002-vendored-lightrag-package.md`, `specs/04-features/F-005-lightrag-indexing-eligibility/tasks.md`, `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`, `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`.

**Question:** What does F-005 T-060 require before P6 native retrieval work?

### Decision

Promote pinned LightRAG 1.4.16 from `.references/code/lightrag/` into `vendor/lightrag/` before native runtime wiring ships.

This is now implemented for F-005 T-060. P6 should treat `vendor/lightrag/` as the runtime source, not `.references/` or pip-only `lightrag-hku`.

### Why

| Bad path | Good path |
| --- | --- |
| Edit `.references/code/lightrag/`. | Keep `.references/` read-only as evidence. |
| Depend on pip-only `lightrag-hku`. | Use committed editable runtime code at `vendor/lightrag/`. |
| Run proof fixtures against one tree and runtime against another. | Repoint proof and runtime imports to the same vendored tree. |
| Start P6 retrieval over local sidecar records. | Retrieve from the vendored private LightRAG runtime path. |

### Exact Contract Sketch

```text
.references/code/lightrag/   read-only upstream evidence
        |
        v
vendor/lightrag/             editable pinned runtime source
        |
        +-- native proof imports
        +-- runtime image/build path
        +-- future surgical CE KG prompt edits
```

The promoted tree must record the pinned upstream version. Future CE prompt edits belong in `vendor/lightrag/`, not `.references/` and not an unpinned site-package install.

### Implement Order

1. Copy the pinned LightRAG 1.4.16 reference tree into `vendor/lightrag/`.
2. Add or preserve version evidence inside the vendored tree.
3. Wire native proof imports to prefer `vendor/lightrag/`.
4. Wire runtime build/package paths to use `vendor/lightrag/`.
5. Re-run the P5 fixture gates: typed injection, idempotent submit, readiness, delete/absence, and `CE_BLOCK` preservation.
6. Update F-005 acceptance, implementation log, and traceability matrix.

### Red Flags In PR

- `.references/code/lightrag/` is modified.
- Tests pass only because installed pip `lightrag` shadows the vendored tree.
- Runtime image/build scripts still copy from `.references/`.
- Vendored promotion lands without re-running the P5 pinned native proof.
- KG prompt edits are made before the vendored baseline is established.

### Tests

- Import test proves native LightRAG resolves from `vendor/lightrag/`.
- P5 pinned proof runs against the vendored tree.
- Build/runtime path test proves the private runtime uses the vendored tree.
- No `.references/code/lightrag/` files change in the promotion PR.

### One-line summary

T-060 is closed: vendored LightRAG is the native runtime source for the next P6 retrieval proof.
