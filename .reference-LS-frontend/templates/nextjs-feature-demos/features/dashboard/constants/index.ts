export const dashboardEndpoints = {
  status: "/status",
  gpus: "/gpus",
  metrics: "/v1/metrics/vllm",
  recipes: "/recipes",
  logs: "/logs",
  launch: "/launch/{recipeId}",
  benchmark: "/benchmark?prompt_tokens=1000&max_tokens=100",
} as const;
