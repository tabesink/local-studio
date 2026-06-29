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

## UI parity
- Confirmed: v1 exposes listed AI-settings profile/default/test/validate/activate/secret endpoints.
- Confirmed: architecture states profiles/secrets backend-owned and UI receives secret status only.
- Verify exact profile fields per active OpenAPI; do not hard-code undocumented enum values.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Settings panel title + profile list left/stack, editor right or modal. Keep dense.', 'Secret field says configured/not configured; never mask a returned secret because no secret should exist client-side.', 'Activation uses explicit current/default badge.']

    ## Acceptance criteria
    - Feature API wrapper maps wire DTO to UI form model.
- Separate profile metadata mutation from secret mutation.
- Disable action while mutation pending; no optimistic activation.

    ## Tests
    - Member cannot access panel.
- Admin can create/edit/test/validate/activate profile with safe feedback.
- Secret status updates after mutation; secret value never rendered/logged.
- Failed test preserves editor draft and server validation result.

    ## Files to create
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
