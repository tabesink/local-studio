# 24 — Local Studio Proxy, OpenAI Compatibility, Audio

> **Status:** Local Studio reference feature. Separate from current Context Engine scope.
> **Decision:** Read when feature becomes approved. Do not turn this document into scaffolding.

## OBSERVED — Local Studio

Local Studio controller proxies OpenAI-compatible model/chat/audio/tokenization requests. Frontend API routes bridge UI to controller.

## Context Engine now

Context Engine uses configured providers for embeddings/synthesis. Backend must hold credentials. Chat target is RAG SSE, not generic OpenAI proxy.

## UI/UX transfer

Reuse: provider health/status UX and API error normalization.

Do not reuse: general OpenAI proxy route, audio surface, tokenization gateway until real product need.


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

Provider profile interface names model/provider config. It does not become arbitrary client-to-provider pass-through.

## FUTURE ONLY — build gate

Trigger: Context Engine product needs a controlled provider gateway or audio feature.

Then define separate capability, quotas, auth, audit, contract. Do not expose provider secret or unrestricted model API to browser.

## Security boundary

Generic proxy can become billable/unrestricted inference endpoint. Require auth, tenant limits, model allowlist, observability.

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

Local Studio `controller/README.md`; `controller/src/modules/proxy/`; `controller/src/modules/audio/`; `frontend/src/app/api/proxy/`; `frontend/src/app/api/voice/`; `shared/contracts/usage.ts`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
