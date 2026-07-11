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
| UI | Adopt the Local Studio shell and slice architecture from `.reference-LS-frontend` (navigation-sidebar, chat-shell, settings-panel, logs-observability, user-preferences) and port CE structure for documents/graph only, per the amended `ce-client-port-and-parity.md`. Restyle with Local Studio tokens per `DESIGN.md`. |
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
- [x] T-030 [frontend] Authenticated app shell. Superseded 2026-07-08: the compact `AppSideRail`/`AppPageFrame` port was replaced by the LS `navigation-sidebar` shell (`features/navigation-sidebar`, `components/layout/AppShell.tsx`) per amended spec/parity docs; forbidden/loading/error states retained.
  - Verification: foundation route and sidebar nav-registry tests pass; Playwright screenshot matrix remains pending.
- [x] T-040 [frontend] Settings as LS full-page `/settings` (`features/settings-panel` + `features/user-preferences`): General preferences, Model Provider (runtime-settings), Domains, Users; admin sections role-gated; F-010 sections absent.
  - Verification: typecheck/build pass; write-only credentials; admin/member browser-authz proof pending.
- [x] T-050 [frontend] Documents route (`features/documents`): admin library table + upload + source retry/cancel/delete ops; inline preview panel present but disabled pending safe preview contract.
  - Verification: typecheck/build pass; smoke against live API (sources list 200); preview blob remains gated.
- [x] T-060 [frontend] Chat via LS `chat-shell` slice (`features/chat-shell`): CE adapter maps conversations + EVT-001 stage/token/evidence/done/error to LS timeline blocks; composer refs (F-012) via mention picker; no local-agent tools; abort disabled (no contract).
  - Verification: `tests/chat.test.mjs` passes (adapter isolation, EVT-001 translation, forbidden-controls scan); raw transcript fixture replay still pending.
- [x] T-070 [frontend] Graph route shell at `/database-visualize` (`features/graph`): domain selector + canvas-unavailable state; real graph data remains contract-gated.
  - Verification: route renders; contract/visual tests pending graph DTOs.
- [x] T-080 [frontend] Settings ownership split shipped with T-040: personal (browser-local prefs) vs administration (provider/domains/users) sections; reserved node/workspace sections absent.
  - Verification: no raw controller URL/API key, host path, runtime port, or secret value rendered; storage allowlist scan passes.

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
