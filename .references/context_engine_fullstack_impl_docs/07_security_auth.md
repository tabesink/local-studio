# Security + Auth Rebuild Rules

## Confirmed current path

```text
login form → POST /auth/login → bearer token response + HttpOnly cookie
client → stores bearer in localStorage + sends Authorization bearer + credentials include
GET /auth/me → auth bootstrap
```

Backend accepts cookie/bearer compatibility. Cookie is HttpOnly; secure flag depends environment. Current client logout is local-only/no backend logout request.

## Production target — Recommendation

```text
login → backend sets HttpOnly Secure SameSite session cookie
browser → credentials include
GET /auth/me → server/app session boundary
logout → POST /auth/logout → revoke/expire server session + clear cookie
```

No access token in `localStorage`, `sessionStorage`, URL, Redux/Zustand persistence, logs, errors, analytics, or copied diagnostics.

## Authorization matrix

| Action | Frontend | Backend |
|---|---|---|
| Show admin nav | role-based hide | n/a usability only |
| Open admin route | forbidden UI state | role check required |
| Users/provider/parser mutation | disable/hide controls | admin check required |
| Document read/write | show allowed state | enforce route/resource rule |
| Domain lifecycle | show admin action | enforce admin + transition rule |
| Secrets | show configured/not configured | never return values |

## Required test cases

- no session -> login redirect.
- valid member -> chat/doc read surface.
- member -> admin endpoint 403.
- member direct admin URL -> forbidden UI.
- admin -> admin controls/data.
- token/cookie not visible in browser storage.
- logout removes server session, cookie, UI session.
- 401 response clears client auth state once; 403 does not loop redirect.
- unsafe `next` redirect blocked.
