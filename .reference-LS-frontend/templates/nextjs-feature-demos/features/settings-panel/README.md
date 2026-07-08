# Settings Panel Demo Slice

Carbon copy of Local Studio's settings surface: `SettingsLayout` two-column shell (sticky left `SectionNav` with sky accent bar, 640px content column), the exact seven sections — Connection (`Cable`), System (`Cpu`), Appearance (`Paintbrush`), Archived chats (`Archive`), Plugins (`Plug`), Skills (`GraduationCap`), Setup (`ServerCog`) — and hash-style section selection via `history.replaceState`.

Source guide: `docs/feature-parity/features/settings-panel.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| section list + icons + descriptions | `features/settings/settings-view.tsx` |
| `SettingsLayout` / `SettingsGroup` / `SettingsRow` (via `_shared/ui`) | `ui/settings.tsx`, `ui/page.tsx`, `ui/list.tsx` |
| System fact groups | `features/settings/system-settings-section.tsx` |
| Connection rows | `features/settings/api-connection-section.tsx` (full behavior in `environment-controls`) |

Deep section behavior lives in sibling slices: `environment-controls` (Connection), `user-preferences` (Appearance), `admin-configuration` (System/Engines/Plugins/Skills/Setup).
