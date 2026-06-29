# Slice 03 — Authenticated App Shell + Role Nav + Empty Settings

    ## User outcome
    Authenticated member/admin sees parity rail, active route, role-aware links, accessible empty Settings dialog.

    ## In scope
    - Build authenticated app layout with narrow SideRail, content pane, toast host.
- Render Chat, Documents, Knowledge Graph nav. Set active item from pathname.
- Render Settings trigger. Open empty dialog with General and admin-only placeholders.
- Hide admin-only settings nav for member. Backend remains authority.
- Add `/forbidden` state for direct member navigation to admin-only screen.
- Use focus trap, Escape, overlay close, trigger focus restore, aria labels.

    ## Explicitly out of scope
    - Real settings panels.
- Document actions.
- Chat transport.
- Mobile drawer animation polish.
- Persistent rail preferences.

    ## Routes affected
    - `(app)` authenticated layout
- `/chat` placeholder
- `/documents` placeholder
- `/database-visualize` placeholder
- `/forbidden`
- global Settings dialog surface

    ## Frontend modules
    - `features/navigation/AppShell.tsx`
- `features/navigation/SideRail.tsx`
- `features/settings/SettingsDialog.tsx`
- `features/settings/settings-dialog-state.ts`
- `components/shared/ForbiddenState.tsx`

    ## API contracts consumed
    - `GET /auth/me` only.

    ## Data models
    - Current user role.
- Navigation definition: id/label/href/icon/adminOnly.
- Dialog route key: local UI state only.

    ## Authorization behavior
    Layout requires authenticated session. Member: show non-admin nav only. Admin: show all allowed nav. Direct admin route must render forbidden state; API remains backend-protected.

    ## UI states
    - Loading: session skeleton / rail placeholders.
- Empty: route placeholders state scope.
- Error: session fetch failure -> safe auth handling.
- Unauthenticated: login redirect.
- Forbidden: preserved URL + explicit message.
- Success: rail/content/dialog behavior works.

## UI parity
- Confirmed: v1 root mounts AppLayout + global SettingsDialog + toaster; rail exposes Chat/Documents/Knowledge Graph/Settings.
- Confirmed: existing SettingsDialog uses focus restore, Radix dialog semantics, ~220px desktop nav, admin-filtered provider/parser links.
- Verify whether `/settings/users` is active production route versus compatibility path; target supports it as forbidden/redirect-compatible.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Current parity: approximately `w-14` left rail; logo top; stacked compact icon items; Settings trigger.', 'White/light-neutral canvas, thin borders, tiny radius, quiet active tint.', 'Desktop Settings: ~220px nav + content. Mobile: one-column dialog/sheet fallback.']

    ## Acceptance criteria
    - Route layout obtains `currentUser` once from session context.
- Navigation config is canonical module. No scattered `role === 'admin'` checks for nav.
- Dialog coordinator owns open/close/section. Panels stay feature-local.

    ## Tests
    - Admin and member see same base rail structure.
- Admin-only Settings sections hidden from member.
- Direct admin route as member displays forbidden, not blank/crash.
- Settings opens General placeholder; Escape/overlay close; focus returns to trigger.
- No credential persisted in browser storage.

    ## Files to create
    - Success: admin and member rail snapshots.
- Validation: n/a.
- Unauthenticated: app layout redirects login.
- Unauthorized: member direct `/settings/users` or target admin route forbidden.
- Network/API: `/auth/me` 401 clears session; other error safe retry.
- Edge: opening dialog from keyboard returns focus after Escape.

    ## Files to modify
    - `app/(app)/layout.tsx`
- `features/navigation/AppShell.tsx`
- `features/navigation/SideRail.tsx`
- `features/navigation/navigation.ts`
- `features/settings/SettingsDialog.tsx`
- `features/settings/settings-dialog-state.ts`
- `app/forbidden/page.tsx`
- `tests/navigation/app-shell.test.tsx`
- `tests/settings/dialog-a11y.test.tsx`

    ## Deliberately not added
    - root providers
- route placeholders

    ## Dependencies
    - Admin data calls.
- Global app business store.
- Browser credential persistence.
- Generic permission engine.

    ## Evidence / verification
    - 02 Login + Cookie Session.
