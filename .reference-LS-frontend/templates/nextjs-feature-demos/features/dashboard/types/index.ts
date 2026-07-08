export type LifecycleStatus = "idle" | "starting" | "ready" | "error";

export interface ProcessInfo {
  pid: number;
  backend: "vllm" | "sglang" | "llamacpp" | "mlx";
  port: number;
  served_model_name?: string;
  model_path?: string;
}

export interface GPU {
  id: string;
  name: string;
  memoryUsedGb: number;
  memoryTotalGb: number;
  utilizationPct: number;
  tempC: number;
  powerW: number;
  powerLimitW: number;
}

export interface Metrics {
  generationTps: number;
  prefillTps: number;
  ttftMs: number;
  requests: number;
  cacheHitPct: number;
  kvCachePct: number;
}

export interface LaunchProgress {
  stage: "preempting" | "evicting" | "launching" | "waiting" | "ready" | "cancelled" | "error";
  message: string;
  progress?: number;
}

export interface RecipeOption {
  id: string;
  name: string;
  backend: ProcessInfo["backend"];
  running?: boolean;
}

export interface ControllerSnapshot {
  url: string;
  name?: string;
  online: boolean;
  authRequired: boolean;
  running: boolean;
  model: string | null;
  gpuCount: number;
}

export interface DashboardSnapshot {
  connected: boolean;
  process: ProcessInfo | null;
  lifecycleStatus: LifecycleStatus;
  metrics: Metrics | null;
  gpus: GPU[];
  launchProgress: LaunchProgress | null;
  logs: string[];
  platformKind: string | null;
  inferencePort: number | null;
}

export type DashboardScenario = "running" | "idle" | "launching" | "offline" | "no-gpu";
