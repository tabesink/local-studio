# Slice 09 — Documents Library

    ## User outcome
    User browses document library, sees truthful status/error metadata, navigates safely to allowed context; admin sees write affordances only.

    ## In scope
    - Build `/documents` list/table page.
- Fetch read document list through canonical document API.
- Render filename, content type, status, timestamps, safe error message, selected metadata only.
- Add filter/search only if existing list contract supports it; otherwise local visible-row filter explicitly labeled.
- Admin sees upload trigger placeholder; member does not.

    ## Explicitly out of scope
    - Upload mechanics.
- Document edit/delete unless endpoint confirmed.
- Per-document ACL UI.
- Client-side status mutation.
- Infinite scrolling without pagination contract.

    ## Routes affected
    - `/documents`

    ## Frontend modules
    - `features/documents/DocumentsPage.tsx`
- `DocumentsTable.tsx`
- `DocumentStatusBadge.tsx`
- `api.ts`
- `types.ts`

    ## API contracts consumed
    - `GET /documents` — exact pagination/filter DTO capture required.

    ## Data models
    - Document: id, filename, content_type, status, created_at, updated_at, metadata, error_message (safe).
- Status enum: uploaded/indexing/ready/failed/deleted.

    ## Authorization behavior
    Authenticated read. Admin-only upload action hidden from member. Backend must authorize document visibility; v1 architecture says per-document/domain ACL deferred, so do not falsely claim object-level isolation.

    ## UI states
    - Loading: table skeleton.
- Empty: no documents + admin upload next action.
- Error: compact error/retry.
- Unauthenticated: login redirect.
- Forbidden: backend 403 safe state.
- Success: rows with consistent status labels.
- Stale status: refresh affordance, no fake live update.

## UI parity
- Confirmed: v1 architecture treats `/documents` as canonical read surface.
- Confirmed: document status enum and fields listed in docs/client types.
- Verify list pagination/filter contract and exact document visibility policy.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Flat library table/list. Low border density. Status uses text + shape/icon.', 'Filename primary; type/timestamp muted; failed error summary secondary.', 'Use no oversized cards.']

    ## Acceptance criteria
    - Map API Document DTO to `DocumentListItem`; never pass raw API object through all components.
- Keep status label/color mapping canonical in one module.
- Upload button imports upload dialog lazily only after Slice 10.

    ## Tests
    - Member sees document rows allowed by backend.
- Status displays all confirmed values.
- Failed document exposes safe server-provided error summary.
- Admin sees upload entry; member does not.
- No mutation endpoint called from library.

    ## Files to create
    - Success: each status row fixture.
- Validation: n/a read-only.
- Unauthenticated: route redirect.
- Unauthorized: 403 state.
- Network/API: retry.
- Edge: unknown future status renders `Unknown` without crash.

    ## Files to modify
    - `app/(app)/documents/page.tsx`
- `features/documents/api.ts`
- `types.ts`
- `DocumentsPage.tsx`
- `DocumentsTable.tsx`
- `DocumentStatusBadge.tsx`
- `tests/documents/library.test.tsx`

    ## Deliberately not added
    - navigation config
- Shell route placeholder

    ## Dependencies
    - Upload implementation.
- Delete/archive UI.
- Pagination assumptions.
- ACL UI.

    ## Evidence / verification
    - 03 App Shell.
- 01 API/Error Foundation.
