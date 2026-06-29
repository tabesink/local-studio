# Slice 14 — LightRAG Domain Lifecycle

    ## User outcome
    Admin starts/stops/deletes domain through backend lifecycle control plane, sees operation truth, receives clear destructive confirmation.

    ## In scope
    - Add lifecycle actions only after exact domain routes/DTOs captured.
- Render current lifecycle status and allowed actions from backend state.
- Start/stop actions create/refresh operation state.
- Delete action has explicit irreversible confirmation and post-success navigation/refresh.
- Show backend-provided config/recreate requirement; do not perform hidden remediation.

    ## Explicitly out of scope
    - Automated repair/recreate/purge commands unless backend contract explicitly retains them.
- Direct Docker/LightRAG browser calls.
- Domain env editor.
- Background action queue in browser.

    ## Routes affected
    - Settings Domains panel action handoff
- domain lifecycle detail/dialog

    ## Frontend modules
    - `features/domains/lifecycle/DomainLifecycleActions.tsx`
- `api.ts`
- `types.ts`
- `DeleteDomainDialog.tsx`

    ## API contracts consumed
    - LightRAG/domain lifecycle routes — **exact paths and payloads must be captured**.
- Operations status endpoint.

    ## Data models
    - Domain lifecycle state exact enum unknown.
- Operation state confirmed.
- Delete result/resource cleanup shape unknown.

    ## Authorization behavior
    Admin only. Backend enforces transition eligibility and destructive permission. UI hides impossible actions but never assumes it can validate lifecycle. Delete confirmation protects usability, not authorization.

    ## UI states
    - Loading: lifecycle state/action skeleton.
- Ready/stopped/running: render only API-confirmed state labels.
- Pending: action disabled + operation link/status.
- Error: safe backend message + retry only when allowed.
- Forbidden: no action/403 state.
- Delete confirm: explicit irreversible warning.
- Success: refreshed domain list/context.

## UI parity
- Confirmed: architecture describes backend-owned per-domain runtime lifecycle and says start prepares artifacts before boot; operations track async work.
- Unknown: precise v1 lifecycle endpoint paths/allowed action enum. Runtime/OpenAPI capture gate.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Compact action row, no giant operational dashboard.', 'Destructive action styled clearly. Dialog names domain, lists cleanup impact only if backend guarantees it.', 'Status/history link goes to Operations slice.']

    ## Acceptance criteria
    - Actions call typed lifecycle client. Operation tracker owns polling/render.
- Do not encode transition graph in frontend beyond server-provided `allowed_actions` if available.
- Route back to domain list after confirmed deletion.

    ## Tests
    - Admin action creates visible operation or returned terminal result.
- Member cannot invoke lifecycle through UI or API.
- Delete requires explicit confirm and handles stale/404 outcome.
- UI never calls container/LightRAG endpoint directly.

    ## Files to create
    - Success: start/stop/delete fixtures.
- Validation: no domain/invalid transition server response.
- Unauthenticated: session expiry.
- Unauthorized: member 403.
- Network/API: action request failure, operation failure.
- Edge: simultaneous action returns conflict; refresh state.

    ## Files to modify
    - `features/domains/lifecycle/api.ts`
- `types.ts`
- `DomainLifecycleActions.tsx`
- `DeleteDomainDialog.tsx`
- `tests/domains/lifecycle.test.tsx`

    ## Deliberately not added
    - Domains panel action slot
- operations tracker

    ## Dependencies
    - Client transition machine.
- Direct Docker calls.
- Repair/recreate/purge extras.
- Domain env editor.

    ## Evidence / verification
    - 06 Settings Domains.
- 15 Operations Recovery.
