import { delay, withMockLatency } from "../../../_shared/api";
import { runningDashboardSnapshot } from "../fixtures";

export async function loadDashboardSnapshot() {
  return withMockLatency(runningDashboardSnapshot, 220);
}

export async function launchRecipe(recipeId: string) {
  await delay(350);
  return { success: true, message: `Launching ${recipeId}` };
}

export async function runBenchmark() {
  await delay(450);
  return {
    success: true,
    benchmark: {
      prompt_tokens: 1000,
      completion_tokens: 100,
      generation_tps: 72.5,
      ttft_ms: 220,
    },
  };
}
