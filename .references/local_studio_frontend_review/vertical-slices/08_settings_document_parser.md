# 08 — Settings: Document Parser

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin chooses approved parser policy. Parser output stays canonical. Downstream indexing must not care which parser produced it.

## Entry points

Admin Settings -> Document Parser. Inspect selected parser. Change future upload default where policy allows.

## Evidence and target

**OBSERVED:** Context Engine has `document_processing` package, document processing tests, pipeline/storage tests.

**TARGET:** Parser is explicit domain/provider-style configuration. A parser change affects new work only unless a deliberate reprocess action exists.

## User flow

1. Admin opens Parser setting.
2. Client loads allowed parser summaries.
3. Admin selects parser/default.
4. Server validates availability/config.
5. Server persists policy.
6. New upload reads policy at job creation.
7. Existing document retains parser provenance.


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
| Parser registry | FastAPI processing service | Canonical allowed list. |
| Domain parser policy | FastAPI/domain config | Server validates. |
| Parser execution | Worker | Never browser. |
| Document parser provenance | Document record | Immutable per ingest attempt. |

## Target API boundary

```http
GET   /api/v1/admin/document-parsers
GET   /api/v1/admin/domains/{domain_id}/parser-policy
PATCH /api/v1/admin/domains/{domain_id}/parser-policy
```

Minimal `ParserSummary`: `id`, `display_name`, `available`, `capabilities`. Do not expose implementation secrets/config paths.

## State model

```text
unknown -> available
unknown -> unavailable
available -> selected
selected -> retired (new uploads blocked; old provenance retained)
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

No parser execution in Next.js.
No arbitrary parser package upload.
No silent parser fallback.
No changing historical document parser label.
No parser-specific downstream schema fork.

## Acceptance criteria

- Admin only.
- Unavailable parser cannot be selected.
- Upload job snapshots parser ID.
- Document detail shows parser provenance.
- Existing pipeline tests remain valid.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/document_processing/`; `app/api/routes/documents.py`; `app/api/routes/ai_settings.py`; `tests/test_document_processing_models.py`; `tests/test_document_processing_pipeline.py`; `tests/test_document_processing_storage.py`; Local Studio `frontend/src/features/settings/`, `ui/select.tsx`, `form-field.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
