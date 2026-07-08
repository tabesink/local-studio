import { withMockLatency } from "../../../_shared/api";
import { activeSessions, projectRows } from "../fixtures";

export async function loadProjectsForSidebar() {
  return withMockLatency({ projects: projectRows }, 180);
}

export async function searchSessions() {
  return withMockLatency({ sessions: activeSessions }, 180);
}
