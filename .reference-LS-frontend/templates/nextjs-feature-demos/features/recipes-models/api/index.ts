/* Fixture-backed API layer — the swap point for a real backend.
   Real endpoints (see docs/feature-parity/backend-wiring.md):
     GET    /recipes                        → { recipes: RecipeWithStatus[] }
     POST   /recipes                        → { success, id }
     PUT    /recipes/:id                    → { success, id }
     DELETE /recipes/:id
     POST   /launch/:recipeId               (launch progress arrives via SSE)
     POST   /evict
     GET    /studio/models                  → { models: ModelInfo[] }
     GET    /studio/downloads               → { downloads: ModelDownload[] } (poll ~2500ms)
     POST   /studio/downloads               body { model_id, ... }
     POST   /studio/downloads/:id/pause|resume|cancel
     GET    /api/huggingface/models?search= → HF search results */

import { delay, mockStream, withMockLatency, type MockStream } from "../../../_shared/api";
import {
  downloadFixtures,
  exploreGroupFixtures,
  localModelFixtures,
  recipeFixtures,
} from "../fixtures";
import type {
  ExploreModelGroup,
  LaunchProgress,
  ModelDownload,
  ModelInfo,
  RecipeWithStatus,
} from "../types";

export async function getRecipes(): Promise<{ recipes: RecipeWithStatus[] }> {
  return withMockLatency({ recipes: recipeFixtures }, 220);
}

export async function getModels(): Promise<{ models: ModelInfo[] }> {
  return withMockLatency({ models: localModelFixtures }, 180);
}

export async function getDownloads(): Promise<{ downloads: ModelDownload[] }> {
  return withMockLatency({ downloads: downloadFixtures }, 180);
}

export async function searchModels(query: string): Promise<{ groups: ExploreModelGroup[] }> {
  await delay(300);
  const needle = query.trim().toLowerCase();
  if (!needle) return { groups: structuredClone(exploreGroupFixtures) };
  return {
    groups: structuredClone(
      exploreGroupFixtures.filter(
        (group) =>
          group.key.toLowerCase().includes(needle) ||
          group.variants.some((variant) => variant.modelId.toLowerCase().includes(needle)),
      ),
    ),
  };
}

/* Simulates the launch_progress SSE stream a controller emits after
   POST /launch/:recipeId. */
export function launchRecipe(recipe: RecipeWithStatus): MockStream<LaunchProgress> {
  const name = recipe.served_model_name ?? recipe.name;
  return mockStream<LaunchProgress>(
    [
      { stage: "preempting", message: "Stopping previous model...", recipe_id: recipe.id },
      { stage: "launching", message: `Launching ${name}...`, recipe_id: recipe.id },
      { stage: "waiting", message: "Waiting for /health to go green...", recipe_id: recipe.id },
      { stage: "ready", message: `${name} is serving.`, recipe_id: recipe.id },
    ],
    650,
  );
}

export async function stopActiveModel(): Promise<{ success: boolean }> {
  await delay(400);
  return { success: true };
}

export async function saveRecipe(recipe: RecipeWithStatus): Promise<{ success: boolean; id: string }> {
  await delay(350);
  return { success: true, id: recipe.id };
}

export async function deleteRecipe(recipeId: string): Promise<{ success: boolean; id: string }> {
  await delay(250);
  return { success: true, id: recipeId };
}

export async function pauseDownload(id: string): Promise<{ success: boolean; id: string }> {
  await delay(200);
  return { success: true, id };
}

export async function resumeDownload(id: string): Promise<{ success: boolean; id: string }> {
  await delay(200);
  return { success: true, id };
}

export async function cancelDownload(id: string): Promise<{ success: boolean; id: string }> {
  await delay(200);
  return { success: true, id };
}

export async function startDownload(modelId: string): Promise<{ download: ModelDownload }> {
  await delay(300);
  const now = new Date().toISOString();
  return {
    download: {
      id: `dl-${modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      model_id: modelId,
      revision: null,
      status: "downloading",
      source: "Hugging Face",
      created_at: now,
      updated_at: now,
      completed_at: null,
      target_dir: `/mnt/llm_models/${modelId.split("/").pop()}`,
      total_bytes: 24_000_000_000,
      downloaded_bytes: 0,
      speed_bytes_per_second: 96_000_000,
      error: null,
    },
  };
}
