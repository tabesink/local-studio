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

## UI parity and Local Studio transfer
- Confirmed: architecture describes backend-owned per-domain runtime lifecycle and says start prepares artifacts before boot; operations track async work.
- Unknown: precise v1 lifecycle endpoint paths/allowed action enum. Runtime/OpenAPI capture gate.

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

- Compact action row, no giant operational dashboard.
- Destructive action styled clearly. Dialog names domain, lists cleanup impact only if backend guarantees it.
- Status/history link goes to Operations slice.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Actions call typed lifecycle client. Operation tracker owns polling/render.
- Do not encode transition graph in frontend beyond server-provided `allowed_actions` if available.
- Route back to domain list after confirmed deletion.

## Tests
- Admin action creates visible operation or returned terminal result.
- Member cannot invoke lifecycle through UI or API.
- Delete requires explicit confirm and handles stale/404 outcome.
- UI never calls container/LightRAG endpoint directly.

## Test scenarios to create
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
