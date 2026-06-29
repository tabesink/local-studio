# FE-002 App Shell, Side Navigation, Settings Entry

## Outcome

Authenticated users see the Context Engine main app layout and navigation side panel, structurally matching the existing app intent while using Local Studio UI/UX.

## Prerequisites

- FE-001 is complete.
- Read `../API_BACKEND_CONNECTIONS.md`.
- Read `.references/context_engine_frontend_review/slices/03_app_shell_role_nav_empty_settings.md`.
- Read `.references/local_studio_frontend_review/vertical-slices/03_app_shell_role_nav_empty_settings.md`.
- Inspect Local Studio shell references before implementing:
  - `.references/code/local-studio/frontend/src/features/shell/`
  - `.references/code/local-studio/frontend/src/ui/page.tsx`
  - `.references/code/local-studio/frontend/src/ui/page-state.tsx`

## Scope

- Add authenticated app route group.
- Add `AppShell`.
- Add `SideRail`.
- Add canonical navigation config.
- Add placeholder pages for Chat, Documents, Graph, Operations, and Forbidden.
- Add Settings trigger and empty accessible Settings dialog.
- Add theme toggle/control in a Local Studio-compatible location.
- Add role-aware nav filtering from a typed `CurrentUser`.
- Preserve backend authority: hidden admin UI is not security.

## Out Of Scope

- Real login form.
- Real settings panels.
- Real document/chat/graph/operation data.
- Domain lifecycle actions.
- Uploads.
- SSE.
- Right inspector content beyond reserved layout support.

## Routes

```text
/(app)/chat
/(app)/documents
/(app)/graph
/(app)/operations
/forbidden
```

Compatibility note: older references mention `/database-visualize`. Keep a redirect or alias decision documented before removing compatibility.

## Navigation

| Item | Route | Icon guidance | Role |
| --- | --- | --- | --- |
| Chat | `/chat` | `MessageSquare` or closest Local Studio reference | member/admin |
| Documents | `/documents` | `Files` or `Library` | member/admin |
| Knowledge Graph | `/graph` | `Network` | member/admin, verify backend |
| Operations | `/operations` | `Activity` | admin |
| Settings | dialog | `Settings` | member/admin |

Admin-only sections inside Settings are hidden for members.

## API Contract

Initial fixture can be used only behind the same shape expected from the backend:

```ts
type CurrentUser = {
  id: string
  email: string
  displayName?: string | null
  role: "member" | "admin"
  isActive: boolean
}
```

Target endpoint:

```http
GET /auth/me
```

Future or normalized endpoint:

```http
GET /api/v1/session/me
```

401 behavior: redirect to login when login exists.

403 behavior: preserve route and render forbidden state.

## UI Requirements

- Left rail is compact and dense: collapsed `48px`, expanded `224px`.
- Active item uses quiet selected state, not bright color fill.
- Icon-only controls have labels/tooltips.
- Keyboard focus is visible.
- Settings dialog has accessible title/description, focus trap, Escape close, overlay close, and opener focus restore.
- Loading, error, forbidden, and placeholder pages preserve shell geometry.
- Dark and light theme screenshots must both pass visual smoke.

## Backend/Data Handoff Notes

- Backend must provide user role and active status.
- Backend must reject admin API requests for members even if UI hides links.
- Backend must eventually provide accessible domains so the shell can show a domain/context selector.
- Frontend must not cache role/domain permissions as security truth.

## Tests

- Member sees Chat, Documents, Graph, Settings; does not see Operations/admin settings sections.
- Admin sees base nav plus Operations/admin settings sections.
- Active nav follows pathname.
- Direct forbidden route renders with preserved shell.
- Settings opens from keyboard and returns focus on close.
- Theme toggle changes between `zai-dark` and `zai-light` without layout overlap.
- No test writes tokens or credentials to browser storage.

## Acceptance Criteria

- The first screen is the app shell, not a marketing page.
- Shell visually follows Local Studio density, typography, surfaces, borders, and interaction states.
- Both dark and light themes are complete enough for shell use.
- API connection expectations are documented where backend work remains.

