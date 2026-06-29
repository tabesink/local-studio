# Implementation

## Implemented Scope

### FE-001 Runtime Foundation

`webui/` contains the initial Next.js app-router foundation with:

- Tailwind 4 and Local Studio-compatible theme token files.
- Default `zai-dark` and equivalent `zai-light` theme selectors.
- Geist and Geist Mono font wiring.
- A client theme provider that persists only the non-secret theme name.
- Typed public env parsing for `NEXT_PUBLIC_API_BASE_URL`.
- A typed API client that sends cookies with `credentials: "include"` and normalizes JSON, non-JSON, network, abort, and parse failures.
- Root loading, error, not-found, and foundation smoke surfaces.
- Vitest and Playwright smoke test scaffolding.

### FE-002 App Shell, Navigation, Settings Entry

`webui/` now includes the first authenticated application shell:

- Root `/` redirects to `/chat`.
- Authenticated route group provides `/chat`, `/documents`, `/graph`, `/operations`, and shell-preserved `/forbidden` placeholder pages.
- `/database-visualize` remains as a compatibility redirect to `/graph`.
- `AppShell` resolves `GET /auth/me` through the typed API client, renders loading/error/unauthenticated shell states, and redirects 401 responses to `/login`.
- `SideRail` owns the Local Studio-style dense navigation rail with role-filtered nav items, active route state, rail collapse, settings entry, and theme control, and a shell-level toast host.
- `SettingsDialog` is an accessible empty Radix dialog with member/admin section filtering and opener focus restore.
- Member users see Chat, Documents, Knowledge Graph, and Settings. Admin users also see Operations and admin settings sections.
- Direct member access to `/operations` renders the forbidden state inside the shell; backend authorization remains required for every protected API.

## Backlog

- Real login form and logout/session invalidation.
- Domain selector and accessible-domain API integration.
- Feature endpoints, documents, chat, graph, operations data, and settings panels.
- Right inspector content for evidence, documents, operations, graph nodes, and logs.
