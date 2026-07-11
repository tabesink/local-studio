import type {
  ControllerSnapshot,
  DashboardScenario,
  DashboardSnapshot,
  GPU,
  RecipeOption,
} from "../types";

const runningGpus: GPU[] = [
  {
    id: "0",
    name: "NVIDIA RTX 6000 Ada Generation",
    memoryUsedGb: 18.2,
    memoryTotalGb: 48,
    utilizationPct: 64,
    tempC: 67,
    powerW: 212,
    powerLimitW: 300,
  },
  {
    id: "1",
    name: "NVIDIA RTX 6000 Ada Generation",
    memoryUsedGb: 17.9,
    memoryTotalGb: 48,
    utilizationPct: 59,
    tempC: 65,
    powerW: 205,
    powerLimitW: 300,
  },
];

const runningLogs = [
  "2026-07-08 07:41:02 INFO controller listening on http://127.0.0.1:8080",
  "2026-07-08 07:41:04 INFO launching recipe qwen2.5-coder-14b (vllm)",
  "2026-07-08 07:41:18 INFO vLLM engine initialized, kv cache 42112 blocks",
  "2026-07-08 07:41:19 INFO serving Qwen/Qwen2.5-Coder-14B-Instruct on :8000",
  "2026-07-08 07:42:03 INFO metrics sample received (gen 74.2 tok/s)",
  "2026-07-08 07:43:11 INFO /v1/chat/completions 200 in 1.82s",
  "2026-07-08 07:44:27 WARN kv cache usage above 70%",
  "2026-07-08 07:45:01 INFO /v1/chat/completions 200 in 2.04s",
];

export const dashboardScenarios: Record<DashboardScenario, DashboardSnapshot> = {
  running: {
    connected: true,
    process: {
      pid: 31882,
      backend: "vllm",
      port: 8000,
      served_model_name: "Qwen/Qwen2.5-Coder-14B-Instruct",
    },
    lifecycleStatus: "ready",
    metrics: {
      generationTps: 74.2,
      prefillTps: 1230.5,
      ttftMs: 211,
      requests: 128,
      cacheHitPct: 38.4,
      kvCachePct: 71.2,
    },
    gpus: runningGpus,
    launchProgress: null,
    logs: runningLogs,
    platformKind: "cuda",
    inferencePort: 8000,
  },
  idle: {
    connected: true,
    process: null,
    lifecycleStatus: "idle",
    metrics: null,
    gpus: runningGpus.map((gpu) => ({
      ...gpu,
      memoryUsedGb: 0.6,
      utilizationPct: 0,
      tempC: 41,
      powerW: 22,
    })),
    launchProgress: null,
    logs: [
      "2026-07-08 07:41:02 INFO controller listening on http://127.0.0.1:8080",
      "2026-07-08 07:41:03 INFO no model loaded",
    ],
    platformKind: "cuda",
    inferencePort: 8000,
  },
  launching: {
    connected: true,
    process: null,
    lifecycleStatus: "starting",
    metrics: null,
    gpus: runningGpus.map((gpu) => ({ ...gpu, memoryUsedGb: 9.4, utilizationPct: 22 })),
    launchProgress: {
      stage: "launching",
      message: "Launching qwen2.5-coder-14b",
      progress: 45,
    },
    logs: [
      "2026-07-08 07:41:02 INFO controller listening on http://127.0.0.1:8080",
      "2026-07-08 07:41:04 INFO launching recipe qwen2.5-coder-14b (vllm)",
      "2026-07-08 07:41:06 INFO loading weights shard 2/6",
    ],
    platformKind: "cuda",
    inferencePort: 8000,
  },
  offline: {
    connected: false,
    process: null,
    lifecycleStatus: "idle",
    metrics: null,
    gpus: [],
    launchProgress: null,
    logs: [],
    platformKind: null,
    inferencePort: null,
  },
  "no-gpu": {
    connected: true,
    process: null,
    lifecycleStatus: "idle",
    metrics: null,
    gpus: [],
    launchProgress: null,
    logs: ["2026-07-08 07:41:02 INFO controller listening on http://127.0.0.1:8080"],
    platformKind: "cpu",
    inferencePort: 8000,
  },
};

export const runningDashboardSnapshot = dashboardScenarios.running;
export const offlineDashboardSnapshot = dashboardScenarios.offline;

export const recipeOptions: RecipeOption[] = [
  { id: "qwen2.5-coder-14b", name: "Qwen2.5 Coder 14B", backend: "vllm", running: true },
  { id: "llama-3.3-70b-awq", name: "Llama 3.3 70B AWQ", backend: "vllm" },
  { id: "gpt-oss-20b", name: "GPT-OSS 20B", backend: "sglang" },
  { id: "gemma-3-27b-gguf", name: "Gemma 3 27B GGUF", backend: "llamacpp" },
];

/* Controller matrix only renders when more than one controller is saved. */
export const savedControllerSnapshots: ControllerSnapshot[] = [
  {
    url: "http://192.168.1.70:8080",
    name: "homelab",
    online: true,
    authRequired: false,
    running: true,
    model: "Qwen/Qwen2.5-Coder-14B-Instruct",
    gpuCount: 2,
  },
  {
    url: "http://127.0.0.1:8080",
    name: "laptop",
    online: true,
    authRequired: false,
    running: false,
    model: null,
    gpuCount: 1,
  },
  {
    url: "http://10.0.0.12:8080",
    name: "office",
    online: false,
    authRequired: true,
    running: false,
    model: null,
    gpuCount: 0,
  },
];
