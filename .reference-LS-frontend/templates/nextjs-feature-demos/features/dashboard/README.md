# Dashboard Demo Slice

Carbon copy of Local Studio's operator dashboard: one continuous telemetry sheet with the status header (Active/Standby dot, backend/platform/port tags, model name), Launch dropdown + Logs/Bench actions, six-column mono metric strip, runtime fact grid, aggregate GPU strip with expandable per-GPU rows, bordered mono controller log tail, and a launch progress toast. A demo-only segmented control switches fixture scenarios (running / idle / launching / offline / no GPU).

Source guide: `docs/feature-parity/features/dashboard.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| `components/dashboard-demo.tsx` layout | `features/dashboard/control-panel/control-panel-v2.tsx` |
| status header + metric strip | `features/dashboard/control-panel/status-section-parts.tsx` (`StatusHeader`, `StatusMetricStrip`, `RuntimeMetricGrid`, `Tag`, `ActionBtn`) |
| GPU section | `features/dashboard/control-panel/gpu-section.tsx` (aggregate row, `GpuRow`) |
| controller matrix | `ControllerMatrix` / `ControllerTab` in `control-panel-v2.tsx` |
| log tail | `ActivityStrip` in `control-panel-v2.tsx` |

Do not add a fake controller server. Use typed snapshots and async mock actions.
