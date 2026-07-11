# Feature: Settings Panel

## Purpose

The settings panel is the structured configuration surface for connection, system, appearance, archived chats, plugins, skills, and setup checks. It appears at `/settings`; `/configs` redirects there.

## Current Code Map

- `app/settings/page.tsx`: decides between setup wizard and `SettingsView`.
- `features/settings/use-settings.ts`: loads `/api/settings`, `/config`, `/compat`, tests and saves connection settings.
- `features/settings/settings-view.tsx`: section nav, hash selection, section router.
- `ui/settings.tsx`: `SettingsLayout`, `SettingsGroup`, `SettingsRow`, `SettingsButton`, `SettingsInput`, notices.
- `features/settings/api-connection-section.tsx`: controller list and active connection actions.
- `features/settings/system-settings-section.tsx`: services, URLs, controller/system facts.
- `features/settings/appearance-settings.tsx`: theme/font/scale/radius controls.
- `features/settings/agent-settings-sections.tsx`: archived chats, skills, setup checks.

## User Workflow

1. User opens `/settings` or `/settings#section`.
2. Page runs `useSettings`, loading API settings and controller config in parallel.
3. If no hash, backend offline, setup incomplete, and no config data, page shows setup wizard.
4. Otherwise `SettingsView` renders `SettingsLayout`.
5. Selecting a section updates React state and `window.history.replaceState(..., #section)`.
6. Refresh reloads `/config` and `/compat`.
7. Each section handles its own local inputs and save/test actions.

Loading: layout status says `checking controller` or `refreshing`; section actions show spinners. Empty: sections use fallback rows, never blank pages. Error: system rows show fallback mode and notices. Final UI: active section content appears in the right column with dense list groups.

## UI/UX Parity Notes

- Two-column desktop layout: left sticky section nav, right content.
- Mobile collapses to top section buttons above content.
- `PageHeader` eyebrow and title reflect active section.
- `ListGroup` frames settings rows with compact separators.
- Rows are two-column at medium widths and stacked on small screens.
- Active section has a slim accent bar and icon color.
- Settings panel is not a modal in the reference.

## ASCII Mockup

```txt
+--------------------+----------------------------------+
| Settings      [r]  | SETTINGS                         |
| > Connection       | Connection                       |
|   System           | + Controllers -----------------+ |
|   Appearance       | | active row, saved rows, add  | |
|   Archived chats   | +------------------------------+ |
|   Plugins          | + Connection ------------------+ |
|   Skills           | | Test | Save active           | |
|   Setup            | +------------------------------+ |
+--------------------+----------------------------------+
```

## Proposed Folder Structure

```txt
features/settings-panel/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `SettingsPanelDemo`: entry component with fixture data.
- `SettingsLayout`: section nav plus active section region.
- `SettingsSectionNav`: route/hash-like local section switching.
- `SettingsGroup` and `SettingsRow`: re-export or wrap shared list primitives.
- Section components: `ConnectionSection`, `SystemSection`, `AppearanceSection`, `ArchiveSection`, `PluginsSection`, `SkillsSection`, `SetupSection`.

## API Contracts

| Endpoint | Method | Source | Request | Response | Error/Auth |
| --- | --- | --- | --- | --- | --- |
| `/api/settings` | GET | `app/api/settings/route.ts` | none | `{ backendUrl, apiKey, hasApiKey, voiceUrl, voiceModel }` | 500 `{ error, details }` |
| `/api/settings` | POST | `app/api/settings/route.ts` | partial API settings | `{ success, backendUrl, apiKey, hasApiKey, voiceUrl, voiceModel }` | requires `requireApiAccess`; 400 invalid URL; 500 save error |
| `/config` | GET | `lib/api/system.ts` | none | `ConfigData` | normalized API `Error.message` |
| `/compat` | GET | `lib/api/system.ts` | none | `CompatibilityReport` | compat failure may be ignored while config loads |

Settings page also embeds plugin/skill/archive sections that call their own endpoints; document those in admin/user-specific slices rather than duplicating here.

## State Model

- Local React: active section, loading flags, errors, form drafts.
- URL hash: selected section.
- Browser storage: setup-complete flag and connection settings through environment-controls.
- Server: `/api/settings` persisted settings file.
- Global UI store: appearance controls via user-preferences.

## Types / Schemas

```ts
export type SettingsSectionId =
  | "connection"
  | "system"
  | "appearance"
  | "archive"
  | "plugins"
  | "skills"
  | "setup";

export interface SettingsSectionDef {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: string;
}

export interface ApiConnectionSettings {
  backendUrl: string;
  apiKey: string;
  hasApiKey: boolean;
  voiceUrl: string;
  voiceModel: string;
}
```

## Implementation Steps

1. Create static section definitions matching `settings-view.tsx`.
2. Implement hash-based section selection with a local fallback.
3. Build shared settings row/group wrappers from `_shared/ui`.
4. Wire fixture-backed config/settings API calls.
5. Delegate detailed connection behavior to `environment-controls`.
6. Delegate appearance behavior to `user-preferences`.

## Copy / Modify Map

- Copy layout and section ideas from `settings-view.tsx` and `ui/settings.tsx`.
- Reuse `ListGroup`, `ListRow`, `StatusPill`, `RefreshIconButton` concepts.
- Modify sections to fixture-backed panels.
- Do not copy setup wizard into the settings-panel slice.

## Acceptance Criteria

- All seven section labels and hash behavior work.
- Loading/fallback/error states keep the page populated.
- Section nav matches compact Local Studio styling.
- Settings docs reference environment-controls and user-preferences for owned behavior.

## Anti-Overengineering Notes

Do not make a generic settings framework. The section list is static and local to this app.
