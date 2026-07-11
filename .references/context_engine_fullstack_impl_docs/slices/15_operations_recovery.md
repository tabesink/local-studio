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

## UI parity and Local Studio transfer
- Confirmed: architecture calls `/operations` canonical product API and jobs internal.
- Confirmed: operation transition/status model documented.
- Verify list filters, retention, cancel/retry endpoint and role behavior.

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

- Flat admin table. Status text/icon. Detail drawer/panel, not nested dashboard.
- Stages/messages compact; truncate long safe text with accessible full description.
- Do not display arbitrary backend traceback.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Operation poller shared with upload/lifecycle but takes generic resource ID and stop predicate.
- One status-map module; no duplicated labels.
- List read model separate from document/domain presentation.

## Tests
- Operation row reaches terminal without orphan poll timer.
- Failed operation shows safe recovery guidance.
- Document upload and domain lifecycle link to same operation detail.
- Member direct route gets forbidden unless backend contract later allows read.

## Test scenarios to create
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
