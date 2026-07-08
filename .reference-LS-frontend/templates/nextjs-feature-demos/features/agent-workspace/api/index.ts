/* Fixture-backed API layer — the swap point for a real backend.
   Real endpoints (see docs/feature-parity/backend-wiring.md):
     GET  /api/agent/runtime/events           SSE: {"type":"status"|"pi", ...} frames
     POST /api/agent/turn                     body { sessionId, text, mode?: "steer"|"follow_up" }
     POST /api/agent/abort                    body { sessionId }
     POST /api/agent/compact                  body { sessionId }
     GET  /api/agent/sessions/all?since=90d   → session index rows
     GET  /api/agent/sessions/:piSessionId    → canonical events for replay */

import { delay, mockStream, type MockStream } from "../../../_shared/api";
import { buildTurnEvents, sessionFixtures } from "../fixtures";
import type { AgentSession, RuntimeSseFrame } from "../types";

export async function getSessions(): Promise<{ sessions: AgentSession[] }> {
  await delay(200);
  return { sessions: structuredClone(sessionFixtures) };
}

/* Simulates the runtime SSE stream for one submitted turn: a status frame,
   then `pi` frames carrying the same event grammar the backend must emit. */
export function streamTurn(sessionId: string, messageId: string): MockStream<RuntimeSseFrame> {
  const session = sessionFixtures.find((row) => row.id === sessionId);
  const frames: RuntimeSseFrame[] = [
    {
      type: "status",
      phase: "running",
      session: {
        active: true,
        running: true,
        piSessionId: sessionId,
        modelId: session?.modelId ?? null,
        contextUsage: session
          ? {
              tokens: session.tokens,
              contextWindow: session.contextWindow,
              percent: Math.round((session.tokens / session.contextWindow) * 100),
            }
          : undefined,
      },
    },
    ...buildTurnEvents(messageId).map((event, index) => ({
      type: "pi" as const,
      seq: index + 1,
      event,
    })),
    {
      type: "status",
      phase: "idle",
      session: {
        active: true,
        running: false,
        piSessionId: sessionId,
        modelId: session?.modelId ?? null,
      },
    },
  ];
  return mockStream(frames, 260);
}

export async function abortTurn(sessionId: string): Promise<{ success: boolean }> {
  await delay(120);
  void sessionId;
  return { success: true };
}

export async function compactSession(sessionId: string): Promise<{ success: boolean; message: string }> {
  await delay(900);
  void sessionId;
  return { success: true, message: "Context compacted" };
}
