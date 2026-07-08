# ID-A - API client and auth boundary (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/03-contracts/api/context-engine-v1.md`, `specs/01-product/roles-and-permissions.md`, `specs/05-quality/security-and-privacy.md`, `specs/04-features/F-009-frontend-delivery/test-plan.md`.

**Question:** How should P9 talk to the backend without recreating auth or leaking private data?

## Decision

Use one typed API client foundation. Browser sends cookies, not bearer tokens. Feature modules own endpoint wrappers. UI state may store preferences only.

No browser token persistence. No direct provider, runtime, storage, database, Docker, LightRAG, or tracing calls.

## Why

| Bad path | Good path |
| --- | --- |
| Components call `fetch` directly and each handles errors differently. | One client normalizes the API-001 error envelope. |
| Browser stores a session token or provider credential. | Server sets opaque HttpOnly `ce_session`; browser stores UI prefs only. |
| UI redirects on every 401 and loops. | One auth boundary clears auth state once. |
| Member route hides a button and assumes that is security. | Backend 403 is still tested. |

## Exact Implementation Sketch

```typescript
type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId: string | null;
    fields?: Array<{ path: string; message: string }>;
  };
};

async function ceFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await normalizeApiError(response);
  }

  return response.json() as Promise<T>;
}
```

Adjust exact code to the frontend stack. Keep the rule, not necessarily this snippet.

## Endpoint Ownership

| Module | Endpoints |
| --- | --- |
| `features/auth/api.ts` | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` |
| `features/settings/runtime-api.ts` | P2 runtime settings routes |
| `features/domains/api.ts` | P3 admin/member domain routes |
| `features/sources/api.ts` | P4/P5 source routes |
| `features/chat/api.ts` | P7 conversations and turn stream |
| `features/audit/api.ts` | P8 audit events and diagnostics |

Do not put product endpoints in shared primitives.

## Implement Order

1. Define API error type from API-001.
2. Implement `ceFetch` or equivalent with `credentials: "include"`.
3. Implement auth store/context with `me`, `login`, `logout`.
4. Add 401 handler that clears auth state once.
5. Add 403 forbidden state without redirect loop.
6. Add storage allowlist test before any UI preferences are persisted.
7. Add feature endpoint wrappers only after OpenAPI/current fixture confirms shape.

## Red Flags In PR

- `localStorage`, `sessionStorage`, IndexedDB, URL params, or Zustand persist stores contain auth/session/provider credential data.
- Wrapper accepts arbitrary full URLs.
- Client sets request id and expects backend to trust it.
- Components inspect raw error response bodies.
- 401/403 behavior differs by route.
- Admin endpoint wrapper is imported into member-only route modules without role gating.
- API examples include raw provider payload, source content, stack trace, path, or runtime target.

## Tests

- Login sets cookie and response body has no token.
- Browser storage remains free of auth/session/provider credential strings after login/logout.
- `GET /auth/me` drives app shell role.
- 401 clears auth once and redirects to login once.
- 403 renders forbidden without redirect loop.
- Member cannot call admin UI action; backend 403 path is asserted.
- Error box renders safe `message` plus safe `requestId`, not raw payload.

## One-line summary

The frontend client is a typed cookie-speaking DTO adapter, not a second auth system.
