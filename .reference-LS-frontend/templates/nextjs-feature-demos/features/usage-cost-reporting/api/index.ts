import { withMockLatency } from "../../../_shared/api";
import { piSessionUsageStats, providerUsageStats } from "../fixtures";
import type { UsageSource } from "../types";

export async function loadUsageStats(source: UsageSource) {
  return withMockLatency(source === "pi-sessions" ? piSessionUsageStats : providerUsageStats, 220);
}

export async function loadPeakMetrics() {
  return withMockLatency({ metrics: [] }, 160);
}
