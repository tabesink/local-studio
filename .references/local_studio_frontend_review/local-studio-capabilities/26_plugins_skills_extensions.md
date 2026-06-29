# 26 — Local Studio Plugins, Skills, Extensions

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio source includes plugins feature/routes and agent skills/extensions. These extend an agent runtime product.

## Context Engine now

Context Engine has no agent tool runtime. No plugin requirement.

## UI/UX transfer

Reuse: settings/list/detail UX only. No extension architecture copy.


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

None required now. Keep feature modules and typed contracts clean so future capability can add one bounded extension point.

## FUTURE ONLY — build gate

Trigger: one concrete extension has stable owner, permission, lifecycle, and contract.

First build that one extension directly. Extract plugin contract only after second real extension proves duplication.

## Security boundary

Plugins/skills execute or influence runtime. Need signing/trust, config scope, secret access rules, audit, update policy.

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

`frontend/src/features/plugins/`; `frontend/src/app/plugins/`; `frontend/src/features/agent/`; Local Studio `README.md`/frontend README agent skills/extensions descriptions.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
