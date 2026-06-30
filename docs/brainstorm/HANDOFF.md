# Backend Handoff

Status: ready for P1 implementation

## Mission

Build Context Engine backend in the P0-P8 order without introducing duplicate state owners or extra infrastructure. Keep each slice thin, testable, and documented.

## Issue Order

1. `issues/P0-shared-contract.md` - canonical contract, already accepted.
2. `issues/P1-trusted-foundation.md` - auth/session/admin foundation.
3. `issues/P2-runtime-config.md` - encrypted provider/model/parser config.
4. `issues/P3-domain-lifecycle.md` - private domain runtime lifecycle.
5. `issues/P4-source-preparation.md` - upload and canonical preparation.
6. `issues/P5-lightrag-indexing.md` - indexing and eligibility.
7. `issues/P6-evidence-retrieval.md` - exact evidence retrieval and source view.
8. `issues/P7-grounded-chat.md` - routed streaming chat.
9. `issues/P8-observability.md` - metadata-only observability.

## Current Baton

Next coding baton: `P1-trusted-foundation`.

Before editing runtime code, create the backend scaffold and update `docs/master-build-plan.md` from `PLANNED` to `IN PROGRESS` for P1.

## Recovery Notes

- If docs conflict, root `AGENTS.md` and P0 win.
- If a phase plan conflicts with P0, fix the phase plan before coding.
- If LightRAG fixture gates fail, stop and document the blocker. Do not add a fallback retrieval stack.
- If implementation changes setup/test/deployment commands, update `docs/README.md`, `docs/test-strategy.md`, and `docs/deployment.md`.
- If schema changes, update `docs/DATABASE_OWNERSHIP.md`.

## Operator Notes

This repository is not currently a Git repository in this workspace, so commit-oriented commands may fail until Git metadata exists. Runtime test commands are not available until P1 scaffolds the backend.

