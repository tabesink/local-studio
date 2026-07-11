# Feature: Setup Wizard

## Purpose

The setup wizard (`/setup`) is the first-run onboarding flow: it verifies the controller connection, confirms hardware, installs managed runtimes, downloads a starter model, creates + launches a starter recipe, and runs one benchmark pass. Completion is persisted so the app never shows the wizard again.

## Reference Code Map

- `.references/local-studio/frontend/src/features/setup/setup-view/setup-view.tsx`: page shell (`max-w-5xl mx-auto px-6 py-10`), eyebrow/title, "Skip for now", loading and controller-unreachable states.
- `.../setup-view/setup-stepper.tsx` + `utils.ts`: numbered circle stepper, literal `STEPS = ["Welcome","Hardware","Model","Download","Launch","Benchmark"]`.
- `.../setup/use-setup.ts`: plain numeric `step` state, REST calls, download/runtime polling, completion persistence.
- `.../setup-view/step-welcome.tsx` … `step-benchmark.tsx`: the six step bodies.
- `.../setup/setup-helpers.ts`: `buildStarterRecipe` defaults used by the Launch step.
- `.references/local-studio/frontend/src/app/settings/page.tsx`: reads `local-studio-setup-complete` to gate the wizard.

## User Workflow

1. Page loads settings + diagnostics + recommendations + runtime targets in parallel (8s timeouts). Controller failure renders the full-page error with the literal `cd controller && bun src/main.ts` instruction.
2. **Welcome (0)**: Rocket header, literal body copy, "Setup target" pill (platform · arch · GPU count), "Controller models directory" input; Continue saves `models_dir` and advances.
3. **Hardware (1)**: "Hardware Check" fact grid (CPU / Memory / GPU / VRAM), "Runtime setup" group with managed install rows (vLLM/SGLang/MLX) and Install buttons that stream a runtime job; confirmation checkbox gates Continue.
4. **Model (2)**: "Pick a starter model" 2-col recommendation card grid with Download buttons + "Download by model ID" manual card with Back.
5. **Download (3)**: "Fetching {model}" card with `h-2` progress bar, bytes/percent line, Pause/Resume/Cancel; footer card flips to `CheckCircle2` when complete and unlocks "Continue to Launch".
6. **Launch (4)**: "Configure and Launch" copy, panel fact grid (Backend vLLM, dtype auto, kv cache auto); "Configure & Launch" → "Launching…" creates the starter recipe, launches, waits ready, marks setup complete, advances.
7. **Benchmark (5)**: "Run Benchmark" → success alert + 4-col fact grid (Prompt tokens / Completion tokens / Total time / Generation TPS), then "Open Chat" / "Open Dashboard".

## UI/UX Parity Notes

- Stepper circles are `h-8 w-8 rounded-full`; active uses `bg-(--hl1)` white text; `ChevronRight` separators; labels dim when inactive.
- Cards are the shared `Card` primitive (`rounded-lg border bg-(--ui-bg)`, padding lg).
- Hardware GPU/VRAM values join multi-GPU lists into one row ("No CUDA GPU detected" / "CPU only" fallbacks).
- Download progress is a plain `h-2 rounded-full` track with `--hl1` fill, mono bytes/percent line beneath.
- Benchmark results use `FactGrid columns={4}` with mono values.
- "Skip for now" also persists completion.

## ASCII Mockup

```txt
SETUP WIZARD                                      [Skip for now]
Local Studio Desktop

(1) Welcome > (2) Hardware > (3) Model > (4) Download > (5) Launch > (6) Benchmark

+------------------------------------------------------------------+
| (rocket) Welcome to Local Studio                                  |
| This desktop wizard configures the active controller. ...         |
| Setup target                        (o) linux · x86_64 · 2 GPU    |
| Controller models directory  [/mnt/llm_models_____________]       |
|                                                     [Continue >]  |
+------------------------------------------------------------------+
```

## Folder Structure

```txt
templates/nextjs-feature-demos/features/setup-wizard/
  components/setup-wizard-demo.tsx
  hooks/use-setup-wizard.ts
  api/index.ts          ← backend seam
  types/index.ts
  fixtures/index.ts
  constants/index.ts
  index.ts
  README.md
```

## API Contracts

| Endpoint | Method | Request | Response | Notes |
| --- | --- | --- | --- | --- |
| `/studio/settings` | GET | none | `StudioSettings` | 8s timeout |
| `/studio/settings` | POST | `{ models_dir }` | `StudioSettings` | Welcome Continue |
| `/studio/diagnostics` | GET | none | `StudioDiagnostics` | 8s timeout |
| `/studio/recommendations` | GET | none | `{ recommendations, max_vram_gb }` | starter grid |
| `/runtime/targets` | GET | none | `{ targets }` | managed runtimes |
| `/runtime/jobs` | POST | `{ backend, type: "install" }` | `{ job_id }` | poll `GET /runtime/jobs/{id}` at 1s→3s |
| `/studio/downloads` | POST | `{ model_id }` | `{ download }` | then poll `GET /studio/downloads` @2000ms |
| `/studio/downloads/{id}/pause\|resume\|cancel` | POST | none | `{ success }` | download controls |
| `/recipes` | GET/POST | starter recipe | `{ recipes }` / `{ id }` | Launch step |
| `/launch/{id}` | POST | none | 202 | then `GET /wait-ready?timeout=300` |
| `/benchmark?prompt_tokens=1000&max_tokens=100` | POST | none | `BenchmarkResult` | Benchmark step |

## State Model

- Hook state: `step` (0–5), loaded data, models dir draft, hardware confirmation, install job, selected model, download, launching/launch error, benchmark result, completion.
- localStorage: `local-studio-setup-complete` = `"true"` (written on launch success, Skip, and finish).
- Fixture scenarios: `happy-path`, `controller-unreachable`, `download-failed`.

## Types

`StudioSettings`, `StudioDiagnostics`, `ModelRecommendation`, `SetupDownload`, `RuntimeTargetRow`, `EngineJob`, `BenchmarkResult` — aligned with `shared/contracts/`.

## Implementation Steps

1. Build the shell (header + stepper) and the loading/error states.
2. Implement the six steps in order with literal copy from the reference step files.
3. Simulate the download tick and the runtime install job.
4. Gate transitions exactly: Hardware requires the checkbox, Download requires `completed`, Launch requires a selected model.
5. Persist completion and offer restart in the demo.

## Copy / Modify Map

- Copy step order/labels from `setup-view/utils.ts`, body copy from `step-*.tsx`.
- Copy the controller-unreachable message verbatim.
- Modify: "Open Chat"/"Open Dashboard" end the demo instead of routing; the scenario switcher strip is demo-only.

## Acceptance Criteria

- All six steps render in order with the numbered stepper reflecting progress.
- Controller-unreachable scenario shows the full-page error instead of steps.
- Download-failed scenario fails mid-flight with the 401 error and supports Resume.
- Hardware Continue is disabled until the checkbox is set; Download Continue until complete.
- Benchmark shows the 4-fact grid and unlocks Open Chat / Open Dashboard.
- `local-studio-setup-complete` is written on completion and on Skip.

## Anti-Overengineering Notes

Do not add account creation, cloud model catalogs, or multi-target orchestration. The wizard configures exactly one controller with fixture data; `api/` is the swap point.
