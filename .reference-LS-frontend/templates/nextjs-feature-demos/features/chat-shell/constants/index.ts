export const chatEndpoints = {
  turn: "/api/agent/turn",
  abort: "/api/agent/abort",
  compact: "/api/agent/compact",
  runtimeStatus: "/api/agent/runtime/status?sessionId={sessionId}",
  runtimeEvents: "/api/agent/runtime/events?sessionId={sessionId}&after={seq}",
} as const;

export const DEFAULT_MODEL_ID = "qwen2.5-coder";
export const DEFAULT_SESSION_ID = "demo-session";
