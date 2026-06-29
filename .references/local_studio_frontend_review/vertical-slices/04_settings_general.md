# 04 — Settings: General

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Make personal/general settings compact, safe, separate from admin system settings.

## Entry points

Settings nav -> General. Theme/appearance. Personal non-secret preferences.

## Evidence and target

**OBSERVED:** Context Engine has settings client state/dialog stores. Local Studio has settings feature and compact settings primitives.

**TARGET:** General settings hold only user-owned preferences. Provider, users, domains, parser stay separate admin slices.

## User flow

1. User opens Settings.
2. General sub-nav selected.
3. UI loads safe preference record.
4. User changes theme/compact preference where retained.
5. Client sends patch.
6. Server confirms.
7. UI updates without full route reload.


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
| Theme display | UI preference store | May mirror user setting. No secret. |
| Persisted user preference | FastAPI | User-scoped record. |
| System/provider setting | Admin service | Not General. |
| Shell density | UI token system | Avoid arbitrary per-user CSS. |

## Target API boundary

```http
GET   /api/v1/settings/general
PATCH /api/v1/settings/general
```

Keep model small:

```ts
type GeneralSettings = { theme: "zai-dark" | "zai-light" | "system" };
```

Add field only after user-visible need.

## State model

```text
idle -> loading -> ready
ready -> saving -> ready
saving -> failed -> ready
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

No provider key.
No global model selection.
No runtime lifecycle setting.
No generic settings key/value table.
No per-user design token editor.

## Acceptance criteria

- Member can read/update own allowed settings.
- Invalid enum returns typed validation error.
- Theme applies after save/reload if persistence chosen.
- No admin setting leaks into response.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`client/src/app/settings/`; `client/src/stores/settings.ts`; `client/src/stores/settings-dialog-store.ts`; Local Studio `frontend/src/features/settings/`, `frontend/src/ui/settings.tsx`, `segmented-control.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
