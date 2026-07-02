---
id: ADR-002
title: Vendored LightRAG Package For Private Runtime Integration
status: accepted
date: 2026-07-02
owner: Context Engine delivery team
---

# ADR-002 - Vendored LightRAG Package For Private Runtime Integration

## Context

Context Engine integrates a private LightRAG runtime per Knowledge Domain for indexing (P5), evidence retrieval (P6), and grounded chat (P7). The product plan includes subtle, version-controlled modifications to LightRAG knowledge-graph construction prompts (primarily entity/relationship extraction in `prompt.py`).

A pip-only dependency on `lightrag-hku` would make those prompt edits non-deterministic across reinstalls, upgrades, and deployment images. The pinned P5 proof fixture already exercises native LightRAG behavior from `.references/code/lightrag/`, but `.references/` is read-only evidence and must not become the editable runtime source.

## Decision

Require an **editable vendored LightRAG tree in the repository** as the runtime source of truth for private Context Engine LightRAG integration.

- **Canonical path:** `vendor/lightrag/` (first-class, editable Python package in git).
- **Seed/reference:** `.references/code/lightrag/` remains read-only upstream evidence until promotion; the vendored tree must record the pinned upstream version it was copied from.
- **Edit policy:** keep changes surgical. Planned KG prompt tweaks belong in the vendored tree (mainly `prompt.py`); avoid broad refactors that block upstream reconciliation.
- **Integration boundary:** Context Engine application and worker code continue to call LightRAG only through private index/retrieval client adapters. Do not scatter direct `LightRAG` imports across API routes or frontend-facing services.
- **Dependencies:** declare LightRAG runtime dependencies explicitly in Context Engine packaging (`pyproject.toml` or runtime image build), rather than relying on an implicit pip install of the upstream package as the runtime source.

**Rejected:** using `pip install lightrag-hku` alone as the runtime source of truth when Context Engine-owned KG prompt changes are required.

## Options Considered

- **Pip-only `lightrag-hku`:** rejected because prompt edits would be lost on upgrade/reinstall and are hard to review as product diffs.
- **Runtime monkey-patching of `PROMPTS` without a vendored tree:** rejected because it hides ownership, complicates reproducible builds, and still depends on pip package layout stability.
- **Editable fork kept only under `.references/code/lightrag/`:** rejected because `.references/` is evidence-only and must not be edited.
- **Pip base plus runtime overlay (old CE Docker pattern):** acceptable only if the overlay is the committed vendored tree at `vendor/lightrag/`; pip must not remain the editable source.

## Consequences

- Before native private-runtime wiring ships beyond the current fake index client, promote LightRAG from reference evidence into `vendor/lightrag/` and pin the upstream version in specs/tests.
- P5 pinned proof fixtures may continue to use `.references/code/lightrag/` until promotion; after promotion, native proof and runtime must target `vendor/lightrag/`.
- Any KG prompt change must re-run pinned LightRAG proof gates (`CE_BLOCK` preservation, idempotent submit, readiness, delete/absence, typed secret injection).
- Future runtime images/workers install or copy from `vendor/lightrag/`, not from an unpinned PyPI release alone.

## Migration/Rollback

Promotion is additive: copy the pinned reference tree into `vendor/lightrag/`, wire imports/build paths, and keep `.references/code/lightrag/` unchanged as evidence. Rollback can revert to the fake index client boundary while leaving the vendored tree in place; do not delete indexed remote content rules or P5 state-machine behavior.

## Validation

- Spec/plan docs reference this ADR from F-003, F-005, F-006, and architecture boundaries.
- Promotion task proves `vendor/lightrag/` imports in CI and updates pinned native proof to use the vendored path.
- KG prompt edits include a recorded upstream version and pass the P5 pinned fixture suite.

## Related Specs/Contracts

- `specs/02-architecture/component-boundaries.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-003-knowledge-domains-runtime/`
- `specs/04-features/F-005-lightrag-indexing-eligibility/`
- `specs/04-features/F-006-scoped-evidence-retrieval/`
