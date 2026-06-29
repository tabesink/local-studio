# 27 — Local Studio Desktop, CLI, Remote Controller

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio supports Electron desktop, Bun CLI, remote controller URLs, and controller API used by frontend/CLI/desktop.

## Context Engine now

Context Engine target is browser Next.js + FastAPI. It may run on LAN. No desktop/CLI product requirement in current slices.

## UI/UX transfer

Reuse: clear controller/service status language, remote connection status visual pattern, compact diagnostics.

Do not reuse: Electron bridge, desktop process privileges, CLI/TUI.


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


## Compatibility seam now

FastAPI OpenAPI + versioned API supports future CLI naturally. Do not build CLI now.

## FUTURE ONLY — build gate

Trigger: real operator workflow needs headless/admin automation.

Then add API-first CLI in separate repo/module. Use FastAPI existing contract. No frontend API workaround.

## Security boundary

Remote controller config changes network trust. Keep API HTTPS/auth/role policy. Electron/CLI gets separate threat model.

## Do not build now

```text
No placeholder route.
No placeholder model/table.
No empty feature folder.
No generic plugin/agent adapter.
No Local Studio runtime import.
No navigation item.
```

## Decision checklist

| Question | Required answer before implementation |
|---|---|
| User problem | Exact user workflow. |
| Owner | FastAPI service/runtime owner. |
| Scope | Domain, tenant, workspace, or global. |
| Permission | Role/capability rule. |
| Data | New model vs current model. |
| Security | Threats, isolation, audit. |
| Stream | Exact typed events or none. |
| Operations | Timeout, retry, cancel, retention. |
| Tests | API, security, integration, UI. |


## Source evidence

Local Studio `README.md`; `frontend/README.md`; `cli/README.md`; `desktop/`; `frontend/src/lib/backend-config.ts`; Context Engine `README.md`, `app/main.py`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
