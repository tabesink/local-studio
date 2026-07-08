# Dashboard

Status: deferred implementation mockup.

## Purpose

Future operator overview for shared-node operations. This is not P9 scope and not P8 core scope.

## Specs

- `specs/04-features/F-008-observability-pilot-gate/spec.md`
- F-010 shared-node-operations is deferred in this checkout; no approved feature files were present.
- `DESIGN.md`

## Frontend Module

`src/features/dashboard/` after F-010 contracts exist.

## Reference Targets

- `.references/feature-ce-api-uiux-wirering-brainstorm/F-008-observability-pilot-gate.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-009-frontend-slices.md` slices 15 and 17
- `.references/code/local-studio-codebase/frontend/src/ui/table.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/status.tsx`

## Wiring Pack Notes

The wiring pack has `/operations` slices for operation recovery and audit diagnostics, not a P8 dashboard. Keep this file as F-010-only until node/usage/storage contracts exist.

## ASCII Mockup

```text
/operations or future /dashboard
+----------------------------------------------------------------------------+
| Operations overview                                      [Refresh]          |
|----------------------------------------------------------------------------|
| Runtime nodes                      | Domain health                          |
| node-a     healthy     4 envs      | fatigue-analysis  ready       12 docs  |
| node-b     degraded    1 env       | field-manuals     indexing     3 docs  |
|------------------------------------+---------------------------------------|
| Active operations                                                          |
| status   type       target              started          operator   action  |
| running  source     manual.pdf          12:04            admin      Details |
| queued   domain     old-domain          12:02            admin      Details |
|----------------------------------------------------------------------------|
| Detail panel opens on row click; no colored metric cards.                   |
+----------------------------------------------------------------------------+
```

## Intended Wiring

Do not implement until F-010 promotes API/data contracts. Expected future DTO groups:

```text
Runtime Node safe status
Node Environment lifecycle summary
domain/source operation summaries
storage summary from backend
safe diagnostics status
```

## Current P8 Data Allowed

P8 can support admin audit read and optional LightRAG diagnostics only:

- `GET /api/v1/admin/audit-events`
- optional `GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag`

Those are not enough for a real dashboard.

## Parity Rules

- Use dense tables and fact rows.
- Show status with dot/pill plus text.
- Use a right detail panel for operation details.
- No large KPI tiles, gradients, or color-filled cards.

## Do Not Wire

- No browser-computed cost, storage, health, Docker, node availability, or runtime URLs.
- No controller API keys or host paths.
- No F-010 dashboard from mock data disguised as product truth.
