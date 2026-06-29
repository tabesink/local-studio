# 03 — App Shell, Role Nav, Empty State, Settings Entry

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Create one Local Studio-style workstation shell. Preserve Context Engine routes. Show only allowed navigation.

## Entry points

Any signed-in route. Rail domain selector. Settings item. Admin item. Empty/no-domain state.

## Evidence and target

**OBSERVED:** Context Engine has app, layout, chat, graph, login, and settings client areas. Local Studio has `features/shell/`, page state primitives, and dense workstation navigation.

**TARGET:** Keep Context Engine route groups. Change shell grammar. Do not copy Local Studio agent route tree.

## User flow

1. Client loads `CurrentUser`.
2. Client loads accessible domains.
3. Rail renders Query, Library, Graph, Settings.
4. Admin group renders only for admin.
5. No domain -> central empty state.
6. Domain selected -> route preserves domain context.
7. Detail panel opens only for contextual detail.


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
| Current role | FastAPI | Client reads only. |
| Accessible domains | FastAPI | Domain list response. |
| Selected domain UI | Route/domain store | Not auth truth. |
| Rail collapse/theme | UI preferences | Non-secret local state. |
| Admin route access | FastAPI + route guard | Both. |

## Target API boundary

```http
GET /api/v1/session/me
GET /api/v1/domains
```

Response must list only domains user may read. Client must not fetch global domain list then hide rows.

## State model

```text
app boot
 -> session loading
 -> anonymous -> login
 -> member -> allowed shell
 -> admin -> allowed shell + admin nav

no domain -> choose/create state
domain selected -> domain route
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

No dashboard tile home.
No agent session nav.
No hard-coded role list.
No admin action hidden only by CSS.
No local domain permission cache treated as truth.

## Acceptance criteria

- Member sees no Admin nav.
- Member direct `/admin/*` gets redirect/forbidden.
- Server denies member admin request.
- Rail works collapsed/expanded.
- No-domain state gives one valid next action.
- Dark/light screenshots match parity contract.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`client/src/app/`; `client/src/components/layout/`; `client/src/stores/lightrag-domain-store.ts`; `app/api/routes/auth.py`; `app/api/routes/lightrag_admin.py`; Local Studio `frontend/src/features/shell/`, `frontend/src/ui/page.tsx`, `page-state.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
