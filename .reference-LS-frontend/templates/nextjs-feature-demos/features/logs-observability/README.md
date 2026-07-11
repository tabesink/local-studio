# Logs / Observability Demo Slice

Carbon copy of the logs and server console screens: an 18rem session sidebar (filter on top, selectable session rows with backend badges), a mono content pane with severity coloring (ERROR red, WARN amber), header controls (auto-refresh, auto-scroll, content filter, refresh / download / delete icons), and a `/server` mode with a status aside plus Server Logs / API Docs tabs.

Source guide: `docs/feature-parity/features/logs-observability.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| logs split view | `features/logs/logs-view.tsx` |
| server console mode | `features/server/server-view.tsx` |
| severity line coloring | log line renderer in `logs-view.tsx` |
| auto-refresh stream | SSE `logs/{id}/stream` behavior, simulated with an interval over fixtures |

The controller session cannot be deleted, matching the reference guard.
