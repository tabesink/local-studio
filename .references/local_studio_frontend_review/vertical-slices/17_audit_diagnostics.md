# 17 — Audit + Diagnostics

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Record security/admin events. Inspect safe diagnostics. Keep LLM observability separate from audit truth.

## Entry points

Admin action. Login/role change/provider update/lifecycle command. Admin -> Operations/Audit. Health/support diagnosis.

## Evidence and target

**OBSERVED:** Context Engine includes admin/auth/provider/deploy paths and many operational tests. Earlier review found audit-log concept in Postgres. Local Studio controller owns logs, usage, metrics, and SSE system state.

**TARGET:** Keep small native audit log for security/admin truth. Use provider/LLM observability separately when added. Do not make Local Studio metrics controller part of Context Engine.

## User flow

1. User performs security/admin action.
2. FastAPI authorizes action.
3. Service writes audit event.
4. Service writes operation record when long-running.
5. UI requests redacted list/detail.
6. Admin filters by actor/type/target/date.
7. Diagnostics link points to safe detail/log context.


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
| Audit record | FastAPI persistence | Server writes. Append-only intent. |
| Request ID | API middleware | Correlates safe support detail. |
| Operation diagnostics | Service/worker | Redact before response. |
| LLM trace/cost | Future observability integration | Not audit replacement. |
| UI filters/panel | Admin feature | Read-only view state. |

## Target API boundary

```http
GET /api/v1/admin/audit-events?cursor=&actor_id=&event=&target_id=
GET /api/v1/admin/audit-events/{audit_id}
GET /api/v1/admin/diagnostics/{request_id}
```

Add only after current audit table/service route confirmed. Keep exact models narrow.

## State model

```text
action accepted -> audit event written
long action -> audit event + operation pending -> operation terminal
read request -> authorized -> redacted detail
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

No client-created audit events.
No raw credential values.
No provider prompt/response transcript in audit record by default.
No full exception trace in UI.
No monitoring system treated as authorization/audit database.
No member audit console.

## Acceptance criteria

- Role/provider/lifecycle action creates audit record.
- Member cannot access audit.
- Secret redaction test.
- Request ID links safe diagnostics.
- Operation + audit correlation.
- Date/filter pagination works.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/admin.py`; `app/api/routes/auth.py`; `app/api/routes/ai_settings.py`; `app/api/routes/lightrag_admin.py`; `app/core/`; `tests/test_ai_provider_secrets.py`; Local Studio `controller/src/modules/system/`, `shared/contracts/observability.ts`, `shared/contracts/usage.ts`, `frontend/src/features/logs/`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
