export const logsEndpoints = {
  sessions: "/logs",
  content: "/logs/{sessionId}?limit=2000",
  stream: "/api/proxy/logs/{sessionId}/stream?tail=0",
  spec: "/api/proxy/api/spec",
} as const;

export const MAX_RENDERED_LINES = 20000;
