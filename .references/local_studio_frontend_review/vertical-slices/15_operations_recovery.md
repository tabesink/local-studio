# 15 — Operations + Recovery

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin inspects failed lifecycle/ingestion work. Recover with one explicit allowed action. Preserve cause.

## Entry points

Admin -> Operations. Job/domain row fails. Detail panel. Retry/start action where policy permits.

## Evidence and target

**OBSERVED:** Context Engine has jobs, processing status, deployment failure normalizer/reachability tests. Local Studio has logs/usage/controller status patterns.

**TARGET:** One operation table. One detail panel. Strong status. No dashboard metrics project.

## User flow

1. Admin opens Operations.
2. Client loads paginated rows.
3. Status/filter narrows list.
4. Admin opens detail.
5. Detail shows request, target, transition, diagnostics, safe recovery action.
6. Admin retries only allowed failed state.
7. Backend creates new operation.
8. Original failure remains visible.


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
| Operation state/log | FastAPI | Immutable history record. |
| Retry policy | Domain/job service | Server decides. |
| Diagnostics redaction | FastAPI | Never expose secret/path leak. |
| Filters/selection | Operations feature | Local/URL query. |

## Target API boundary

```http
GET  /api/v1/admin/operations?cursor=&status=&type=
GET  /api/v1/admin/operations/{operation_id}
POST /api/v1/admin/operations/{operation_id}/retry
```

Retry endpoint exists only for operation types supporting retry. Otherwise return `409 recovery_not_supported`.

## State model

```text
pending -> running -> succeeded
pending -> running -> failed
failed -> retry_requested -> new_operation
failed -> terminal
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

No generic “fix all” action.
No mutation of original failed operation.
No automatic lifecycle repair.
No browser retry storm.
No raw stack trace/secret dump.
No manual SQL tool in UI.

## Acceptance criteria

- Admin only.
- Failure diagnostic redacted.
- Retry allowed only supported operation.
- Original + new operation linked.
- Status filters/pagination.
- Error recovery panel screenshot tested.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/jobs.py`; `app/api/routes/processing_status.py`; `app/api/routes/lightrag_admin.py`; `tests/test_lightrag_failure_normalizer.py`; `tests/test_processing_status_service.py`; Local Studio `frontend/src/features/logs/`, `frontend/src/features/usage/`, `frontend/src/ui/error-box.tsx`, `table.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
