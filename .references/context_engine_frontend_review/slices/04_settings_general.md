# Slice 04 — Settings Dialog — General

    ## User outcome
    User opens General panel, sees stable account/app preference placeholders or verified editable settings.

    ## In scope
    - Replace General placeholder with feature-owned panel.
- Define only fields backed by verified API. Use read-only facts when no contract exists.
- Handle dialog section selection and unsaved form state locally.
- Use form validation per visible field.

    ## Explicitly out of scope
    - User management.
- Provider/parser/domain configuration.
- Invented preference persistence.
- Cross-device preference sync.

    ## Routes affected
    - global Settings dialog, section `general`

    ## Frontend modules
    - `features/settings/general/GeneralSettingsPanel.tsx`
- `features/settings/general/schema.ts`

    ## API contracts consumed
    - No confirmed general-settings endpoint. Use `/auth/me` for verified current-user read data.

    ## Data models
    - CurrentUser read model.
- Optional GeneralSettings DTO only after backend contract exists.

    ## Authorization behavior
    Authenticated users. Do not expose admin controls. Any future write endpoint must authorize server-side.

    ## UI states
    - Loading: current user skeleton.
- Empty: no configurable general settings message.
- Error: current user load error.
- Unauthenticated: dialog unavailable.
- Forbidden: n/a base panel.
- Success: account/session facts or verified fields.

## UI parity
- Confirmed: v1 has General Settings panel surface.
- Unknown: canonical general-settings read/write contract. Treat all non-user fields as no-op until API proof.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Settings left rail active General. Right panel uses title, quiet divider, stacked form rows.', 'No fake save button without backend persistence.', 'Use disabled/read-only field styling with reason.']

    ## Acceptance criteria
    - Panel takes current user as input; no independent auth fetch.
- Only add `generalApi` when an actual backend endpoint exists.
- Keep panel under 1 route-specific module.

    ## Tests
    - General panel opens via Settings trigger.
- Verified account data renders.
- Unsupported preferences are clearly absent, not mocked.
- No network write occurs without real contract.

    ## Files to create
    - Success: current user rendered.
- Validation: only when real editable field added.
- Unauthenticated: unavailable via shell guard.
- Unauthorized: n/a.
- Network/API: `/auth/me` failure safe state.
- Edge: switching Settings sections preserves no hidden fake draft.

    ## Files to modify
    - `features/settings/general/GeneralSettingsPanel.tsx`
- `tests/settings/general.test.tsx`

    ## Deliberately not added
    - `features/settings/SettingsDialog.tsx`

    ## Dependencies
    - Local persistence.
- Theme switcher.
- Notification controls.
- Account edits without contract.

    ## Evidence / verification
    - 03 App Shell.
