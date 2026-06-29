# Architecture

## Frontend Shell

`webui/` is a Next.js app-router frontend. The first application route group is `src/app/(app)` and is wrapped by `features/navigation/AppShell`.

Flow:

```text
route/layout -> AppShell -> session API wrapper -> typed API client -> FastAPI
```

Current shell behavior:

- `/` redirects to `/chat`.
- `/chat`, `/documents`, `/graph`, `/operations`, and `/forbidden` render inside the app shell.
- `/database-visualize` redirects to `/graph` for compatibility with older frontend references.
- `AppShell` calls `GET /auth/me` through `features/auth/session.ts` and treats `CurrentUser.role` as display/navigation input only.
- `features/navigation/navigation.ts` is the canonical nav and settings-section configuration.
- Member navigation hides admin-only entries; backend routes must still enforce authorization.
- `SettingsDialog` owns only local open/section UI state and does not persist settings values.

State ownership remains backend-first for auth, roles, domains, documents, operations, retrieval evidence, and provider secrets. The frontend currently persists only the non-secret theme name.
