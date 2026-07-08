---
id: F-009
title: Frontend Delivery Implementation Plan
status: in_progress
owner: Context Engine delivery team
last_reviewed: 2026-07-06
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

- [x] T-000 [docs] Confirm F-009 foundation gates are active before code.
  - Verification: implementation response lists specs read and gate decisions.
- [x] T-010 [frontend] Implement runtime foundation: env, OpenAPI snapshot/client strategy, API client, error normalization, storage allowlist, tokens, tests.
  - Verification: unit tests, static import/storage scans, typecheck, and production build pass; full visual baseline remains part of AC-008 before feature completion.
- [x] T-020 [frontend] Implement cookie login/logout/me and route guards.
  - Verification: cookie-native auth wrappers and storage scan pass; live backend browser auth flow remains pending.
- [x] T-030 [frontend] Port authenticated app shell from CE client: `AppPageFrame`, w-14 `AppSideRail`, Settings dialog entry, forbidden/loading/error states; restyle with LS tokens.
  - Verification: foundation route and nav-order tests pass; Playwright screenshot matrix remains pending.
- [ ] T-040 [frontend] Port Settings dialog panels from CE client; restyle with LS `SettingsLayout`; wire only after relevant OpenAPI fixtures exist.
  - Verification: admin/member and secret-status tests.
- [ ] T-050 [frontend] Port documents route (table + inline PDF preview panel + upload dialog) from CE client; wire P4/P5 source APIs.
  - Verification: state-machine, upload, and preview-panel layout tests.
- [ ] T-060 [frontend] Port chat two-column shell with ContextPanelShell (v1 `context` tab) and SSE slices from CE client; wire direct LLM and domain RAG P7 contracts per `context-panel-tabs.md`.
  - Verification: SSE fixture/cancel tests; context tab receives domain evidence before answer tokens; direct LLM renders with no evidence rows; Local Studio timeline/composer ergonomics are present without local-agent tools.
- [ ] T-070 [frontend] Port graph workspace from CE client (`/database-visualize`); implement source-nav/audit when contracts captured.
  - Verification: contract and visual tests.
- [ ] T-080 [frontend] Split Settings dialog by ownership: personal preferences, admin runtime/provider configuration, and reserved post-P9 node/workspace sections.
  - Verification: authz/visual tests show no raw controller URL/API key, host path, runtime port, or secret value in member/admin views.

## Slice Gates

- P9 foundation may implement `T-000` through `T-030` without additional API contract patches because it uses P1 auth/session and existing route shell contracts.
- Settings panels after the shell require captured OpenAPI fixtures for each P1-P8 endpoint they wire.
- Chat streaming UI requires EVT-001 raw transcript fixtures before `T-060`.
- Documents preview blob wiring, source-ref navigation, real graph data, F-010 Logs/Usage/node controls, and F-011 Wiki/Smart Composer writes require explicit API/data contract patches before implementation.

## Migration And Rollback

- Schema change: none.
- Fresh-upgrade migration test is required when schema changes.
- Rollback keeps additive schema where possible; destructive cleanup needs explicit compensation before merge.

## Risks

- Contract drift: update `specs/03-contracts/` before code.
- Security leakage: snapshot safe DTOs and logs.
- Overbuild: reject infrastructure and feature work listed in out-of-scope.
- Runtime unknowns: stop when a required fixture cannot be proven.
