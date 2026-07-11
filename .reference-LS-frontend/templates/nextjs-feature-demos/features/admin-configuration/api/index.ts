import { withMockLatency } from "../../../_shared/api";
import { engineJobs, mcpServers, setupChecks } from "../fixtures";

export async function loadAdminConfiguration() {
  return withMockLatency({ engineJobs, mcpServers, setupChecks }, 180);
}

export async function toggleMcpServer(id: string, enabled: boolean) {
  return withMockLatency({ id, enabled }, 160);
}

export async function cancelEngineJob(id: string) {
  return withMockLatency({ id, status: "cancelled" as const }, 160);
}
