# 07 — Settings: Model Provider

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Admin configures provider credentials/profile/default synthesis model. Secret stays server-side.

## Entry points

Admin Settings -> Providers. Add/update provider. Define model profile. Test profile.

## Evidence and target

**OBSERVED:** Context Engine has AI settings route/schema/tests, provider secret tests, model profile resolver tests.

**TARGET:** Local Studio settings-row UX. Context Engine provider ownership stays FastAPI. Local Studio controller model-runtime UX is reference only.

## User flow

1. Admin opens Providers.
2. Client loads safe provider summary + profiles.
3. Admin creates/updates config.
4. Secret posts once.
5. Server encrypts/stores secret.
6. API returns masked/configured state only.
7. Admin selects active LLM profile.
8. Server validates; client refreshes.


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
| Provider secret | FastAPI secure store | Write-only. Never read back. |
| Model profile | FastAPI settings service | Canonical. |
| Active synthesis profile | FastAPI global setting | Resolve once per turn. |
| UI selection/open row | Providers feature | Local. |

## Target API boundary

```http
GET   /api/v1/admin/providers
POST  /api/v1/admin/providers
PATCH /api/v1/admin/providers/{provider_id}
POST  /api/v1/admin/providers/{provider_id}/test
GET   /api/v1/admin/model-profiles
PATCH /api/v1/admin/synthesis-profile
```

Safe summary: `configured`, `health`, `profile IDs`, `model name`. No secret string.

## State model

```text
unconfigured -> configured -> testing -> ready
configured -> testing -> failed
ready -> degraded
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

No provider keys in browser storage.
No generic provider plugin system.
No Local Studio inference runtime/engine launch.
No per-question client model override if global profile rule remains.
No duplicate active-profile source.

## Acceptance criteria

- Provider secret never appears in GET.
- Admin only.
- Model profile resolver tests pass.
- Invalid provider config gets typed error.
- Active profile required guard works in chat submit path.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/ai_settings.py`; `app/schemas/ai_settings.py`; `tests/test_ai_settings_api.py`; `tests/test_ai_provider_secrets.py`; `tests/test_model_profile_resolver.py`; Local Studio `frontend/src/features/settings/`, `ui/form-field.tsx`, `status.tsx`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
