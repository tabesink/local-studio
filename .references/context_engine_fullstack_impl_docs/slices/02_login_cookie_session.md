# Slice 02 — Login + Cookie Session

## User outcome
User signs in, session restores after refresh, protected UI redirects safely, logout invalidates session.

## In scope
- Build `/login` form: username + password, validation, submit disabled while pending.
- Call `POST /auth/login`, then resolve `GET /auth/me` using cookie credentials.
- Create session hook/provider with states `loading | authenticated | unauthenticated`.
- Create safe `next` handling: same-origin relative app paths only.
- Add `POST /auth/logout` backend contract if absent; clear server cookie/session.

## Explicitly out of scope
- Password reset UI.
- SSO.
- MFA.
- Token refresh design.
- Remember-me checkbox.
- Browser token persistence.

## Routes affected
- `/login`
- authenticated route layout guard

## Frontend modules
- `features/auth/LoginForm.tsx`
- `features/auth/session.ts`
- `features/auth/api.ts`
- `app/(public)/login/page.tsx`
- `app/(app)/layout.tsx`

## API contracts consumed
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout` — **add/verify; not proven in v1**

## Data models
- Login request: username/password. Current user: id/username/role/active fields exact shape verify.
- Session state is frontend cache of backend identity, not source truth.

## Authorization behavior
Public login. Authenticated user visiting `/login` -> safe app default. Protected route with no session -> `/login?next=...`. Role enforcement later backend per endpoint.

## UI states
- Loading: session bootstrap skeleton, no flash of protected content.
- Validation: inline field error.
- Login failed: generic credential error; no account enumeration.
- Unauthenticated: login form.
- Success: navigate safe `next` or `/chat`.
- Logout: pending then login screen; no stale protected UI.

## UI parity and Local Studio transfer
- Confirmed: v1 `POST /auth/login` returns bearer and sets HttpOnly cookie; `GET /auth/me` exists.
- Confirmed: current client writes bearer to `localStorage`; current client logout is local-only. Replace.
- Verify cookie domain/Secure/SameSite and CSRF behavior in target deployment.

## Local Studio visual transfer

Use the canonical design sources before building or styling this slice: `DESIGN.md`, `docs/design/context_engine_agent_ui_guidelines.md`, `.references/review_docs/local_studio_frontend_review/local-studio-visual-parity-package.md`, and the read-only implementation reference under `.references/code/local-studio/frontend/`.

| Concern | Required transfer |
|---|---|
| Theme | Default to `zai-dark`; support `zai-light` as the matching Local Studio light theme. |
| Tokens | Use Local Studio `--ui-*` aliases plus compatible `--bg`, `--fg`, `--surface`, `--rail`, `--border`, `--accent`, `--dim`, `--ok`, `--warn`, and `--err` aliases. |
| Typography | Geist Sans for UI/body; Geist Mono for IDs, paths, model names, timestamps, request IDs, code, and payload-shaped metadata. |
| Density | Preserve workstation density: 4px spacing rhythm, `24px` compact rows, `28px` standard rows/controls where the primitive supports it. |
| Surfaces | Layered charcoal panels, quiet 1px borders, subtle hover/selected states; no white-canvas dashboard shell. |
| Components | Reuse/adapt Local Studio primitives first: `Button`, `Input`, `Select`, `Tabs`, `SegmentedControl`, `Table`, `List`, `Status`, `ProgressBar`, `Modal`, `Drawer`, `RightDetailPanel`, `PageState`, `ErrorBox`. |
| Actions | Primary is black/white high-contrast, not blue. Secondary actions are compact ghost/icon/outline controls. Destructive actions use quiet danger styling plus confirmation when irreversible. |
| Status | Use status dot/pill/text/icon/progress combinations; color cannot be the only status signal and semantic colors stay local. |
| Detail | Use a right detail panel or drawer for evidence, source, graph-node, operation, provider, audit, or document inspection instead of navigating away for small details. |
| Accessibility | Keyboard reachability, visible focus, labels/tooltips for icon-only controls, form labels, dialog title/description, Escape close, and focus restore are required. |

## Implementation shape

```text
route/layout
  → feature shell
  → feature controller/hook
  → typed API or stream client
  → mapped view state
  → rendered UI
```

## Slice-specific UI contract

- Compact Local Studio public shell on the dark-first token canvas; centered narrow form only, not a marketing page.
- Use password input label, autocomplete attributes, Enter submit, visible focus.
- Show no raw API message if it leaks auth detail.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Login API wrapper handles request only; session hook owns bootstrap/login/logout state.
- Use cookie-only browser auth. Remove `localStorage` bearer read/write.
- Backend accepts existing bearer compatibility only during migration; frontend never relies on it.

## Tests
- Reload after login preserves authenticated state via cookie + `/auth/me`.
- Member/admin role visible in current-user state.
- No token exists in `localStorage`/`sessionStorage`.
- Logout calls backend, clears UI session, route cannot render protected content.
- Unsafe `next=https://...` ignored.

## Test scenarios to create
- Success: valid admin/member credentials.
- Validation: empty username/password.
- Unauthenticated: direct protected URL redirects.
- Unauthorized: later admin API 403 does not change session.
- Network: login failure with retry.
- Edge: stale browser tab gets 401 -> one login redirect, no loop.

## Files to modify
- `features/auth/api.ts`
- `features/auth/session.tsx`
- `features/auth/LoginForm.tsx`
- `app/(public)/login/page.tsx`
- `app/(app)/layout.tsx`
- `app/auth/forbidden/page.tsx`
- `tests/auth/session.test.tsx`

## Deliberately not added
- backend auth router: add logout if absent
- root providers

## Dependencies
- JWT/localStorage auth.
- Client-computed roles.
- Refresh token storage.
- SSO.

## Evidence / verification
- 01 Runtime Foundation.
