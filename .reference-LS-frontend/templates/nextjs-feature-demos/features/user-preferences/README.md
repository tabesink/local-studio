# User Preferences Demo Slice

Carbon copy of the appearance settings: Light/Dark/System segmented control, theme rows with tiny bordered four-color swatch strips using the real theme catalogue (Codex Dark, Codex Light, Sky, Violet, Emerald, Rose), a compact token color editor with reset, font family select, and UI font size / UI scale / radius sliders. Preferences persist to `localStorage` and apply live to document CSS variables (`data-theme`, `--ui-scale`, `--radius-base`).

Source guide: `docs/feature-parity/features/user-preferences.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| `components/user-preferences-demo.tsx` | `features/settings/appearance-settings.tsx` |
| theme catalogue + swatches | `lib/themes-data.ts` (`THEMES`, `createTheme`) |
| live variable application | theme runtime bootstrap behavior (`theme-runtime.ts`) |

Local-only preference — the reference has no account API for this either.
