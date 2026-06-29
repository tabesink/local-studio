# 10 — Document Upload + Ingestion Operations

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin uploads one document. Backend creates job. UI shows server-confirmed pipeline progress. No fake progress.

## Entry points

Library -> Upload. Drag/drop/select file. Submit. Inspect job. Cancel/retry only if backend supports it.

## Evidence and target

**OBSERVED:** Context Engine has documents/jobs/processing-status routes, worker/poller architecture, ingestion service tests.

**TARGET:** Compact Local Studio modal. Job row + detail panel. Client polls current API until server push is proven valuable.

## User flow

1. Admin opens upload modal.
2. Client validates file size/type locally for quick feedback.
3. Client sends multipart request.
4. FastAPI authorizes, validates, stores document, creates job.
5. API returns document + job IDs.
6. Worker parses/indexes.
7. Poller syncs remote LightRAG status.
8. Client polls job/detail.
9. Completion refreshes library.
10. Failure exposes compact diagnostics.


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
| Upload acceptance | FastAPI | Client validation not authority. |
| File storage | Backend storage | Not browser cache. |
| Job state | FastAPI/worker | Server-confirmed only. |
| Remote indexing state | Status poller | Normalize before UI. |
| Progress display | Upload feature | Poll typed state. |

## Target API boundary

```http
POST /api/v1/admin/domains/{domain_id}/documents
GET  /api/v1/admin/ingestion-jobs/{job_id}
POST /api/v1/admin/ingestion-jobs/{job_id}/retry
POST /api/v1/admin/ingestion-jobs/{job_id}/cancel   # only if supported
```

Upload response:

```ts
type UploadDocumentResponse = { document: DocumentSummary; job: IngestionJobSummary };
```

## State model

```text
selected -> uploading -> accepted -> queued
queued -> parsing -> indexing -> indexed
queued/parsing/indexing -> failed
queued -> cancelled  # only if backend supports it
failed -> retrying -> queued
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

No frontend-only percent.
No success toast before job exists.
No duplicate upload on double-click.
No upload inner-card maze.
No forced SSE for jobs before polling proves insufficient.
No retry that silently changes parser/model policy.

## Acceptance criteria

- Admin upload creates document + job.
- Member upload denied.
- Worker state transitions visible.
- Job failure shows diagnostics.
- Duplicate submit prevented.
- Cancel only shown when API capability supports it.
- Upload modal states screenshot-tested.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/documents.py`; `app/api/routes/jobs.py`; `app/api/routes/processing_status.py`; `app/workers/`; `tests/test_lightrag_ingestion_service.py`; `tests/test_processing_status_routes.py`; Local Studio `frontend/src/ui/modal.tsx`, `progress-bar.tsx`, `status.tsx`, `error-box.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
