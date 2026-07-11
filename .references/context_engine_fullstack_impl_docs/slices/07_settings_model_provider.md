# Slice 07 — Settings Dialog — Model Provider

## User outcome
Admin lists/edits/tests/activates model profiles; sees secret configured status only; no provider secret reaches browser.

## In scope
- Admin-only Provider panel.
- List settings/profile/default data from `GET /admin/ai-settings`.
- Create/edit profile forms using verified fields; action controls test, validate, activate.
- Secret reference form writes via dedicated secret endpoint, then refetches status.
- Render provider capabilities and current activation state.

## Explicitly out of scope
- Secret value display/readback.
- Client-side provider calls.
- Broad provider plugin system.
- Per-message provider override unless contract proves it.
- Live usage/cost dashboard.

## Routes affected
- global Settings dialog section `provider`

## Frontend modules
- `features/settings/providers/ProviderPanel.tsx`
- `ProviderProfileForm.tsx`
- `ProviderSecretsForm.tsx`
- `api.ts`
- `types.ts`

## API contracts consumed
- `GET /admin/ai-settings`
- `PUT /admin/ai-settings/defaults`
- `POST /admin/ai-settings/profiles`
- `PATCH /admin/ai-settings/profiles/{id}`
- `POST .../{id}/test`
- `POST .../{id}/validate`
- `POST .../{id}/activate`
- `PUT|POST|DELETE /admin/ai-settings/provider-secrets`

## Data models
- Provider profile: id, kind, provider, display_name, model, base_url, api_key_env_var, api_key_status, enabled/default, config fields.
- Secret status only. Never `api_key` value.

## Authorization behavior
Admin only. Backend validates all provider config, secret writes, tests, activation. Member UI has no route/action. Redact error strings that contain provider URLs/credentials only if server cannot guarantee safety.

## UI states
- Loading: profile list skeleton.
- Empty: no profiles; create profile.
- Error: compact safe error + retry.
- Unauthenticated: shell redirect.
- Forbidden: no panel/direct route forbidden.
- Success: toast/refetch profile state.
- Validation: field-level API schema errors.
- Test/validate: pending/success/failure inline result.

## UI parity and Local Studio transfer
- Confirmed: v1 exposes listed AI-settings profile/default/test/validate/activate/secret endpoints.
- Confirmed: architecture states profiles/secrets backend-owned and UI receives secret status only.
- Verify exact profile fields per active OpenAPI; do not hard-code undocumented enum values.

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

- Settings panel title + profile list left/stack, editor right or modal. Keep dense.
- Secret field says configured/not configured; never mask a returned secret because no secret should exist client-side.
- Activation uses explicit current/default badge.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Feature API wrapper maps wire DTO to UI form model.
- Separate profile metadata mutation from secret mutation.
- Disable action while mutation pending; no optimistic activation.

## Tests
- Member cannot access panel.
- Admin can create/edit/test/validate/activate profile with safe feedback.
- Secret status updates after mutation; secret value never rendered/logged.
- Failed test preserves editor draft and server validation result.

## Test scenarios to create
- Success: profile list/create/edit/activate fixture.
- Validation: invalid model/base URL/required field from API.
- Unauthenticated: session expiry response.
- Unauthorized: member endpoint 403.
- Network/API: test timeout/failure preserves form.
- Edge: secret update succeeds but refetch fails -> state says refresh needed, never assumes secret.

## Files to modify
- `features/settings/providers/api.ts`
- `types.ts`
- `ProviderPanel.tsx`
- `ProviderProfileForm.tsx`
- `ProviderSecretsForm.tsx`
- `tests/settings/providers.test.tsx`

## Deliberately not added
- Settings route registry

## Dependencies
- Secret read API.
- Frontend provider SDK.
- Plugin framework.
- Cost accounting UI.

## Evidence / verification
- 03 App Shell.
- 01 API/Error Foundation.
