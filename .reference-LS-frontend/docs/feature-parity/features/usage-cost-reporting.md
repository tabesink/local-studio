# Feature: Usage / Cost Reporting

## Purpose

Usage reporting shows token/request totals, recent activity, cache rates, daily usage, model performance, latency details, and secondary metrics. It appears at `/usage`.

## Current Code Map

- `app/usage/page.tsx`: exports `features/usage/usage-page`.
- `features/usage/usage-page.tsx`: tab selector, header stats, chart, table, details.
- `features/usage/use-usage.ts`: loads stats and peak metrics, sorting, row expansion.
- `features/usage/normalize-usage-stats.ts`: defensive normalization for unknown/missing fields.
- `features/usage/daily-usage-chart.tsx`: daily chart by model.
- `features/usage/model-performance-table.tsx`: sortable expandable model rows.
- `features/usage/performance-details.tsx`, `secondary-metrics.tsx`: details panels.
- `lib/api/system.ts`: `/usage`, `/usage/pi-sessions`, `/peak-metrics`.

## User Workflow

1. User opens `/usage`.
2. Default source tab is `provider`.
3. `useUsage` loads usage stats and peak metrics in parallel.
4. Response is normalized to stable defaults.
5. User switches source to `pi-sessions`, triggering reload.
6. User sorts table fields or expands model rows.
7. Refresh button reloads current source.

Loading: `PageState` renders loading. Empty: no stats returns empty state. Error: `PageState` renders retry. Final UI: totals header, chart, table, details.

## UI/UX Parity Notes

- Compact top source selector with pill `Tabs`.
- Header has uppercase "Usage" label, large mono token total, compact request/session/user line.
- Header stat strip is a bordered `dl`, six columns on large screens.
- Chart and tables use restrained token colors, not marketing colors.
- Table sorting toggles asc/desc when clicking the same field.
- Expanded rows show peak metrics and model details.

## ASCII Mockup

```txt
source [Provider] [Pi sessions]

USAGE controller                         [refresh]
12,345,678 tokens
9,876 requests | 321 sessions | 1 users

prompt | completion | success | 24h req | avg tokens | cache

+ daily usage chart ----------------------------------------+

+ model performance table ----------------------------------+
| model | req | tokens | success | latency | ttft | speed |
| llama | ...                                           [v] |
+-----------------------------------------------------------+

+ performance details --------+ + secondary metrics --------+
```

## Proposed Folder Structure

```txt
features/usage-cost-reporting/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `UsageCostReportingDemo`: source tabs and report layout.
- `UsageHeader`: total tokens and stat strip.
- `DailyUsageChart`: compact chart from fixture daily stats.
- `ModelPerformanceTable`: sort and expand rows.
- `PerformanceDetails`: latency/TTFT/tokens per request.
- `SecondaryMetrics`: cache, hourly pattern, controller stats.

## API Contracts

| Endpoint | Method | Source | Request | Response | Error/Auth |
| --- | --- | --- | --- | --- | --- |
| `/usage` | GET | `lib/api/system.ts` | none | `UsageStats` | normalized API error |
| `/usage/pi-sessions` | GET | `lib/api/system.ts` | none | `UsageStats` | same shape |
| `/peak-metrics` | GET | `lib/api/system.ts` | optional `model_id` query | `{ metrics?: PeakMetrics[], error? }` | failures ignored as empty metrics |

All browser calls use the standard API client/proxy. No polling in this feature.

## State Model

- Local React: active source tab, loading, error, expanded row set, sort field, sort direction.
- Server data: current `UsageStats`, `Map<string, PeakMetrics>`.
- Derived memo state: daily-by-model map, models for chart, sorted model list.

## Types / Schemas

```ts
export type UsageSource = "provider" | "pi-sessions";
export type SortDirection = "asc" | "desc";

export interface UsageTotals {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  unique_sessions: number;
  unique_users: number;
}

export interface ModelUsageRow {
  model: string;
  requests: number;
  successful: number;
  success_rate: number;
  total_tokens: number;
  avg_latency_ms: number | null;
  avg_ttft_ms: number | null;
  tokens_per_sec: number | null;
}
```

## Implementation Steps

1. Port the `UsageSource`, sort, and expansion state.
2. Add fixture `UsageStats` for provider and pi-sessions.
3. Implement `normalizeUsageStats` subset needed by the demo.
4. Build the header, chart, table, and details components.
5. Wire refresh and source-tab reload through typed mock API calls.

## Copy / Modify Map

- Copy data flow from `use-usage.ts`.
- Copy defensive defaults from `normalize-usage-stats.ts`.
- Copy visual hierarchy from `usage-page.tsx`.
- Modify chart to a minimal CSS/SVG-free bar visualization if no chart library exists.

## Acceptance Criteria

- Source tabs reload stats.
- Loading, error, empty, and success states render.
- Sorting and row expansion work.
- Header totals use normalized safe defaults.
- No unrelated dashboard or model-launch controls appear.

## Anti-Overengineering Notes

Do not add billing providers, price books, exports, or custom chart frameworks. This slice reports usage only.
