# 22 — Local Studio Model Runtime, Recipes, Downloads

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio controller launches/evicts runtime recipes, discovers targets, downloads models, proxies inference. It supports vLLM, SGLang, llama.cpp, MLX.

## Context Engine now

Context Engine owns provider profiles and per-domain LightRAG runtime lifecycle. It does not own arbitrary model engine launch/download.

## UI/UX transfer

Reuse: status table, detail panel, start/stop confirmation, compact recipe/config rows.

Do not reuse: engine install, model download, GPU engine discovery, recipe DSL.


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

Provider profile and domain lifecycle contracts stay separate. Future self-hosted inference requires new owned capability, not overload provider settings.

## FUTURE ONLY — build gate

Trigger: Context Engine must run/manage self-hosted models.

First build separately:

```text
InferenceRuntime
RuntimeRecipe
ModelArtifact
RuntimeTarget
security + capacity policy
GPU resource ownership
health/usage metrics
```

Do not graft Local Studio controller into FastAPI.

## Security boundary

Runtime launch can execute binaries, allocate GPU, download code/model files. Treat as admin-only infrastructure feature.

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

Local Studio `controller/README.md`; `controller/src/modules/engines/`; `controller/src/modules/models/`; `shared/contracts/recipes.ts`; `frontend/src/features/recipes/`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
