---
id: F-009
title: Frontend Delivery Implementation Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Implementation Plan

## Build Strategy

Build only P9 scope, prove it, update evidence, then stop. Do not pull later-phase UI, worker, AI, or runtime behavior forward unless this plan names it.

## Boundary Impacts

| Boundary | Impact |
| --- | --- |
| UI | Port old CE client structure from `.references/code/context-engine/client/` (shell, routes, documents PDF split, graph, chat two-column shell with tabbed context panel). Restyle with Local Studio tokens per `DESIGN.md`, `ce-client-port-and-parity.md`, and `context-panel-tabs.md`. |
| API/service | Implement only endpoints and services named by this feature. |
| Data | Frontend owns local UI state only. It does not persist product state or credentials. |
| Worker/runtime | Only included when named in scope; otherwise absent. |
| Security/privacy | Apply QA-002: no secrets, paths, raw payloads, prompts, source text, runtime URLs, or stack traces in public surfaces. |
| Observability | Add safe request IDs/logs now; P8 owns audit/tracing expansion unless this phase names specific events. |

## Implementation Sequence

- [ ] T-010 [frontend] Implement runtime foundation: env, API client, error normalization, tokens, tests.
  - Verification: unit tests and visual baseline.
- [ ] T-020 [frontend] Implement cookie login/logout/me and route guards.
  - Verification: browser storage/auth tests.
- [ ] T-030 [frontend] Port authenticated app shell from CE client: `AppPageFrame`, w-14 `AppSideRail`, Settings dialog entry, forbidden/loading/error states; restyle with LS tokens.
  - Verification: Playwright shell tests; nav order matches `ce-client-port-and-parity.md`.
- [ ] T-040 [frontend] Port Settings dialog panels from CE client; restyle with LS `SettingsLayout`; wire only after relevant OpenAPI fixtures exist.
  - Verification: admin/member and secret-status tests.
- [ ] T-050 [frontend] Port documents route (table + inline PDF preview panel + upload dialog) from CE client; wire P4/P5 source APIs.
  - Verification: state-machine, upload, and preview-panel layout tests.
- [ ] T-060 [frontend] Port chat two-column shell with ContextPanelShell (v1 `context` tab) and SSE slices from CE client; wire direct LLM and domain RAG P7 contracts per `context-panel-tabs.md`.
  - Verification: SSE fixture/cancel tests; context tab receives domain evidence before answer tokens; direct LLM renders with no evidence rows.
- [ ] T-070 [frontend] Port graph workspace from CE client (`/database-visualize`); implement source-nav/audit when contracts captured.
  - Verification: contract and visual tests.

## Migration And Rollback

- Schema change: none.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
