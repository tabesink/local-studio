# Feature: Dashboard

## Purpose

The dashboard is the operator status page. It shows controller reachability, active model/process status, launch/benchmark controls, runtime metrics, GPU telemetry, and a compact controller log tail. It appears at `/` via `app/page.tsx`.

## Current Code Map

- `app/page.tsx`: exports `features/dashboard/dashboard-page`.
- `features/dashboard/dashboard-page.tsx`: calls `useDashboardData` and renders `DashboardLayout`.
- `features/dashboard/use-dashboard-data.ts`: composes realtime status, recipes, lifecycle, and actions.
- `hooks/realtime-status-store.ts`: single owner for controller status, metrics, GPUs, launch progress, services, polling fallback.
- `features/dashboard/control-panel/control-panel-v2.tsx`: controller matrix, status section, GPU section, activity strip.
- `features/dashboard/control-panel/status-section*.tsx`: header, metrics, trends, model launch dropdown.
- `features/dashboard/control-panel/gpu-section.tsx`: aggregate GPU strip and expanded rows.
- `features/dashboard/use-model-lifecycle.ts`: launch/evict lifecycle state.
- `features/dashboard/use-dashboard-recipes.ts`: recipes plus log-session selection and 4s log polling.

## User Workflow

1. User opens `/`.
2. `useRealtimeStatus` reads the global status snapshot fed by controller SSE and 5s polling fallback.
3. `useDashboardRecipes` loads recipes, chooses the running recipe, selects a relevant log session, and polls logs every 4s while a process is active.
4. `useModelLifecycle` derives `idle`, `starting`, `ready`, or `error` from process and launch progress.
5. User can switch saved controllers, launch a recipe, open logs, run benchmark, create/view models, and expand/collapse GPU rows.
6. Launch calls `POST /launch/{recipeId}`; benchmark calls `POST /benchmark?prompt_tokens=1000&max_tokens=100`.
7. Final UI updates through status polling/SSE and recipe/log reloads.

Loading: show status loading/connecting states and empty metrics. Empty: no GPUs shows a zero GPU strip; no process shows idle state. Error: controller matrix marks offline/auth required; lifecycle stores launch errors; benchmark uses alert in reference. Final UI: continuous telemetry sheet, not cards.

## UI/UX Parity Notes

- Full page `bg-background text-foreground`, max width around `86rem`.
- No outer dashboard card. Use sections, hairline separators, compact mono stats.
- Controller matrix only appears when more than one controller exists.
- Status header has model/backend/platform/port, launch dropdown, benchmark and logs actions.
- GPU section is a single aggregate row with thin bar and optional expanded rows.
- Activity strip is a bordered mono log tail with max height.
- Launch toast appears during model startup.

## ASCII Mockup

```txt
+------------------------------------------------------------+
| controller tabs (only when >1 saved controller)             |
+------------------------------------------------------------+
| STATUS    model name                    [Launch] [Bench]    |
| backend/port/platform                                      |
| tokens/s | ttft | requests | cache | memory                 |
| trends: tiny dense graph rows                               |
+------------------------------------------------------------+
| GPUs 4  [====        ] 42.1/96G  util 63% temp 71 pwr 550W |
|   G0 model...     [==] 10/24G  70% 72 140W                 |
+------------------------------------------------------------+
| CONTROLLER LOGS                                      120    |
| 2026... started model...                                  |
| ...                                                        |
+------------------------------------------------------------+
```

## Proposed Folder Structure

```txt
features/dashboard/
  components/
  hooks/
  api/
  types/
  fixtures/
  constants/
  index.ts
```

## Components

- `DashboardDemo`: feature entry, owns fixture scenario controls.
- `ControllerMatrix`: saved controller status tabs.
- `StatusSection`: active process and launch/benchmark actions.
- `GpuSection`: aggregate and expanded GPU telemetry rows.
- `ActivityStrip`: recent controller logs.
- `LaunchToast`: launch progress surface.

## API Contracts

| Endpoint | Method | Source | Request | Response | Retry/Polling/Auth |
| --- | --- | --- | --- | --- | --- |
| `/status` | GET | `lib/api/system.ts`, `hooks/realtime-status-store.ts` | none | `{ running, process, inference_port, launching }` | 5s poll fallback, timeout 5s, no retries |
| `/gpus` | GET | `lib/api/system.ts` | none | `{ gpus: GPU[] }` | polled with status |
| `/v1/metrics/vllm` | GET | `lib/api/system.ts` | none | `Metrics` | errors ignored to preserve last metrics |
| `/compat` | GET | `lib/api/system.ts` | none | `CompatibilityReport` | timeout 5s |
| `/recipes` | GET | `lib/api/recipes.ts` | none | `{ recipes: RecipeWithStatus[] }` | reload on recipe events |
| `/logs` | GET | `lib/api/logs.ts` | none | `{ sessions: LogSession[] }` | dashboard selects newest relevant |
| `/logs/{sessionId}?limit=220` | GET | `lib/api/logs.ts` | none | `{ logs: string[] }` | 4s polling while running |
| `/launch/{recipeId}` | POST | `lib/api/system.ts` | path id | `{ success, pid?, message }` | no retries |
| `/evict` | POST | `lib/api/system.ts` | none | `{ success, evicted_pid? }` | default client retry |
| `/benchmark?prompt_tokens=1000&max_tokens=100` | POST | `lib/api/system.ts` | query | benchmark payload or `{ error }` | alert on failure |

Browser requests go through `/api/proxy` and include controller URL/API key headers from `lib/api/core.ts`.

## State Model

- Global external store: realtime status snapshot.
- Local React: benchmarking, expanded GPU rows, controller matrix snapshots.
- Server/cache: recipes and logs loaded through API client.
- Persisted browser state: saved controllers and active backend URL from environment-controls.
- No TanStack Query in reference.

## Types / Schemas

```ts
export type LifecycleStatus = "idle" | "starting" | "ready" | "error";

export interface DashboardSnapshot {
  connected: boolean;
  status: ControllerStatus | null;
  metrics: Metrics | null;
  gpus: GPU[];
  launchProgress: LaunchProgress | null;
  logs: string[];
}

export interface ControllerStatus {
  running: boolean;
  process: ProcessInfo | null;
  inference_port: number;
  launching: string | null;
}
```

## Implementation Steps

1. Build fixture snapshots for offline, idle, running, launching, auth-required, and no-GPU states.
2. Implement a `useDashboardDemo` hook that mimics polling by swapping snapshots.
3. Rebuild the continuous control panel layout using shared primitives and token classes.
4. Wire Launch/Benchmark buttons to fixture-backed async API functions.
5. Add log tail and GPU expand/collapse behavior.
6. Verify each state without adding a real controller proxy.

## Copy / Modify Map

- Copy layout rhythm from `control-panel-v2.tsx`, `status-section.tsx`, `gpu-section.tsx`.
- Copy API contract names from `lib/api/system.ts`, `lib/api/logs.ts`, `lib/api/recipes.ts`.
- Modify realtime store into fixture state for the demo.
- Do not copy `Effect` polling infrastructure unless rebuilding the production app.

## Acceptance Criteria

- Dashboard reads as a dense operator sheet, not card dashboard.
- Offline, idle, launching, running, no-GPU, and log-empty states are visible.
- Launch/benchmark have loading/disabled behavior.
- Controller tabs only show when multiple controllers exist.
- API contracts match source names, methods, and payloads.

## Anti-Overengineering Notes

Do not introduce a telemetry framework, generic graphing layer, or synthetic controller server. The demo only needs typed snapshots and async fixture actions.
