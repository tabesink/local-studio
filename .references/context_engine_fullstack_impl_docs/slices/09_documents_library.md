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

## UI parity and Local Studio transfer
- Confirmed: v1 architecture treats `/documents` as canonical read surface.
- Confirmed: document status enum and fields listed in docs/client types.
- Verify list pagination/filter contract and exact document visibility policy.

## Local Studio visual transfer

Use the canonical design sources before building or styling this slice: `DESIGN.md`, `docs/design/context_engine_agent_ui_guidelines.md`, `.references/review_docs/local_studio_frontend_review/local-studio-visual-parity-package.md`, and the read-only implementation reference under `.references/code/local-studio/frontend/`.

| Concern | Required transfer |
|---|---|
| Theme | Default to `zai-dark`; support `zai-light` as the matching Local Studio light theme. |
| Tokens | Use Local Studio `--ui-*` aliases plus compatible `--bg`, `--fg`, `--surface`, `--rail`, `--border`, `--accent`, `--dim`, `--ok`, `--warn`, and `--err` aliases. |
| Typography | Geist Sans for UI/body; Geist Mono for IDs, paths, model names, timestamps, request IDs, code, and payload-shaped metadata. |
| Density | Preserve workstation density: 4px spacing rhythm, `24px` compact rows, `28px` standard rows/controls where the primitive supports it. |
| Surfaces | Layered charcoal panels, quiet 1px borders, subtle hover/selected states; no white-canvas dashboard shell. |
| Components | Reuse/adapt Local Studio primitives first: `Button`, `Input`, `Select`, `Tabs`, `SegmentedControl`, `Table`, `List`, `Status`, `ProgressBar`, `Modal`, `Drawer`, `RightDetailPanel`, `PageState`, `ErrorBox`. |
| Actions | Primary is black/white high-contrast, not blue. Secondary actions are compact ghost/icon/outline controls. Destructive actions use quiet danger styling plus confirmation when irreversible. |
| Status | Use status dot/pill/text/icon/progress combinations; color cannot be the only status signal and semantic colors stay local. |
| Detail | Use a right detail panel or drawer for evidence, source, graph-node, operation, provider, audit, or document inspection instead of navigating away for small details. |
| Accessibility | Keyboard reachability, visible focus, labels/tooltips for icon-only controls, form labels, dialog title/description, Escape close, and focus restore are required. |

## Implementation shape

```text
route/layout
  → feature shell
  → feature controller/hook
  → typed API or stream client
  → mapped view state
  → rendered UI
```

## Slice-specific UI contract

- Flat library table/list. Low border density. Status uses text + shape/icon.
- Filename primary; type/timestamp muted; failed error summary secondary.
- Use no oversized cards.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

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

## Test scenarios to create
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
