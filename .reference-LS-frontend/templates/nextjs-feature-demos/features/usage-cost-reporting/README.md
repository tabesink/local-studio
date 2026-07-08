# Usage / Cost Reporting Demo Slice

Carbon copy of the usage analytics page: Provider / Pi sessions source pill tabs, uppercase USAGE header with a large mono token total and requests/sessions/users line, six-column bordered stat strip with mono detail lines, daily usage chart (stacked prompt/completion CSS bars with date + request captions), sortable and expandable model performance table with color chips and toned success/latency values, and Performance details + Secondary metrics panels.

Source guide: `docs/feature-parity/features/usage-cost-reporting.md`.

## Reference copy map

| This slice | Reference (`.references/local-studio/frontend/src`) |
| --- | --- |
| page layout + header + stat strip | `features/usage/usage-page.tsx` (`HeaderStat`) |
| daily chart | `features/usage/daily-usage-chart.tsx` |
| model table | `features/usage/model-performance-table.tsx` (`SortHeader`, `ExpandedCell`, toned values) |
| chart colors | `--color-usage-chart-1..6` tokens from `app/styles/globals/tokens.css` |

All aggregation is precomputed in fixtures; no analytics backend.
