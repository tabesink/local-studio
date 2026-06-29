# FE-002 App Shell, Side Navigation, Settings Entry

## Status

DONE (2026-06-29), validation blocked by local package binary permissions.

## Behavior Added

- Added the authenticated app route group under `webui/src/app/(app)`.
- Root `/` redirects to `/chat`.
- Added shell placeholder pages for Chat, Documents, Knowledge Graph, Operations, and Forbidden.
- Kept `/database-visualize` as a compatibility redirect to `/graph`.
- Added `AppShell` with session loading, unauthenticated redirect, error shell, role-aware forbidden rendering, and a reserved main work canvas.
- Added Local Studio-style `SideRail` with dense rows, quiet active state, collapse control, theme toggle, and Settings entry.
- Added empty accessible Settings dialog with member/admin section filtering, Escape/overlay close via Radix Dialog, and opener focus restore.

## Interfaces Changed

- `GET /auth/me` is consumed through `features/auth/session.ts` and normalized to:

```ts
type CurrentUser = {
  id: string
  email: string
  displayName?: string | null
  role: "member" | "admin"
  isActive: boolean
}
```

- Navigation and settings visibility are centralized in `features/navigation/navigation.ts`.
- Browser storage remains limited to `context-engine-theme`.

## Tests Added

- Vitest coverage for session normalization and navigation/settings role filtering.
- Playwright coverage for member/admin shell nav, forbidden direct member access to `/operations`, settings keyboard close/focus restore, and dark/light shell smoke.

## Validation

Attempted on 2026-06-29:

```bash
cd webui
npm run lint
npm run test
npm run test:e2e
```

The commands failed before assertions because local package binaries were unavailable/non-executable:

```text
sh: 1: tsc: Permission denied
sh: 1: vitest: Permission denied
sh: 1: playwright: Permission denied
```

`webui/node_modules/.bin` is absent, so the workspace needs dependencies restored before validation can complete.

## Follow-On Assumptions

- Backend remains the authority for auth, roles, domains, admin operations, and forbidden responses.
- `/auth/me` is the initial session endpoint; future `/api/v1/session/me` can be adopted at the API boundary without changing shell components.
- Real login/logout, domain selector, data panels, settings panels, and the right inspector remain later slices.
