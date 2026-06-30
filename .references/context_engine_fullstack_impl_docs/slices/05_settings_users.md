# Slice 05 — Settings Dialog — Users

## User outcome
Admin lists users, creates user, edits role/active status, resets password, removes user only through explicit API-backed actions.

## In scope
- Admin-only Users panel in Settings dialog.
- Fetch table through `GET /admin/users`.
- Create user dialog/form; update row form; reset password dialog; destructive delete confirmation.
- Map server field errors to form fields.
- Invalidate/refetch list after success.

## Explicitly out of scope
- Self-service profile edit.
- Invitations/email delivery.
- Bulk import.
- Role policy engine.
- Client-only deletion.

## Routes affected
- global Settings dialog section `users`
- `/settings/users` compatibility route: panel or redirect; verify existing intent

## Frontend modules
- `features/settings/users/UsersPanel.tsx`
- `features/settings/users/UserForm.tsx`
- `features/settings/users/api.ts`
- `features/settings/users/types.ts`

## API contracts consumed
- `GET /admin/users`
- `POST /admin/users`
- `PATCH /admin/users/{id}`
- `POST /admin/users/{id}/reset-password`
- `DELETE /admin/users/{id}`

## Data models
- `AdminUserResponse`: id, username, role, is_active, created_at.
- Create request: username/password/role exact schema validate.
- Update/reset/delete response shapes verify.

## Authorization behavior
Admin only. Member never sees Users section. Backend must return 403 for all endpoints despite hidden UI. Prevent unsafe self-lockout only if backend provides rule; do not invent client rule.

## UI states
- Loading: compact table skeleton.
- Empty: no users message; create action.
- Error: retryable table alert.
- Unauthenticated: shell redirect.
- Forbidden: panel withheld; route forbidden.
- Success: toast + refreshed row/table.
- Validation: field-level errors; password length/byte constraints surfaced safely.

## UI parity and Local Studio transfer
- Confirmed: v1 client user helpers call listed `/admin/users*` endpoints.
- Confirmed: backend schemas expose id/username/role/is_active/created_at for admin rows.
- Verify delete semantics and server-side self-admin protection.

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

- Flat table/list, compact actions menu per row.
- Use explicit role badge, active/inactive text, not color only.
- Destructive delete confirmation names target username; no raw ID.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- All API calls in `features/settings/users/api.ts`.
- Keep create/edit/reset forms separate; no mega-modal with hidden modes.
- Table state local; server list remains source truth.

## Tests
- Member cannot discover Users nav/control.
- Admin list/create/update/reset/delete calls use correct typed endpoint.
- Success refreshes current list.
- 403 shows forbidden; does not silently hide failure.
- Password never appears in table/toast/log.

## Test scenarios to create
- Success: admin CRUD fixture.
- Validation: empty/invalid username, overlong password/schema error.
- Unauthenticated: admin endpoint request after logout -> login state.
- Unauthorized: member API 403 + direct route forbidden.
- Network/API: list/mutation failure retry; no optimistic delete.
- Edge: delete/revoke current admin handling matches backend response.

## Files to modify
- `features/settings/users/api.ts`
- `features/settings/users/types.ts`
- `features/settings/users/UsersPanel.tsx`
- `features/settings/users/UserForm.tsx`
- `tests/settings/users.test.tsx`

## Deliberately not added
- Settings route registry
- dialog panel switch

## Dependencies
- Invitation system.
- Bulk actions.
- Browser password store.
- Role capability editor.

## Evidence / verification
- 03 App Shell.
- 01 API/Error Foundation.
