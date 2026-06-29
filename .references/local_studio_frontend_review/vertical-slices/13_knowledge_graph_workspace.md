# 13 — Knowledge Graph Workspace

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Preserve graph capability. Give graph canvas same workstation frame. Node detail links back to evidence.

## Entry points

Domain -> Graph. Label/filter control. Node click. Evidence/document drill-in.

## Evidence and target

**OBSERVED:** Context Engine has graph route/schema/client feature/components and LightRAG graph mapper tests.

**TARGET:** Graph stays Context Engine-specific. Reuse Local Studio work-canvas, toolbar, tabs, inspector, status grammar only.

## User flow

1. User opens graph for domain.
2. Client requests bounded graph payload.
3. Canvas renders nodes/edges.
4. User filters labels/searches/selects node.
5. Right panel loads node detail.
6. Evidence/source link opens document/chunk detail.
7. User returns to canvas without navigation loss.


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
| Graph data | FastAPI/LightRAG mapper | Canonical graph response. |
| Domain authorization | FastAPI | Required every request. |
| Camera/selection | Graph feature | Local UI state. |
| Detail panel | Graph feature | Local. |
| Source link | Document/evidence API | Server authorized. |

## Target API boundary

```http
GET /api/v1/domains/{domain_id}/graph?label=&node_id=&depth=&limit=
GET /api/v1/domains/{domain_id}/graph/labels
GET /api/v1/domains/{domain_id}/graph/nodes/{node_id}
```

Bound response. Do not return unbounded full graph by default.

## State model

```text
loading -> ready
ready -> filtered
ready -> node selected -> detail loading -> detail ready
ready -> graph unavailable
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

No Local Studio browser/canvas agent tool port.
No graph UI tied to one document only.
No unbounded graph fetch.
No graph node mutation UI now.
No custom graph color language outside status semantics.

## Acceptance criteria

- Authorized domain graph loads.
- Node selection opens inspector.
- Source link resolves to authorized evidence.
- Large graph uses server limit.
- Graph unavailable gives compact recovery state.
- Canvas shell screenshot tested.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/lightrag.py`; `app/schemas/lightrag_graph.py`; `client/src/features/graph/`; `client/src/components/graph/`; `client/src/app/database-visualize/`; `tests/test_lightrag_graph_mapper.py`; Local Studio `frontend/src/features/agent/ui/canvas-panel.tsx`, `frontend/src/ui/right-detail-panel.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
