# 14 — LightRAG Domain Lifecycle

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin starts, stops, deletes domain runtime. Server owns lifecycle. UI shows operation and confirmed state.

## Entry points

Admin Domains row action. Domain detail inspector. Confirm delete.

## Evidence and target

**OBSERVED:** Context Engine includes `lightrag_admin`, `lightrag_deploy`, compose/manifest/docker tests, remote adapter/reachability/failure tests.

**TARGET:** Lean lifecycle only: create, start, stop, delete. Do not restore recreate/regenerate/repair actions as user features.

## User flow

1. Admin selects domain.
2. Clicks Start/Stop/Delete.
3. Client sends one command.
4. FastAPI validates role + current lifecycle state.
5. Service creates operation.
6. Deploy runner performs action.
7. Poller/operation updates state.
8. Client refreshes operation/domain.
9. Delete removes after backend confirmation.


## Local Studio visual transfer

| Element | Use |
|---|---|
| Shell | Left rail. Center canvas. Optional right detail panel. |
| Density | `24px` small rows. `28px` controls/standard rows where primitive supports it. |
| Type | Geist for UI/body. Geist Mono for IDs, paths, model names, durations, payloads. |
| Surfaces | Dark-first close charcoal layers. 1px quiet borders. No card grid. |
| Actions | White/black high-contrast primary. Quiet danger. Compact icon/ghost secondary. |
| State | `StatusDot`/`StatusPill`; thin progress; compact error box. |
| Detail | Inspector stays in context. Do not route away for a small inspection. |


## Ownership

| Concern | Owner | Rule |
|---|---|---|
| Lifecycle transition | FastAPI service | Validate state machine. |
| Docker/compose manifest | Deploy service | Backend-only. |
| Current health | Poller/reachability service | Normalize. |
| Action UI | Admin domain feature | Disable duplicate only. |
| Operation log | Backend | Needed for recovery/audit. |

## Target API boundary

```http
POST   /api/v1/admin/domains/{domain_id}/start
POST   /api/v1/admin/domains/{domain_id}/stop
DELETE /api/v1/admin/domains/{domain_id}
GET    /api/v1/admin/operations/{operation_id}
```

All commands return `OperationSummary`, not optimistic final state.

## State model

```text
created -> starting -> ready
ready -> stopping -> stopped
stopped -> starting
created/stopped/ready/failed -> deleting -> deleted
starting/stopping/deleting -> command conflict
```


## Required UI states

| State | Required UI |
|---|---|
| Loading | Preserve layout. Local skeleton/quiet progress. No page flash. |
| Empty | Short sentence + one next action. No illustration by default. |
| Error | Compact `ErrorBox`. Clear recovery action. |
| Forbidden | Explain role boundary. Do not fake disabled success. |
| Pending mutation | Disable duplicate action. Keep server truth visible. |
| Background refresh | Small status. Do not block current read-only work. |


## Do not build

No client Docker commands.
No automatic retry loop in browser.
No lifecycle predicted from button click.
No recreate/regenerate user action.
No member lifecycle visibility if policy says admin-only.

## Acceptance criteria

- Invalid transition returns conflict.
- Member denied.
- Start/stop return operation.
- Delete confirm then server state removes row only after success.
- Failure exposes operation detail.
- Recovery path documented in slice 15.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/lightrag_admin.py`; `app/lightrag_deploy/`; `tests/test_lightrag_deploy_manifest_compose.py`; `tests/test_lightrag_deploy_service.py`; `tests/test_lightrag_docker_runner.py`; `tests/test_lightrag_reachability_service.py`; Local Studio `frontend/src/ui/model-stop-confirm.tsx`, `status.tsx`, `right-detail-panel.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
