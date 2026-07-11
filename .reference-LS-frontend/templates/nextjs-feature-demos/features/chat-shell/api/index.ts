import { delay, mockStream } from "../../../_shared/api";
import { streamEvents } from "../fixtures";
import type { SubmitTurnArgs } from "../types";

export async function submitTurn(args: SubmitTurnArgs) {
  await delay(180);
  if (!args.message.trim()) {
    return { type: "command" as const, outcome: "rejected" as const, runtimeSessionId: args.sessionId, active: false, error: "message is required" };
  }
  return { type: "command" as const, outcome: "accepted" as const, runtimeSessionId: args.sessionId, active: true, piSessionId: args.piSessionId ?? "pi_demo" };
}

export async function abortTurn() {
  await delay(120);
  return { ok: true };
}

export function subscribeMockRuntimeEvents() {
  return mockStream(streamEvents, 220);
}
