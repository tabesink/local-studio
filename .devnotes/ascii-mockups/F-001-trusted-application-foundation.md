# F-001 Trusted Application Foundation

Status: implementation handoff draft.

## Purpose

Login, session proof, route guards, forbidden state, safe request errors. Frontend implementation lands in F-009 slices 01-03.

## Specs

- `specs/04-features/F-001-trusted-application-foundation/spec.md`
- `specs/04-features/F-001-trusted-application-foundation/ux.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md` slices 01-03

## Reference Pack Notes

Folded from `.references/feature-ce-api-uiux-wirering-brainstorm/F-001-trusted-application-foundation.md`.

```text
slice 01 -> typed API client + canonical error envelope
slice 02 -> login/logout
slice 03 -> app shell, role nav, settings entry
```

## ASCII Mockup

```text
/login
+----------------------------------------+
| Context Engine                         |
|----------------------------------------|
| Email                                  |
| [....................................] |
| Password                               |
| [....................................] |
|                                        |
| [Sign in]                              |
|                                        |
| ErrorBox: safe error + requestId       |
+----------------------------------------+

protected route boot
+--------------------------------------------------+
| rail skeleton | SESSION Resolving session         |
+--------------------------------------------------+

/forbidden or forbidden canvas
+--------------------------------------------------+
| Access denied                                    |
| This area requires administrator access.          |
| [Back to Chat]                                   |
+--------------------------------------------------+
```

## Wiring

| UI event | API |
| --- | --- |
| Submit login | `POST /api/v1/auth/login` |
| Resolve session | `GET /api/v1/auth/me` |
| Logout | `POST /api/v1/auth/logout` |
| Admin proof/users | `GET /api/v1/admin/users` when settings users slice exists |

Login response includes safe user/session expiry, never a token.

## State

```text
auth: unknown -> authenticated | unauthenticated | error
401: clear auth once -> /login
403: forbidden state, no redirect loop
requestId: show in ErrorBox when API returns it
```

## Parity Rules

- Compact form, dark-first tokens, no marketing hero.
- Inputs are 28px-ish controls from shared primitives.
- Error state uses `ErrorBox`; no stack traces.
- Route guards preserve shell geometry during loading.

## Do Not Wire

- No JWT.
- No localStorage/sessionStorage auth token.
- No password/hash/session token in logs, responses, URLs, screenshots, or fixtures.
- No frontend-only role enforcement as final authority.
