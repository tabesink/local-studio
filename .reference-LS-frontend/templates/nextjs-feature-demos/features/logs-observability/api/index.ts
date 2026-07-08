import { withMockLatency } from "../../../_shared/api";
import { logLinesBySession, logSessions, serverStatus } from "../fixtures";

export async function loadLogSessions() {
  return withMockLatency({ sessions: logSessions }, 160);
}

export async function loadLogContent(sessionId: string) {
  return withMockLatency({ logs: logLinesBySession[sessionId] ?? [] }, 180);
}

export async function deleteLogSession(sessionId: string) {
  return withMockLatency({ ok: sessionId !== "controller" }, 180);
}

export async function loadServerStatus() {
  return withMockLatency(serverStatus, 160);
}
