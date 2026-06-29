# 25 — Local Studio Usage, GPU Metrics, Logs

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio controller tracks GPU/system status, logs, downloads, usage, metrics, and SSE system events. Frontend exposes usage/logs routes/features.

## Context Engine now

Context Engine needs admin operations/audit and selected LLM/RAG observability. It does not need GPU dashboard unless it owns GPU runtime.

## UI/UX transfer

Reuse: dense table/filter/status/detail log UX. Reuse compact metrics presentation only for proven operational questions.


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

Operations/audit IDs and request IDs. Future Langfuse/trace integration can link turn/operation IDs.

## FUTURE ONLY — build gate

Trigger: needed operational question has owner and action.

Examples:

```text
LLM token/cost trace -> Langfuse-like observability.
Security/admin action -> native audit event.
LightRAG failure -> operation diagnostic.
Self-hosted GPU -> future runtime metrics.
```

## Security boundary

Logs often contain sensitive prompts/paths/errors. Redact. Role-gate. Set retention. Do not make browser log aggregation owner.

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

Local Studio `controller/src/modules/system/`; `shared/contracts/observability.ts`; `shared/contracts/usage.ts`; `frontend/src/features/usage/`; `frontend/src/features/logs/`; Context Engine `app/api/routes/admin.py`, `jobs.py`, `lightrag_admin.py`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
