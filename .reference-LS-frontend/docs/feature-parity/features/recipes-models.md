# Feature: Recipes / Models

## Purpose

The recipes surface (`/recipes`, sidebar label "Models") owns the full model lifecycle: exploring Hugging Face models with VRAM-fit estimates, managing launch recipes (create/edit/delete/pin), launching and stopping model servers per engine (vLLM / SGLang / llama.cpp / MLX), and monitoring the download queue.

## Reference Code Map

- `.references/local-studio/frontend/src/features/recipes/recipes-content/recipes-content-view.tsx`: `SettingsLayout` shell, `MODEL_SECTIONS`, section switching.
- `.../recipes-content/recipes-tab.tsx`: "Models" section (search row, Active model row) + "Launch recipes" section.
- `.../recipes-content/recipes-table.tsx`, `recipe-row.tsx`: recipe rows on the model-page grammar; `TEMPLATE_ROWS` zero-state.
- `.../recipes-content/explore-tab.tsx`, `explore-model-row.tsx`, `use-explore.ts`: HF search, grouped variants, quant tags, `~N / pool GB` estimates, `FALLBACK_MODELS`.
- `.../recipes-content/downloads-tab.tsx`: queue rows with mono progress text and pause/retry/cancel.
- `.../recipe-modal/recipe-modal.tsx` + `recipe-modal/tabs/*`: right-drawer editor (880px), engine segmented control, pill tabs General/Model/Resources/Performance/Features/Environment/Command.
- `.../recipes-content/delete-recipe-confirm-modal.tsx`: centered delete confirmation.
- `.references/local-studio/shared/contracts/recipes.ts`, `frontend/src/lib/types.ts`: `RecipeWithStatus`, `ModelDownload`, engine/status enums.
- `.references/local-studio/frontend/src/ui/model-page.tsx`: `ModelSection` / `ModelRow` / `ModelValue` / `ModelStatus` / `ModelButton` / `ModelInput` (ported to `_shared/ui`).

## User Workflow

1. Route loads recipes (`GET /recipes`) and downloads (`GET /studio/downloads`, polled ~2500ms).
2. Default section is **Current Running Models**: search row filters by name/path/served name; Active model row shows the live launch with Stop.
3. "Launch recipes" lists rows sorted pinned-first; Play launches (POST `/launch/{id}`, progress via SSE `launch_progress`), Square stops, `MoreVertical` opens Pin / Edit / Delete.
4. With zero recipes, template rows ("vLLM default", "SGLang server", "llama.cpp local") offer Use buttons that open the editor.
5. Edit/New opens the right drawer: summary card with engine segmented control, pill tabs, footer Cancel / "Save recipe" (`POST`/`PUT /recipes`).
6. Delete opens the centered "Delete Recipe" modal → Cancel / Delete (`DELETE /recipes/{id}`).
7. **Search Models** section: HF search input + Task/Library/Sort selects + VRAM pool row; grouped results expand derivative variants under the family lead; Download starts a queue item (`POST /studio/downloads`).
8. **Downloads** section: rows show `{bytes} / {total} · {pct}%` mono progress; Pause/Retry/Cancel per status; empty state "No downloads / Queue is empty".

Loading: "Controller sync / syncing" row. Empty: template rows (recipes) or fallback models (explore). Error: recipe row status pill `error`, download row error text under the row.

## UI/UX Parity Notes

- Everything sits on the model-page grammar: `ModelSection` (title + hairline) containing `ModelRow`s with the `md:grid-cols-[minmax(150px,0.44fr)_minmax(0,1fr)]` grid and `min-h-7` rows.
- Engine badges use node-taxonomy tokens: vLLM=`--color-command-node*`, SGLang=`--color-file-node*`, llama.cpp=`--color-skill-node*`, MLX=`--color-subagent-node*`; badge chrome is `h-5 rounded-md px-1.5 text-[--fs-2xs]`.
- `tp/pp N/N` values are mono; status pills are dot pills (`running`=good, `starting`=info, `error`=danger, `stopped`=default).
- Rows that fit the VRAM pool get the `model-row-shine` success sweep.
- Launch is locked while another model runs (tooltip explains why).
- Editor drawer is 880px with `bg-black/50 backdrop-blur-sm` scrim; MLX hides Resources/Performance tabs.

## ASCII Mockup

```txt
Models        | Model library
[Search]      |   MODELS ------------------------------------------
[Running] *   |   Search recipes   [Search recipes, paths, ...] [+ New]
[Downloads]   |   Active model     qwen3-32b-awq       (o) live [■ Stop]
              |   LAUNCH RECIPES ---------------------------------
              |   Qwen3 32B AWQ   [vLLM] tp/pp 2/1  (o) running [■][⋮]
              |   DeepSeek R1 ... [SGLang] tp/pp 1/1 ( ) stopped [▶][⋮]
              |   Phi-4 mini GGUF [llama.cpp] ...    ( ) stopped [▶][⋮]
```

## Folder Structure

```txt
templates/nextjs-feature-demos/features/recipes-models/
  components/recipes-models-demo.tsx
  hooks/use-recipes-models.ts
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
| `/recipes` | GET | none | `{ recipes: RecipeWithStatus[] }` | initial load + refresh |
| `/recipes` | POST | `RecipeBase` | `{ success, id }` | create |
| `/recipes/{id}` | PUT | `RecipeBase` | `{ success, id }` | edit |
| `/recipes/{id}` | DELETE | none | `{ success }` | delete confirm |
| `/launch/{recipeId}` | POST | none | 202; progress via SSE | `launch_progress` stages: preempting/evicting/launching/waiting/ready/error |
| `/evict` | POST | none | `{ success }` | Stop active |
| `/studio/models` | GET | none | `{ models: ModelInfo[] }` | local model index |
| `/studio/downloads` | GET | none | `{ downloads: ModelDownload[] }` | poll ~2500ms |
| `/studio/downloads` | POST | `{ model_id, revision? }` | `{ download }` | start download |
| `/studio/downloads/{id}/pause\|resume\|cancel` | POST | none | `{ success }` | row actions |
| `/api/huggingface/models?search=` | GET | query | HF rows | explore search |

## State Model

- Hook state: section, recipes, downloads, explore groups, filter, launch progress, editor draft, delete target.
- localStorage: `local-studio-pinned-recipes` (pinned recipe id array).
- Simulations: launch progress stream (~650ms/stage), download tick every 2500ms.

## Types

Aligned with `shared/contracts/recipes.ts`: `Backend`, `RecipeStatus`, `RecipeBase`, `RecipeWithStatus`, `DownloadStatus`, `ModelDownload`, `ModelInfo`, `HuggingFaceModel`, `LaunchProgress`.

## Implementation Steps

1. Port the model-page grammar into `_shared/ui` (done: `ModelSection`/`ModelRow`/etc.).
2. Add node-taxonomy tokens for engine badges to the token sheet.
3. Build the `SettingsLayout` shell with the three `MODEL_SECTIONS` (Compass / HardDrive / Download icons).
4. Build recipes tab: search + active rows, recipe rows, template zero-state, overflow menu.
5. Build editor drawer with engine segmented control and per-engine tab visibility.
6. Build delete modal, explore tab (grouped variants + shine), downloads tab.
7. Wire the fixture hook: launch stream, download tick, pin persistence.

## Copy / Modify Map

- Copy row/section grammar from `ui/model-page.tsx` verbatim.
- Copy `MODEL_SECTIONS` ids/labels/descriptions and `TEMPLATE_ROWS` from `recipes-content-view.tsx` / `recipes-table.tsx`.
- Copy engine badge token mapping from `recipe-row.tsx` `engineNodeStyle()`.
- Modify: editor Performance/Features/Environment tabs are labeled placeholders; explore filters are visual against fixtures.

## Acceptance Criteria

- Three sidebar sections switch without losing state; Current Running Models is default.
- Launch simulates preempting→launching→waiting→ready and flips the row to running; Stop reverts it.
- Pin persists across reloads; pinned rows sort first.
- Editor saves create/update rows; delete modal removes them.
- Explore expands variant groups; fitting rows shine; Download adds a queue row visible in Downloads.
- Downloads tick progress and expose pause/retry/cancel per status.

## Anti-Overengineering Notes

Do not implement the full ~130-field recipe editor, real HF API calls, or the attach-local-agents dialog. The `api/` module is the single swap point for the real controller.
