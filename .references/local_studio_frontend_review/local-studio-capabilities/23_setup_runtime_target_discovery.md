# 23 — Local Studio Setup + Runtime Target Discovery

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio setup wizard chooses model directory, installs engine, downloads model, launches, benchmarks. Settings shows controller runtime targets discovered for vLLM/SGLang/llama.cpp/MLX.

## Context Engine now

Context Engine setup is deployment/admin configuration: DB/Redis/LightRAG/provider credentials. No hardware/engine wizard.

## UI/UX transfer

Reuse: sequential setup/wizard progress pattern only when Context Engine has real multi-step setup. Reuse status, validation, retry rows.


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

Current `/health`, provider status, domain lifecycle can expose diagnostics. No runtime target discovery model now.

## FUTURE ONLY — build gate

Trigger: Context Engine owns a managed inference runtime.

Then define explicit setup state machine. Do not reuse Local Studio wizard data fields blindly.

## Security boundary

Target discovery may reveal host paths/binaries/GPU layout. Restrict to admin; redact sensitive details.

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

Local Studio `README.md`; `frontend/README.md`; `frontend/src/features/setup/`; `frontend/src/features/settings/engines-section.tsx`; `controller/src/modules/engines/`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
