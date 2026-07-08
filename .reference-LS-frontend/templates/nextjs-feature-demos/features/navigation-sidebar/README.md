# Navigation Sidebar Demo Slice

Carbon copy of the Local Studio workbench left rail: desktop resize (188–320px, default 224px), collapse to a floating `PanelLeftOpen` button, Cmd/Ctrl+K session search overlay, mobile top app bar with right slide-in drawer, workspace nav rows, and project rows. Width and open state persist to `localStorage`.

Source guide: `docs/feature-parity/features/navigation-sidebar.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| `components/navigation-sidebar-demo.tsx` | `features/shell/left-sidebar.tsx` (rail geometry, rows, drawer, search) |
| `hooks/use-navigation-sidebar.ts` | sidebar prefs + resize handlers in `left-sidebar.tsx` |
| nav labels/icons (`Status/Usage/Models/Plugins/Server`) | tab list in `left-sidebar.tsx` (`Gauge`, `Microchip`, `HardDrive`, `Plug`, `Globe`) |
| row grammar (h-8, rounded-md, left hairline accent) | `left-sidebar.tsx` `NavItemDesktop` equivalent |

Keep surrounding app state minimal. Use this slice when implementing global shell/navigation only.
