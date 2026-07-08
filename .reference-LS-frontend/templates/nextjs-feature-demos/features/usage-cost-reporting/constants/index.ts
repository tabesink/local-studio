export const usageEndpoints = {
  provider: "/usage",
  piSessions: "/usage/pi-sessions",
  peakMetrics: "/peak-metrics",
} as const;

export const usageSources = [
  { id: "provider", label: "Provider", sublabel: "this controller" },
  { id: "pi-sessions", label: "Pi sessions", sublabel: "coding-agent JSONL" },
] as const;
