/* Fixture-backed API layer — the swap point for a real controller backend.
   Real endpoints (see docs/feature-parity/backend-wiring.md):
     GET  /studio/settings           → StudioSettings         (8s timeout)
     POST /studio/settings           body { models_dir }
     GET  /studio/diagnostics        → StudioDiagnostics      (8s timeout)
     GET  /studio/recommendations    → { recommendations, max_vram_gb }
     GET  /runtime/targets           → { targets }
     POST /runtime/jobs              body { backend, type }   (poll GET /runtime/jobs/{id})
     POST /studio/downloads          body { model_id, ... }   (poll GET /studio/downloads @2000ms)
     POST /studio/downloads/{id}/pause|resume|cancel
     GET  /recipes · POST /recipes · POST /launch/{id} · GET /wait-ready?timeout=300
     POST /benchmark?prompt_tokens=1000&max_tokens=100 */

import { ApiError, delay, withMockLatency } from "../../../_shared/api";
import { CONTROLLER_UNREACHABLE_ERROR } from "../constants";
import {
  benchmarkFixture,
  diagnosticsFixture,
  downloadTotalBytes,
  recommendationsFixture,
  runtimeTargetsFixture,
  settingsFixture,
} from "../fixtures";
import type {
  BenchmarkResult,
  ModelRecommendation,
  RuntimeTargetRow,
  SetupDownload,
  SetupScenario,
  StudioDiagnostics,
  StudioSettings,
} from "../types";

export async function loadSetupData(scenario: SetupScenario): Promise<{
  settings: StudioSettings;
  diagnostics: StudioDiagnostics;
  recommendations: ModelRecommendation[];
  runtimeTargets: RuntimeTargetRow[];
  maxVramGb: number;
}> {
  await delay(600);
  if (scenario === "controller-unreachable") {
    throw new ApiError(CONTROLLER_UNREACHABLE_ERROR, 503);
  }
  return withMockLatency(
    {
      settings: settingsFixture,
      diagnostics: diagnosticsFixture,
      recommendations: recommendationsFixture,
      runtimeTargets: runtimeTargetsFixture,
      maxVramGb: Math.max(...diagnosticsFixture.gpus.map((gpu) => gpu.memory_total_gb), 0),
    },
    200,
  );
}

export async function saveModelsDir(modelsDir: string): Promise<StudioSettings> {
  await delay(450);
  return {
    ...structuredClone(settingsFixture),
    effective: { models_dir: modelsDir },
    persisted: { models_dir: modelsDir },
  };
}

export async function startDownload(
  modelId: string,
  modelsDir: string,
): Promise<{ download: SetupDownload }> {
  await delay(350);
  return {
    download: {
      id: `dl-${modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      model_id: modelId,
      status: "downloading",
      target_dir: `${modelsDir}/${modelId.split("/").pop()}`,
      total_bytes: downloadTotalBytes,
      downloaded_bytes: 0,
      error: null,
    },
  };
}

export async function configureAndLaunch(modelId: string): Promise<{
  success: boolean;
  recipeId: string;
}> {
  /* Reference: GET /recipes → POST /recipes (starter defaults from
     buildStarterRecipe) → POST /launch/{id} → GET /wait-ready?timeout=300. */
  await delay(1600);
  return { success: true, recipeId: `starter-${modelId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` };
}

export async function runBenchmark(): Promise<{ benchmark: BenchmarkResult }> {
  await delay(1800);
  return withMockLatency({ benchmark: benchmarkFixture }, 100);
}
