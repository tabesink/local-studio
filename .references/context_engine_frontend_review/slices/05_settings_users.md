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

## UI parity
- Confirmed: v1 client user helpers call listed `/admin/users*` endpoints.
- Confirmed: backend schemas expose id/username/role/is_active/created_at for admin rows.
- Verify delete semantics and server-side self-admin protection.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Flat table/list, compact actions menu per row.', 'Use explicit role badge, active/inactive text, not color only.', 'Destructive delete confirmation names target username; no raw ID.']

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

    ## Files to create
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
