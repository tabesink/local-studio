# Slice 01 — Runtime Foundation

    ## User outcome
    App boots with typed env, one API boundary, design tokens, common error rendering, test harness.

    ## In scope
    - Create server/client config boundary. Browser gets only public API base URL.
- Create `apiRequest()` with cookie credentials, abort support, request ID capture, normalized errors.
- Create contracts module. Feature modules own endpoint wrappers; no raw `fetch` in UI.
- Install/align shadcn primitives only needed now: Button, Input, Dialog, Alert, Table, Skeleton, Sonner.
- Create root error/not-found/loading surfaces and test fixtures.

    ## Explicitly out of scope
    - Feature endpoints.
- Auth persistence.
- React Query/global cache.
- Telemetry platform.
- Generic retry framework.

    ## Routes affected
    - `/` redirect placeholder
- root `layout.tsx`
- root error/loading/not-found

    ## Frontend modules
    - `src/lib/config/env.ts`
- `src/lib/api/client.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/contracts.ts`
- `src/components/shared/AppErrorState.tsx`
- `src/styles/tokens.css`

    ## API contracts consumed
    - No feature endpoint required; safe `/health` probe only if product needs it.

    ## Data models
    - `ApiError` target: `status`, `code`, `message`, optional `fieldErrors`, optional `requestId`.
- Public runtime config.

    ## Authorization behavior
    Public. Never expose backend secrets, provider keys, private URLs, internal ports.

    ## UI states
    - Loading: root fallback/skeleton.
- Error: safe failure state + retry callback.
- Not found: route-level.
- Success: render child route.
- Network: distinguish abort from request failure.

## UI parity
- Current client has typed API helpers, root provider composition, Tailwind-based UI.
- Current client transports bearer plus cookies; target must start cookie-first before auth slice.
- Runtime test needed: deployed API base URL and CORS.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    Current visual base: white canvas, low-contrast borders, `rounded-md`, compact system typography.

    ## Acceptance criteria
    - Keep `apiRequest` transport-only: URL, headers, credentials, JSON/form-data, error normalize.
- Do not put feature endpoint strings in components.
- Freeze browser config object after validation.

    ## Tests
    - Invalid/missing public API URL fails build/start with actionable safe message.
- All feature API wrappers compile against one error type.
- One raw transport module only.
- Root error/loading/not-found render without layout crash.

    ## Files to create
    - Unit: malformed JSON/non-JSON/network/abort error normalize.
- Unit: request sends `credentials: include`.
- Unit: public config rejects secret-like env access.
- Smoke: root route renders token styles.

    ## Files to modify
    - `src/lib/config/env.ts`
- `src/lib/api/client.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/contracts.ts`
- `src/components/shared/AppErrorState.tsx`
- `src/components/shared/LoadingState.tsx`
- `src/styles/tokens.css`
- `tests/api/client.test.ts`

    ## Deliberately not added
    - root layout/style entrypoints
- test config

    ## Dependencies
    - Access-token browser storage.
- Data-fetching library.
- Global feature store.
- Provider abstractions.

    ## Evidence / verification
    - None.
