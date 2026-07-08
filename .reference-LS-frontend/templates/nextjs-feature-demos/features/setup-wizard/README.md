# Setup Wizard

Carbon copy of the Local Studio `/setup` first-run onboarding flow: the numbered
stepper and the exact six steps **Welcome → Hardware → Model → Download → Launch →
Benchmark**, driven by a plain numeric `step` state like the reference `use-setup.ts`.

## What it demonstrates

- Full-page wizard shell (`max-w-5xl`, eyebrow "Setup Wizard", title "Local Studio
  Desktop", header "Skip for now").
- Numbered circle stepper (`h-8 w-8 rounded-full`, active `--hl1`, `ChevronRight`
  separators).
- Welcome: setup-target status pill, "Controller models directory" input, literal copy.
- Hardware: `FactGrid` hardware check (CPU/Memory/GPU/VRAM as single joined rows),
  "Runtime setup" group with managed runtime install rows and a simulated install
  job, confirmation checkbox gate.
- Model: recommendation grid of nested cards + manual "Download by model ID" card
  with Back.
- Download: `h-2` progress bar with bytes/percent, Pause/Resume/Cancel, footer gate
  "Continue to Launch".
- Launch: starter-recipe fact panel (Backend vLLM / dtype auto / KV cache auto),
  "Configure & Launch" → "Launching...".
- Benchmark: "Run Benchmark", success alert + 4-column fact grid (Prompt tokens /
  Completion tokens / Total time / Generation TPS), then "Open Chat" / "Open Dashboard".
- Completion persisted to `localStorage["local-studio-setup-complete"]` (the key
  the reference `/settings` page checks to gate the wizard).
- Fixture scenarios: happy path, controller unreachable (full-page error with the
  literal controller-start instructions), download failure mid-flight.

## Reference copy map

| This slice | Reference source |
| --- | --- |
| Shell + stepper | `.references/local-studio/frontend/src/features/setup/setup-view/setup-view.tsx`, `setup-stepper.tsx`, `utils.ts` |
| Hook / state | `.../setup/use-setup.ts` |
| Steps 0–5 | `.../setup/setup-view/step-welcome.tsx`, `step-hardware.tsx`, `step-model.tsx`, `step-download.tsx`, `step-launch.tsx`, `step-benchmark.tsx` |
| Starter recipe defaults | `.../setup/setup-helpers.ts` (`buildStarterRecipe`) |
| Settings gate logic | `.references/local-studio/frontend/src/app/settings/page.tsx` |

## Backend wiring

`api/index.ts` is the swap point. The real controller endpoints per step
(`/studio/settings`, `/studio/diagnostics`, `/studio/recommendations`,
`/runtime/targets`, `/runtime/jobs`, `/studio/downloads`, `/recipes`,
`/launch/{id}`, `/wait-ready`, `/benchmark`) are tabulated in
[`docs/feature-parity/backend-wiring.md`](../../../../docs/feature-parity/backend-wiring.md).

## Known simplifications

- "Open Chat" / "Open Dashboard" complete the demo instead of routing (`/chat?new=1`, `/`).
- Runtime install job is a single simulated job (reference polls `GET /runtime/jobs/{id}`
  at 1s/3s cadence with a 35-minute ceiling and multi-line error tails).
- The scenario switcher strip is demo-only chrome.
