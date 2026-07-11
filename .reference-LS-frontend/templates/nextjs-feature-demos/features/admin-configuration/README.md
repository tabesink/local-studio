# Admin Configuration Demo Slice

Carbon copy of the admin/config surfaces behind Settings: System fact groups (Controller state, Network, Storage, Hardware), the Engines panel (runtime targets with install/update actions plus runtime jobs with status pills and cancel), the Plugins manager (installed MCP server rows, manual add row, MCP JSON textarea, curated one-click installs), Skills per-source counts, and Setup checks.

Source guide: `docs/feature-parity/features/admin-configuration.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| System tab | `features/settings/system-settings-section.tsx` |
| Engines tab | `features/settings/engines-section.tsx` |
| Plugins tab | `features/plugins/plugins-page.tsx` |
| Skills / Setup tabs | skills + setup sections under `features/settings/` |

All mutations are local state over fixtures; no controller writes.
