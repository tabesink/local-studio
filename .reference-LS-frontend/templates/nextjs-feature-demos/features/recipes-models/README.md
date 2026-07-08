# Recipes / Models

Carbon copy of the Local Studio `/recipes` route (sidebar label "Models"): the full
model/recipe lifecycle surface with three sidebar sections — **Search Models**
(Hugging Face explore with VRAM-fit estimates), **Current Running Models** (launch
recipes with engine badges, launch/stop, pin, edit, delete), and **Downloads**
(queue with mono text progress, pause/retry/cancel).

## What it demonstrates

- `SettingsLayout` shell with the model-page grammar (`ModelSection`/`ModelRow`/`ModelValue`/`ModelStatus`/`ModelButton`).
- Recipe rows: engine badges on node-taxonomy tokens, mono `tp/pp` values, quant chips, status dot pills, overflow menu (Pin / Edit / Attach to local agents… / Delete recipe...).
- Right-drawer recipe editor (880px) with engine `SegmentedControl` and per-engine tab sets (MLX drops Resources/Performance).
- Centered "Delete Recipe" confirmation modal.
- Zero-state template rows ("vLLM default", "SGLang server", "llama.cpp local").
- Simulated launch-progress stream and a 2.5s downloads poll tick.
- Pin persistence in `localStorage` (`local-studio-pinned-recipes`).

## Reference copy map

| This slice | Reference source |
| --- | --- |
| `components/recipes-models-demo.tsx` shell | `.references/local-studio/frontend/src/features/recipes/recipes-content/recipes-content-view.tsx` |
| Recipes tab / rows | `.../recipes-content/recipes-tab.tsx`, `recipes-table.tsx`, `recipe-row.tsx` |
| Explore tab | `.../recipes-content/explore-tab.tsx`, `explore-model-row.tsx`, `use-explore.ts` |
| Downloads tab | `.../recipes-content/downloads-tab.tsx` |
| Recipe editor drawer | `.../recipe-modal/recipe-modal.tsx` + `recipe-modal/tabs/*` |
| Delete confirm | `.../recipes-content/delete-recipe-confirm-modal.tsx` |
| Types | `.references/local-studio/shared/contracts/recipes.ts`, `frontend/src/lib/types.ts` |
| Row grammar | `.references/local-studio/frontend/src/ui/model-page.tsx` (ported to `_shared/ui`) |

## Backend wiring

`api/index.ts` is the swap point. Real endpoints, request/response shapes, and the
launch-progress SSE contract are tabulated in
[`docs/feature-parity/backend-wiring.md`](../../../../docs/feature-parity/backend-wiring.md).

## Known simplifications

- The recipe editor's General/Model/Resources tabs carry real fields; Performance /
  Features / Environment tabs are labeled placeholders (the reference has ~130
  fields across `recipe-editor.ts`).
- Explore search filters (Task/Library/Sort) are visual only against fixtures.
- "Attach to local agents…" is a menu item without a dialog (reference opens
  `attach-local-agents-dialog.tsx`).
