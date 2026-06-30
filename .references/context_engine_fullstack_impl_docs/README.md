# Context Engine `v1` — Vertical-Slice Rebuild Package

**Review date:** 2026-06-29  
**Target:** `tabesink/context_engine`, branch `v1`  
**Audience:** junior devs, coding agents, tech leads rebuilding UI + API parity.

## Package use

1. Read `01_evidence_scope_limits.md`.
2. Read `02_architecture_boundaries.md`, `03_routes_screen_inventory.md`, `04_design_parity.md`.
3. Read API/data/security docs before wiring UI.
4. Start ordered slices in `08_rebuild_order.md`.
5. Open one slice file. Build only its scope. Run its tests. Stop.

## Package contents

| File | Use |
|---|---|
| `00_executive_summary.md` | Product, journeys, risks, target decisions |
| `01_evidence_scope_limits.md` | Static-review limits, confidence, evidence rules |
| `02_architecture_boundaries.md` | Current map + lean target composition |
| `03_routes_screen_inventory.md` | Route, shell, permissions, screen inventory |
| `04_design_parity.md` | UI visual/interaction parity spec |
| `05_api_contract_catalog.md` | Frontend-facing HTTP/SSE contract map |
| `06_data_model_ownership.md` | Canonical entities, status ownership |
| `07_security_auth.md` | Auth, roles, browser/API boundary |
| `08_rebuild_order.md` | Slice dependency order |
| `09_simplification_audit.md` | Keep/replace/defer decisions |
| `SLICE_INDEX.md` | Slice catalog |
| `slices/*.md` | One implementation brief per route/feature slice |
| `templates/vertical_slice_template.md` | Copy for new slices |
| `EVIDENCE.md` | Source-path evidence + static-review gaps |

## Rebuild decisions

- Keep FastAPI as API/domain truth. Keep frontend thin.
- Keep document lifecycle separate from operation lifecycle.
- Keep chat transport as typed SSE. No WebSocket.
- Split current global Settings dialog into feature panels. Keep one dialog coordinator.
- Replace browser `localStorage` bearer persistence before production. Prefer HttpOnly session cookie.
- Add real backend logout/session invalidation. Current client logout is local-only.
- Preserve LightRAG as retrieval provider; Context Engine owns chat synthesis/UI evidence.
- Do not build ACL expansion, token-delta streaming, offline mode, plugin framework, generic workflow engine, or broad global store now.

## Static-review boundary

Reviewed GitHub source paths, route code, schemas, docs, and client modules. Did **not** run `v1`, connect external providers, execute migrations, inspect live DB data, or verify responsive behavior in browser. Every runtime-dependent claim is marked **Unknown** or **Verify**.
