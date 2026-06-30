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

## UI parity and Local Studio transfer
- Confirmed: v1 upload route creates document/operation/audit and returns document + operation/status URL shape in architecture docs.
- Confirmed: default status timeout documented 30 minutes; exact client poll interval/endpoint behavior needs runtime capture.
- Verify cancellation/retry endpoints before exposing controls.

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

- Modal follows Settings/dialog quality: title, short rule, drop zone/input, selected file row, clear status timeline.
- Use stage/message text from backend. Do not invent `%`.
- Keep table background visible; no nested card overload.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

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

## Test scenarios to create
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
