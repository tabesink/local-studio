export type UsageSource = "provider" | "pi-sessions";
export type SortDirection = "asc" | "desc";
export type SortField = "model" | "requests" | "tokens" | "success" | "latency" | "ttft" | "speed";

export interface UsageTotals {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  unique_sessions: number;
  unique_users: number;
}

export interface ModelUsageRow {
  model: string;
  requests: number;
  successful: number;
  success_rate: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens: number;
  avg_latency_ms: number | null;
  p50_latency_ms: number | null;
  avg_ttft_ms: number | null;
  tokens_per_sec: number | null;
  peak_generation_tps: number | null;
}

export interface DailyStat {
  date: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  requests: number;
}

export interface UsageStats {
  totals: UsageTotals;
  by_model: ModelUsageRow[];
  daily: DailyStat[];
  recent_activity: {
    last_24h_requests: number;
    last_hour_requests: number;
  };
  cache: {
    hit_rate: number;
    hits: number;
    misses: number;
  };
  tokens_per_request: {
    avg: number;
    avg_prompt: number;
    avg_completion: number;
  };
  performance: {
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    avg_ttft_ms: number;
    avg_generation_tps: number;
  };
  secondary: {
    top_session_tokens: number;
    avg_session_tokens: number;
    error_rate: number;
    longest_streak_days: number;
  };
}
