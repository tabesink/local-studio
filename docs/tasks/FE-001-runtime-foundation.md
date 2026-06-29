# FE-001 Runtime Foundation

## Result

Created `webui/` as the frontend foundation for Context Engine. The app boots through the Next.js app router, uses Local Studio-compatible `zai-dark` and `zai-light` tokens, defaults to dark mode, and persists only the non-secret theme name.

## Interfaces Added

- `NEXT_PUBLIC_API_BASE_URL` is parsed through `src/lib/config/env.ts`.
- `createApiClient()` in `src/lib/api/client.ts` owns browser API calls and always sends `credentials: "include"`.
- API failures normalize through `ApiError` with `http`, `network`, `abort`, `parse`, and `unknown` kinds.
- `healthResponseSchema` defines the optional public health probe shape.

## Tests Added

- Env parser tests cover missing, invalid, and valid public API URLs.
- API client tests cover credentials, JSON success, non-JSON HTTP failure, network failure, abort failure, and invalid JSON.
- Token smoke tests assert dark/light selectors and required aliases.
- Playwright smoke tests cover dark default and persisted light theme rendering.

## Validation

Attempted from `webui/`:

- `npm run lint` reached `tsc --noEmit` but failed with `tsc: Permission denied`.
- `npm run test` reached `vitest run` but failed with `vitest: Permission denied`.
- `npm run test:e2e` reached `playwright test` but failed with `playwright: Permission denied`.
- Static scan found no component-owned raw backend URLs and only the non-secret theme preference in browser storage.

## Assumptions

- Package versions follow `IMPLEMENTATION_MAP.md`, verified there on 2026-06-29.
- FE-001 does not implement login, session persistence, feature routes, or backend endpoints.
- `npm install` is required before running checks in a fresh clone.
