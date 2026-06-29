# Slice 15 — Operations + Recovery

    ## User outcome
    Admin sees global domain/document operations, understands status/stage/message, can retry/cancel only where backend allows.

    ## In scope
    - Build admin operations list/detail surface.
- Fetch canonical `/operations` list and detail.
- Render type, resource/domain reference, status, stage, message, timestamps where provided.
- Poll active operations with bounded interval; stop terminal/unmount/timeout.
- Expose retry/cancel only after route/action contracts captured.

    ## Explicitly out of scope
    - Internal RQ job UI.
- Worker queue administration.
- Client-created operations.
- Automatic endless retries.
- Raw logs/secrets.

    ## Routes affected
    - admin operations page/dialog
- upload/lifecycle operation links

    ## Frontend modules
    - `features/operations/OperationsPage.tsx`
- `OperationsTable.tsx`
- `OperationDetail.tsx`
- `api.ts`
- `poll.ts`
- `types.ts`

    ## API contracts consumed
    - `GET /operations`
- `GET /operations/{id}`
- cancel/retry endpoints **verify before UI**

    ## Data models
    - Operation status: queued/running/succeeded/failed/canceled.
- Fields: id/type/status/stage/message/timestamps exact verify.

    ## Authorization behavior
    Admin visibility is intended in architecture. Backend must enforce. Do not expose internal RQ jobs as product records. Member behavior unknown; default no access until contract proves otherwise.

    ## UI states
    - Loading: table skeleton.
- Empty: no recent operations.
- Error: retry.
- Active: queued/running text + refresh indicator.
- Terminal: succeeded/failed/canceled labels.
- Forbidden: safe state.
- Retry/cancel: pending confirmation/result only if API supports.

## UI parity
- Confirmed: architecture calls `/operations` canonical product API and jobs internal.
- Confirmed: operation transition/status model documented.
- Verify list filters, retention, cancel/retry endpoint and role behavior.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Flat admin table. Status text/icon. Detail drawer/panel, not nested dashboard.', 'Stages/messages compact; truncate long safe text with accessible full description.', 'Do not display arbitrary backend traceback.']

    ## Acceptance criteria
    - Operation poller shared with upload/lifecycle but takes generic resource ID and stop predicate.
- One status-map module; no duplicated labels.
- List read model separate from document/domain presentation.

    ## Tests
    - Operation row reaches terminal without orphan poll timer.
- Failed operation shows safe recovery guidance.
- Document upload and domain lifecycle link to same operation detail.
- Member direct route gets forbidden unless backend contract later allows read.

    ## Files to create
    - Success: each documented status fixture.
- Validation: n/a read first.
- Unauthenticated: redirect.
- Unauthorized: 403.
- Network/API: retry/timeout.
- Edge: operation row disappears/404 after retention cleanup.

    ## Files to modify
    - `app/(app)/operations/page.tsx`
- `features/operations/api.ts`
- `types.ts`
- `poll.ts`
- `OperationsPage.tsx`
- `OperationsTable.tsx`
- `OperationDetail.tsx`
- `tests/operations/page.test.tsx`

    ## Deliberately not added
    - nav/admin route config
- upload/lifecycle links

    ## Dependencies
    - RQ job surface.
- Live log tail.
- Auto retry.
- Worker controls.

    ## Evidence / verification
    - 10 Upload.
- 14 Domain Lifecycle.
