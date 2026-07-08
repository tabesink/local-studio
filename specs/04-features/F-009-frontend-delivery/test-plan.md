---
id: F-009
title: Frontend Delivery Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008]
supersedes: []
---


# F-009 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | no browser token storage |
| AC-002 | automated or explicit manual | 401 clears auth once |
| AC-003 | automated or explicit manual | 403 forbidden without redirect loop |
| AC-004 | automated or explicit manual | member cannot see/call admin controls |
| AC-005 | automated or explicit manual | SSE ordering fixtures pass |
| AC-006 | automated or explicit manual | no secret/path/raw payload in client errors/logs |
| AC-007 | automated or explicit manual | Playwright desktop/mobile key flows |
| AC-008 | automated or explicit manual | visual checks at 1440x900, 1280x800, and narrow viewport dark/light |
| AC-009 | automated or explicit manual | shell nav order and routes match ce-client-port-and-parity.md |
| AC-010 | automated or explicit manual | chat ContextPanelShell tab registry; context tab shows SSE evidence before answer tokens |
| AC-011 | automated or explicit manual | direct LLM chat turn renders without evidence rows/citations and without exposing route/model/tool controls |
| AC-012 | automated or explicit manual | Local Studio chat timeline/composer/streaming UX is adapted without terminal/filesystem/Git/browser-agent/Pi/model-controller/local-path controls |
| AC-013 | automated or explicit manual | settings ownership split hides raw controller URLs/API keys, host paths, runtime ports, and secrets from browser/member views |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Foundation Checks

- OpenAPI/client strategy: `tests/snapshots/f008_openapi.json` is the frozen P1-P8 snapshot for T-010; feature wrappers must use captured `/api/v1` routes only.
- API client: direct `fetch` is isolated to the shared API/SSE foundation; feature modules use wrappers.
- API errors: normalized client errors expose only safe `code`, `message`, `requestId`, and optional safe fields.
- Auth: `POST /auth/login`, `GET /auth/me`, and `POST /auth/logout` use the HttpOnly `ce_session` cookie; no token is stored or returned to UI state.
- Browser storage scan: only `ce.theme`, `ce.density`, `ce.railCollapsed`, `ce.panelWidths`, and `ce.lastRouteGroup` may be persisted.
- Import scan: frontend code must not import or reference LightRAG, Docker/controller clients, provider SDKs, Langfuse, filesystem/process modules, storage targets, runtime targets, host paths, runtime ports, controller targets, or secret values.
- Shell route proof: `/`, `/login`, `/chat`, `/documents`, `/database-visualize`, and `/forbidden` exist; authenticated shell nav order is Chat -> Documents -> Knowledge graph -> Settings -> Logout.
- Settings shell proof: Settings opens as a dialog/overlay entry from the rail; working panels beyond personal shell remain gated by captured fixtures.
- Visual baseline: foundation surfaces use Local Studio token names, compact rail geometry, dark-first `zai-dark`, and do not use old CE white-canvas styling.

## Later-Slice Gates

- Streaming UI requires captured EVT-001 transcript fixtures before chat assertions.
- Documents preview blob fetch, source-ref navigation, real graph data, Logs/Usage/node controls, and Wiki/Smart Composer writes stay blocked until their API/data contracts exist.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.
