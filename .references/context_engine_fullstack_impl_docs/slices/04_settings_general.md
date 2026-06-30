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

## UI parity and Local Studio transfer
- Confirmed: v1 has General Settings panel surface.
- Unknown: canonical general-settings read/write contract. Treat all non-user fields as no-op until API proof.

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

- Settings left rail active General. Right panel uses title, quiet divider, stacked form rows.
- No fake save button without backend persistence.
- Use disabled/read-only field styling with reason.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Panel takes current user as input; no independent auth fetch.
- Only add `generalApi` when an actual backend endpoint exists.
- Keep panel under 1 route-specific module.

## Tests
- General panel opens via Settings trigger.
- Verified account data renders.
- Unsupported preferences are clearly absent, not mocked.
- No network write occurs without real contract.

## Test scenarios to create
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
