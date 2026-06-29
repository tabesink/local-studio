# 02 — Login, Cookie, Session

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Replace browser-persisted bearer credential. Use secure session cookie. Keep role visible. Keep secret invisible.

## Entry points

Login route. App bootstrap. Logout action. Direct protected URL.

## Evidence and target

**OBSERVED:** Current Context Engine client API/auth stores use browser bearer-token handling. Prior review found token persistence in `localStorage`.

**TARGET:** FastAPI creates HttpOnly cookie. Client calls `/session/me`. Browser sends cookie with same-origin requests. No client readable access token.

## User flow

1. User submits credentials.
2. `POST /session/login`.
3. FastAPI verifies credentials.
4. FastAPI sets `HttpOnly`, `Secure` in production, `SameSite` cookie.
5. Client receives safe `CurrentUser`; no token.
6. Client redirects to allowed route.
7. Bootstrap calls `GET /session/me`.
8. Logout invalidates server session + clears cookie.


## Local Studio visual transfer

| Element | Use |
|---|---|
| Shell | Left rail. Center canvas. Optional right detail panel. |
| Density | `24px` small rows. `28px` controls/standard rows where primitive supports it. |
| Type | Geist for UI/body. Geist Mono for IDs, paths, model names, durations, payloads. |
| Surfaces | Dark-first close charcoal layers. 1px quiet borders. No card grid. |
| Actions | White/black high-contrast primary. Quiet danger. Compact icon/ghost secondary. |
| State | `StatusDot`/`StatusPill`; thin progress; compact error box. |
| Detail | Inspector stays in context. Do not route away for a small inspection. |


## Ownership

| State | Owner | Rule |
|---|---|---|
| Password verification | FastAPI auth service | Never browser. |
| Session ID | HttpOnly cookie + server store/JWT policy | Browser cannot read. |
| Current user | FastAPI | Client cache refreshable. |
| Role | FastAPI | Client only gates nav. |
| CSRF token | Backend policy | Required for cookie-auth mutations if cross-site risk exists. |

## Target API boundary

```http
POST /api/v1/session/login
POST /api/v1/session/logout
GET  /api/v1/session/me
```

```ts
type CurrentUser = { id: string; email: string; role: "admin" | "member" };
```

Errors: `invalid_credentials`, `session_expired`, `forbidden`, `csrf_failed`.

## State model

```text
unknown -> loading -> authenticated
unknown -> loading -> anonymous
authenticated -> expired -> anonymous
authenticated -> logout_pending -> anonymous
```


## Required UI states

| State | Required UI |
|---|---|
| Loading | Preserve layout. Local skeleton/quiet progress. No page flash. |
| Empty | Short sentence + one next action. No illustration by default. |
| Error | Compact `ErrorBox`. Clear recovery action. |
| Forbidden | Explain role boundary. Do not fake disabled success. |
| Pending mutation | Disable duplicate action. Keep server truth visible. |
| Background refresh | Small status. Do not block current read-only work. |


## Do not build

No token in `localStorage`.
No token in `sessionStorage`.
No auth token in Zustand persisted store.
No role-only client authorization.
No full user record in cookie.
No Local Studio controller API-key assumptions.

## Acceptance criteria

- Seed admin logs in.
- Member fixture logs in.
- Cookie has `HttpOnly`; `Secure` in production.
- Browser storage contains no credential.
- Admin API returns `403` for member.
- Logout invalidates session.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/auth.py`; `app/schemas/auth.py`; `client/src/lib/api/client.ts`; `client/src/stores/auth-store.ts`; `client/src/app/login/`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
