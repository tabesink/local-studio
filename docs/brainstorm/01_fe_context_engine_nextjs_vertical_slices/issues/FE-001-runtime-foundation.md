# FE-001 Runtime Foundation

## Outcome

`webui/` boots as a Next.js app with current stable packages, Local Studio token foundations, dark/light themes, one API boundary, and a minimal test harness.

## Prerequisites

- Read `../prd.md`.
- Read `../IMPLEMENTATION_MAP.md`.
- Read `DESIGN.md`.
- Read `docs/design/context_engine_agent_ui_guidelines.md`.
- Check `.references/code/local-studio/frontend/src/app/styles/globals/tokens.css` before writing theme tokens.

## Scope

- Create `webui/`.
- Use package versions from `../IMPLEMENTATION_MAP.md`, reverified if implementation date is after 2026-06-29.
- Add Next.js app router structure.
- Add Tailwind 4 setup.
- Add Geist/Geist Mono font wiring.
- Add `zai-dark` and `zai-light` tokens.
- Add theme provider/toggle plumbing, with dark default.
- Add typed public env parsing.
- Add API client/error normalization.
- Add root loading/error/not-found surfaces.
- Add test setup for unit/component and Playwright smoke.

## Out Of Scope

- Login form behavior.
- Real session persistence.
- Feature endpoints.
- Documents, chat, graph, settings panels, operations.
- React Query/global cache unless a later issue proves it is needed.

## Required Files

Recommended:

```text
webui/src/app/layout.tsx
webui/src/app/providers.tsx
webui/src/styles/tokens.css
webui/src/styles/globals.css
webui/src/lib/config/env.ts
webui/src/lib/api/client.ts
webui/src/lib/api/errors.ts
webui/src/lib/api/contracts.ts
webui/src/lib/theme/themes.ts
webui/src/components/shared/AppErrorState.tsx
webui/src/components/shared/LoadingState.tsx
```

## API Contract

No feature endpoint is required.

Optional health probe:

```http
GET /health
```

Health response must be treated as public and secret-free.

## Theme Acceptance

- `html[data-theme="zai-dark"]` and `html[data-theme="zai-light"]` both define the required `--ui-*` and compatibility tokens.
- Dark is the initial/default theme.
- Theme preference persistence stores only a non-secret string.
- Button/input/dialog/status surfaces remain legible in both themes.

## Tests

- Env parser rejects missing/invalid public API URL with a safe message.
- API client sends `credentials: "include"`.
- API client normalizes JSON, non-JSON, network, and abort failures.
- Token smoke test verifies dark and light theme selectors exist.
- Playwright renders root shell/loading surface in dark and light without overlap.

## Acceptance Criteria

- `npm run dev` starts from `webui/`.
- `npm run lint`, `npm run test`, and `npm run test:e2e` commands are documented, even if e2e starts as a smoke.
- No raw backend URLs appear in components.
- No credentials are stored in browser storage.
- No feature screen is built before FE-002.

