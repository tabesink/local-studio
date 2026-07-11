/* Types aligned with .references/local-studio/shared/contracts/* so the
   fixture api/ layer can be replaced by real controller endpoints. */

export interface StudioSettings {
  config_path: string;
  effective: { models_dir: string };
  persisted: { models_dir: string | null };
}

export interface GpuFact {
  name: string;
  memory_total_gb: number;
}

export interface StudioDiagnostics {
  platform: string;
  arch: string;
  cpu_model: string;
  cpu_cores: number;
  memory_total_gb: number;
  gpus: GpuFact[];
  runtime: { vllm_installed: boolean };
}

export interface ModelRecommendation {
  id: string;
  name: string;
  description: string;
  size_gb: number;
  min_vram_gb: number;
  tags: string[];
}

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface SetupDownload {
  id: string;
  model_id: string;
  status: DownloadStatus;
  target_dir: string;
  total_bytes: number;
  downloaded_bytes: number;
  error: string | null;
}

export type RuntimeBackend = "vllm" | "sglang" | "mlx";

export interface RuntimeTargetRow {
  id: string;
  backend: RuntimeBackend;
  label: string;
  installed: boolean;
  detail: string;
}

export type EngineJobStatus = "queued" | "running" | "succeeded" | "failed";

export interface EngineJob {
  id: string;
  backend: RuntimeBackend;
  type: "install" | "update";
  status: EngineJobStatus;
  message: string;
}

export interface BenchmarkResult {
  prompt_tokens: number;
  completion_tokens: number;
  total_time_s: number;
  generation_tps: number;
}

export type SetupScenario = "happy-path" | "controller-unreachable" | "download-failed";
