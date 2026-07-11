# Feature Specifications

One feature folder equals one vertical delivery slice: a coherent user/business outcome that can be planned, built, tested, and demonstrated.

## Context Engine Phase Features

Build in order:

1. `F-000-shared-contract`
2. `F-001-trusted-application-foundation`
3. `F-002-trusted-runtime-config`
4. `F-003-knowledge-domains-runtime`
5. `F-004-source-documents-preparation`
6. `F-005-lightrag-indexing-eligibility`
7. `F-006-scoped-evidence-retrieval`
8. `F-007-grounded-streaming-chat`
9. `F-008-observability-pilot-gate`
10. `F-009-frontend-delivery`

Each folder contains:

- `spec.md` for behavior and scope;
- `ux.md` for user-visible or API-facing interaction contract;
- `plan.md` for implementation boundaries;
- `tasks.md` for ordered work;
- `test-plan.md` for proof strategy;
- `acceptance.md` for completion evidence;
- `implementation-log.md` for delivery notes, deviations, and drift.

`F-009-frontend-delivery/` also includes `frontend-slice-map.md`, `ce-client-port-and-parity.md`, and `context-panel-tabs.md`.

## Feature Size Rule

Split a phase only when a planned change has an independent user outcome, separate release gate, or unclear ownership. Do not split merely to preserve a technical layer boundary.
