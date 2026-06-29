# Deployment

## Frontend Environment

`webui/` reads one public frontend variable at the API boundary:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes | Public, secret-free absolute URL for the backend API origin. |

Never place credentials, bearer tokens, private service URLs, database URLs, or secret material in `NEXT_PUBLIC_*` variables because they are exposed to browser code.

## Local Run

```bash
cd webui
npm install
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000 npm run dev
```


## Session Endpoint

The FE-002 shell expects `GET /auth/me` to return the current user shape documented in `docs/brainstorm/01_fe_context_engine_nextjs_vertical_slices/API_BACKEND_CONNECTIONS.md`. A `401` redirects to `/login`; a `403` from protected backend routes should be rendered as a forbidden state by the relevant feature slice.

Local Playwright shell tests use a same-origin fake `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:3000` and route-mock `/auth/me`; this is test-only and does not persist credentials.
