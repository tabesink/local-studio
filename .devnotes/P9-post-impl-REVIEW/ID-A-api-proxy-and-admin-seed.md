# ID-A - API proxy and admin seed (junior dev explainer)

Parent links: [ID-A.md](./ID-A.md), [F-010-P10-readiness.md](./F-010-P10-readiness.md)

**Question:** Where is the admin login defined, and what must P10 add so the frontend login works?

### Decision

The frontend does not define an Administrator account. FastAPI owns auth, sessions, user rows, password hashing, and admin bootstrap. P10 must seed or rotate the Administrator from environment inputs during the runnable-stack startup path, then prove login through the real API and frontend proxy.

Do not commit a working password. Use env names only:

```text
CE_ADMIN_USERNAME
CE_ADMIN_PASSWORD
```

### Why

| Bad path | Good path |
| --- | --- |
| Put default credentials into frontend code. | Backend seeds Administrator from env and returns only safe user/session DTOs. |
| Store session token in localStorage. | Server sets opaque HttpOnly `ce_session`; frontend uses `credentials: "include"`. |
| Debug `/login` while API is down. | Start API first, then prove proxy. |
| Return password/hash/token in smoke output. | Smoke asserts those fields are absent. |

P9 already has the thin-client side:

```text
frontend/next.config.ts
  /api/v1/* -> API target

frontend/src/lib/api/client.ts
  shared ceFetch
  credentials: include
  no absolute external API path

frontend/src/state/auth-store.ts
  user/session state only
  no token persistence
```

P10 adds the live backend half.

### Exact Flow

```text
POST /api/v1/auth/login
  body: username/password from local env smoke input
  response: safe user + session metadata
  side effect: HttpOnly ce_session cookie

GET /api/v1/auth/me
  request: cookie from login
  response: safe current user/session

frontend /login
  uses same-origin /api/v1/auth/login
  Next proxy reaches FastAPI
```

### Implement Order

1. Confirm P1 auth routes and current user DTO in API-001.
2. Confirm backend bootstrap mechanism or add one under F-010.
3. Ensure bootstrap values come only from env/local ignored files.
4. Start API against migrated Postgres.
5. Add smoke login and `/auth/me` check.
6. Add frontend proxy check for `/api/v1/auth/me`.
7. Scan smoke evidence for forbidden credential/token/hash fields.

### Red Flags In PR

- A working password appears in committed docs, compose, env examples, screenshots, logs, or tests.
- Frontend code contains auth token handling.
- Login response returns a token, password hash, provider credential, or raw error.
- Smoke uses an in-process client only and never proves a listening API.
- The frontend proxy target differs from the API service port.
- API-unavailable UI shows a stack trace or host/private target detail.

### Tests

- Unit/config test: required env names are documented and parsed.
- Service smoke: login succeeds against the listening API.
- Service smoke: `/api/v1/auth/me` succeeds with cookie and returns safe fields only.
- Frontend smoke: `/login` loads and proxy auth route reaches API.
- Safety scan: no committed working credentials, token values, password hashes, or raw stack traces.

### One-line summary

The admin account belongs to FastAPI/Postgres; P10 must seed it from local env and prove login through the frontend proxy without committing credentials.
