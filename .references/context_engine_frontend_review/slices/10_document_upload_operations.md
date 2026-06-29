# Slice 10 — Document Upload + Processing Operation

    ## User outcome
    Admin uploads supported file, receives document/operation result, tracks processing without conflating document status and operation status.

    ## In scope
    - Admin upload dialog launched from Documents.
- Validate file presence/size/type only against verified backend rules; backend validates final.
- Submit multipart `POST /admin/documents/upload`.
- Render returned document + operation + status URL where present.
- Poll/refresh operation/document until terminal status using bounded interval/stop rules.
- Allow cancellation/retry only if verified endpoint/transition exists.

    ## Explicitly out of scope
    - Multi-file bulk queue.
- Browser direct-to-storage upload.
- Client parser execution.
- Invented progress percent.
- Auto retry loops.

    ## Routes affected
    - `/documents` upload dialog
- operation status component

    ## Frontend modules
    - `features/documents/upload/UploadDialog.tsx`
- `upload-api.ts`
- `UploadOperationStatus.tsx`
- `features/operations/operation-poll.ts`

    ## API contracts consumed
    - `POST /admin/documents/upload`
- `GET /operations/{id}` or returned `status_url` — exact route verify
- Document read refresh endpoint

    ## Data models
    - Upload response: document optional; operation id/type/status/stage/message; status URL.
- Document states separate from operation states.

    ## Authorization behavior
    Admin only. Backend rejects member upload. Validate server-side type/size/ownership. Never trust filename/declared MIME for security. Do not expose storage paths.

    ## UI states
    - Idle: dialog open, no file.
- Validation: field/file error.
- Submitting: upload progress only if browser transport can measure it.
- Processing: document/operation pending state.
- Success: document ready or operation terminal success.
- Failed: safe server message + allowed retry action.
- Canceled: explicit terminal state.
- Forbidden/unauthenticated: close/route state safely.

## UI parity
- Confirmed: v1 upload route creates document/operation/audit and returns document + operation/status URL shape in architecture docs.
- Confirmed: default status timeout documented 30 minutes; exact client poll interval/endpoint behavior needs runtime capture.
- Verify cancellation/retry endpoints before exposing controls.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Modal follows Settings/dialog quality: title, short rule, drop zone/input, selected file row, clear status timeline.', 'Use stage/message text from backend. Do not invent `%`.', 'Keep table background visible; no nested card overload.']

    ## Acceptance criteria
    - Upload controller owns File, AbortController, mutation state.
- Operation poller accepts operation id/status URL and terminal states; stop on unmount/abort/terminal/timeout.
- Document list refetches after each meaningful terminal update.

    ## Tests
    - Admin upload sends multipart once; result shows returned IDs only in developer diagnostics, not primary UI.
- Member has no upload control; API 403 handled.
- Processing UI distinguishes operation `running` from document `indexing`.
- Poller stops correctly and never keeps running after dialog/page close.
- Failure does not lose original safe filename or corrupt document list.

    ## Files to create
    - Success: upload -> indexing/running -> ready/succeeded fixture.
- Validation: no file + backend rejected type/size.
- Unauthenticated: expired session during upload.
- Unauthorized: member 403.
- Network/API: abort/network fail/5xx with retry permitted.
- Edge: operation succeeds while document remains indexing; UI preserves separate truth.

    ## Files to modify
    - `features/documents/upload/UploadDialog.tsx`
- `upload-api.ts`
- `UploadOperationStatus.tsx`
- `features/operations/operation-poll.ts`
- `tests/documents/upload.test.tsx`

    ## Deliberately not added
    - DocumentsPage upload trigger
- document API types
- operations API adapter

    ## Dependencies
    - Bulk upload.
- Fake percentage.
- Unbounded polling.
- Retry without server contract.

    ## Evidence / verification
    - 09 Documents Library.
- 15 Operations Recovery for full operations page.
