# 05 — Settings: Users

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin manages users. Members see no user-management UI. FastAPI enforces all mutations.

## Entry points

Admin Settings -> Users. Create/edit role/disable user actions if current product supports them.

## Evidence and target

**OBSERVED:** Context Engine has `users.py` route and `users.py` schema. Client has settings/users route folder.

**TARGET:** Dense Local Studio-style table + right detail panel. Do not create a people dashboard.

## User flow

1. Admin opens Users.
2. Client lists paginated users.
3. Admin selects row.
4. Detail panel shows safe metadata.
5. Admin creates/changes allowed user state.
6. Server writes audit operation.
7. Client refreshes confirmed row.


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
| User identity/role | FastAPI | Canonical. |
| Password/secrets | Auth service | Never list API. |
| Selected row | Users feature | Local. |
| Audit event | FastAPI operation/audit service | Server-created. |

## Target API boundary

```http
GET    /api/v1/admin/users?cursor=&limit=
POST   /api/v1/admin/users
GET    /api/v1/admin/users/{user_id}
PATCH  /api/v1/admin/users/{user_id}
```

Expose: `id`, `email`, `role`, `is_active`, timestamps. Never expose password hash, reset token, session data.

## State model

```text
active -> disabled
disabled -> active
member -> admin
admin -> member
```

Role change may need self-lockout rule. Decide explicitly before build.


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

No client role mutation without API.
No delete-user default. Prefer disable if product allows.
No user cards.
No user list for members.
No auth secret field in detail panel.

## Acceptance criteria

- Member cannot list/mutate users.
- Admin list paginates.
- Admin role change audited.
- Self-lockout behavior tested.
- Secrets absent in API response.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/users.py`; `app/schemas/users.py`; `client/src/app/settings/users/`; Local Studio `frontend/src/ui/table.tsx`, `right-detail-panel.tsx`, `modal.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
