# F-001 — Trusted Application Foundation

**Phase P1 · Backend-first · UI slice 01–03**

## Outcome

Secure FastAPI app: cookie sessions, roles, safe errors, health.

## API Surface

| Method | Route | Role | UI use |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | login form |
| GET | `/auth/me` | auth | session bootstrap |
| POST | `/auth/logout` | auth | logout |
| GET | `/admin/users` | admin | settings users (slice 05) |
| GET | `/health/live` | public | ops probe |
| GET | `/health/ready` | public | deploy probe |

## Auth Flow

```text
Login POST { email, password }
  → Set-Cookie: ce_session (HttpOnly, SameSite)
  → JSON: { user, expiresAt }   ← NO token in body

Every request: cookie auto-sent
401 → clear client auth state → /login (once)
403 → forbidden surface, no redirect loop
```

## UI Wiring (P9)

| Slice | Screen | LS patterns |
| --- | --- | --- |
| 01 | typed API client, error envelope | `ui/error-box.tsx` |
| 02 | login page | compact centered form — `ui/input.tsx`, `ui/button.tsx` |
| 03 | app shell, role nav | `features/shell/left-sidebar.tsx` rail geometry |

```text
/login ──success──► (app)/chat|documents|...
       ◄──401────── protected routes
```

## States

| State | UI |
| --- | --- |
| loading | session skeleton in shell |
| unauthenticated | redirect `/login` |
| member | hide admin nav items |
| admin | full nav |
| error | `ErrorBox` + requestId (mono) |

## Never

- localStorage/sessionStorage for tokens
- JWT in browser
- password/token in logs or URLs

## Spec

`specs/04-features/F-001-trusted-application-foundation/spec.md`
