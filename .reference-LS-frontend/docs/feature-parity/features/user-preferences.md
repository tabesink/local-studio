# Feature: User Preferences

## Purpose

User preferences in the reference are local UI preferences, not account settings. They cover theme, font family, font size, UI scale, radius, custom color tokens, file viewer font size, and sidebar preferences.

## Current Code Map

- `store.ts`: persisted theme/sidebar/file viewer preferences.
- `features/settings/appearance-settings.tsx`: theme mode, theme picker, color editor, font/scale/radius controls.
- `lib/themes.ts`, `lib/themes-data.ts`: theme metadata and token sets.
- `lib/theme-runtime.ts`: applies theme/font/scale/radius to document and bootstraps before hydration.
- `lib/desktop-ui-preferences.ts`: durable desktop bridge sync with localStorage fallback.
- `features/shell/left-sidebar.tsx`: persisted sidebar open/width.

## User Workflow

1. App boot script applies stored theme/font/control tokens before React hydration.
2. User opens Settings > Appearance.
3. User chooses light/dark/system mode, active theme, font family, font size, UI scale, radius, or custom colors.
4. Store setters apply changes to the document immediately and persist.
5. Durable desktop preference save is scheduled.
6. Sidebar open/width changes persist separately through the same app store.

Loading: preference UI renders current defaults immediately. Empty: no custom theme means active theme tokens are used. Error: storage errors are ignored with local fallback. Final UI: document CSS variables update live.

## UI/UX Parity Notes

- Appearance uses `ListGroup` and `ListRow`, not standalone cards.
- Theme mode is a segmented control with Light/Dark/System.
- Theme swatches are tiny bordered squares.
- Color editor fields are compact token rows.
- Advanced token groups are collapsible/searchable.
- Keep Geist and Geist Mono defaults.
- No profile, avatar, billing, org, or account security screens exist in source.

## ASCII Mockup

```txt
+ Theme -----------------------------------------------+
| Active theme           Zai Dark [swatches] active     |
| mode                   [Light][Dark][System]          |
+------------------------------------------------------+
+ Theme editor ----------------------------------------+
| Accent                 [color input]                  |
| Background             [color input]                  |
+------------------------------------------------------+
+ Typography / density --------------------------------+
| Font family            Geist                          |
| UI font size           [slider]                       |
| UI scale               [slider]                       |
| Radius                 [slider]                       |
+------------------------------------------------------+
```

## Proposed Folder Structure

```txt
features/user-preferences/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `UserPreferencesDemo`: appearance and sidebar preference demo.
- `ThemeModeControl`: light/dark/system segmented control.
- `ThemeList`: grouped theme rows and swatches.
- `TokenEditor`: compact color fields.
- `DensityControls`: font size, scale, radius sliders.
- `SidebarPreferencePreview`: open/width/file font size preview.

## API Contracts

No remote API contract is confirmed for user/account preferences. Reference persistence is local:

- `local-studio-state`: Zustand persisted store.
- `local-studio.uiControls`: scale/radius CSS controls.
- `local-studio.customThemeTokens`: custom token editor.
- Desktop durable bridge sync in `desktop-ui-preferences.ts`.

Do not invent `/api/user`, `/api/account`, or profile endpoints.

## State Model

- Zustand persisted: `themeId`, `fontFamilyId`, `fontSizeId`, `desktopSidebarPinnedOpen`, `sidebarWidth`, `fileViewerFontSize`.
- Local React: search query, expanded theme groups, custom token active flag.
- CSS variables: applied on `document.documentElement`.
- Durable desktop bridge: best-effort mirror, not required for web demo.

## Types / Schemas

```ts
export type ThemeMode = "light" | "dark" | "system";

export interface ThemeTokens {
  bg: string;
  fg: string;
  surface: string;
  border: string;
  accent: string;
  dim: string;
  err: string;
}

export interface UiPreferences {
  themeId: string;
  fontFamilyId: string;
  fontSizeId: string;
  uiScale: number;
  radiusBase: number;
  sidebarWidth: number;
}
```

## Implementation Steps

1. Implement a tiny localStorage-backed preference hook.
2. Apply theme tokens to document variables.
3. Render the appearance section using settings/list primitives.
4. Add mode, theme, token, font, scale, radius, and sidebar preview controls.
5. Keep account settings explicitly out of scope.

## Copy / Modify Map

- Copy behavior from `appearance-settings.tsx`, `store.ts`, `theme-runtime.ts`.
- Reuse theme constants from `themes.ts` if available.
- Modify durable desktop sync out of the web demo.
- Do not copy unrelated connection/system settings.

## Acceptance Criteria

- Preferences apply live and survive reload.
- Light/dark/system mode works.
- Custom token edits update the visible demo.
- Sidebar width/open preview persists.
- Docs clearly state no account model exists in source.

## Anti-Overengineering Notes

Do not create user accounts, settings APIs, remote sync, theme marketplaces, or a design-token editor framework. Use local preferences only.
