# 09 — Documents Library

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Let authorized user scan domain documents. Open details without leaving library. Keep data dense.

## Entry points

Domain -> Library. Search/filter. Select document. Open source/chunk/asset detail.

## Evidence and target

**OBSERVED:** Context Engine has documents route/schema, asset tests, document access policy tests, workspace tree/context models.

**TARGET:** Local Studio dense table/list + right detail panel. Preserve Context Engine document meaning.

## User flow

1. User selects domain.
2. Client loads page of accessible documents.
3. User filters/searches.
4. User selects row.
5. Right panel loads document detail.
6. User opens chunk/evidence or asset.
7. Admin sees upload/delete actions. Member sees read-only inspection.


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

| State | Owner | Rule |
|---|---|---|
| Document metadata/status | FastAPI | Canonical. |
| Access decision | FastAPI | Domain + document policy. |
| Filter/page cursor | Route/search params | Shareable when useful. |
| Selected document | Library feature | Local; may mirror URL. |
| Detail panel | Library feature | Local presentation state. |

## Target API boundary

```http
GET /api/v1/domains/{domain_id}/documents?cursor=&limit=&status=&q=
GET /api/v1/domains/{domain_id}/documents/{document_id}
GET /api/v1/documents/{document_id}/assets/{asset_id}
```

List row fields: status, title, source path, parser, chunks, updated time. Detail may add ingestion job, asset list, diagnostics.

## State model

```text
no domain -> blocked selection state
loading -> ready
ready -> filtered
row selected -> detail loading -> detail ready
document missing/deleted -> selected row clears + typed notice
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

No document card grid.
No raw host file path as clickable filesystem.
No client-side access filtering.
No duplicated document record in chat store.
No asset URL without server authorization.

## Acceptance criteria

- Member sees only accessible domain docs.
- Pagination/filter work.
- Detail panel loads without route loss.
- Asset access follows document policy.
- Empty library state clear.
- Visual row density meets parity contract.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/documents.py`; `app/schemas/documents.py`; `app/api/routes/workspace_tree.py`; `tests/test_document_access_policy.py`; `tests/test_document_asset_service.py`; `tests/test_asset_urls.py`; Local Studio `frontend/src/ui/table.tsx`, `list.tsx`, `right-detail-panel.tsx`, `copyable-path-chip.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
