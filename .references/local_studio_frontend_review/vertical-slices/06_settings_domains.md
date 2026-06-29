# 06 — Settings: Domains

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin configures Context Engine RAG domains. Domain is access/retrieval scope. Not Local Studio model runtime.

## Entry points

Admin Settings -> Domains. Create domain. Inspect config. Start/stop/delete route action links.

## Evidence and target

**OBSERVED:** Context Engine has LightRAG admin/domain routes and a client domain store. LightRAG domain embedding lock tests exist.

**TARGET:** Domain list/table with compact lifecycle status. Detail panel explains embedding lock, document count, runtime state.

## User flow

1. Admin opens Domains.
2. Client loads domains.
3. Admin creates domain with allowed initial config.
4. Server persists record + deployment manifest.
5. Admin starts/stops lifecycle.
6. Server creates operation.
7. Client polls/refetches operation/domain state.
8. Delete requires explicit confirmation.


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
| Domain record | FastAPI/Postgres | Canonical. |
| Runtime manifest/compose | Deploy service | Derived from domain config. |
| Embedding lock | FastAPI domain rule | Never client toggle after creation. |
| Selected domain | Client route state | Cannot bypass access rule. |

## Target API boundary

```http
GET    /api/v1/admin/domains
POST   /api/v1/admin/domains
GET    /api/v1/admin/domains/{domain_id}
PATCH  /api/v1/admin/domains/{domain_id}
```

Lifecycle commands belong in slice 14. Keep create/update contract separate from process lifecycle.

## State model

```text
creating -> created
created -> starting -> ready
ready -> stopping -> stopped
any -> failed
any non-deleting -> deleting -> deleted
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

No large domain cards.
No editable embedding model after lock.
No member domain admin UI.
No Local Studio recipe/model lifecycle vocabulary.
No client-generated lifecycle state.

## Acceptance criteria

- Admin creates domain.
- Embedding setting locks.
- Member cannot access admin domain list.
- Delete needs confirm then server success.
- UI status matches API enum.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/lightrag_admin.py`; `app/lightrag_deploy/`; `tests/test_lightrag_domain_embedding_lock.py`; `client/src/stores/lightrag-domain-store.ts`; Local Studio `frontend/src/ui/list.tsx`, `status.tsx`, `right-detail-panel.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
