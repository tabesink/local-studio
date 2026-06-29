# 16 — Workspace Context + Source Navigation

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Show retrieval context/source tree. Let user inspect evidence without exposing host filesystem.

## Entry points

Chat citation. Library document. Graph node evidence. Source navigation panel.

## Evidence and target

**OBSERVED:** Context Engine has workspace tree/context routes and schemas, source/document services, retrieval evidence mapping tests.

**TARGET:** Right detail panel with `Context`, `Source`, `Evidence` tabs. Local Studio file-browser visual grammar only. Context Engine never exposes host filesystem.

## User flow

1. User clicks citation/source.
2. Client opens inspector.
3. Client receives stable evidence/document/chunk IDs.
4. Client fetches authorized detail/tree.
5. User navigates logical document structure.
6. User opens linked asset if allowed.
7. Close inspector; chat/library/graph remains intact.


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
| Tree/context data | FastAPI workspace/document service | Logical source tree. |
| Evidence mapping | Retrieval service | Stable references. |
| Access policy | FastAPI | Check every detail/asset request. |
| Inspector tab/selection | Feature UI | Local. |
| Source path label | Metadata | Display only; not a host file capability. |

## Target API boundary

```http
GET /api/v1/domains/{domain_id}/workspace/tree
GET /api/v1/domains/{domain_id}/workspace/context
GET /api/v1/documents/{document_id}/chunks/{chunk_id}
GET /api/v1/documents/{document_id}/assets/{asset_id}
```

Use logical IDs. `source_path` is read-only metadata.

## State model

```text
closed -> opening -> loading -> ready
ready -> tab switched
ready -> not_found/forbidden
any -> closed
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

No `/files/*` host filesystem route.
No arbitrary path query.
No agentfs copy.
No file mutation.
No tree fetch without domain/document authorization.
No parallel “source truth” stored in client.

## Acceptance criteria

- Citation opens correct chunk.
- Member cannot fetch inaccessible doc asset.
- Logical tree does not reveal host paths beyond approved metadata.
- Close panel preserves calling screen state.
- Empty/missing source graceful.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/workspace_tree.py`; `app/schemas/workspace_tree.py`; `app/schemas/workspace_context.py`; `app/api/routes/documents.py`; `app/retrieval/`; `tests/test_workspace_context_service.py`; Local Studio `frontend/src/features/agent/ui/filesystem-panel.tsx`, `frontend/src/ui/right-detail-panel.tsx`, `copyable-path-chip.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
