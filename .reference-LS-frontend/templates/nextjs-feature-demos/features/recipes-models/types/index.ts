/* Types aligned with .references/local-studio/shared/contracts/recipes.ts and
   frontend/src/lib/types.ts so a FastAPI backend can be wired in without
   reshaping the UI layer. */

export type Backend = "vllm" | "sglang" | "llamacpp" | "mlx";

export type RecipeStatus = "running" | "stopped" | "starting" | "error";

export interface RecipeBase {
  id: string;
  name: string;
  model_path: string;
  backend: Backend;
  tensor_parallel_size: number;
  pipeline_parallel_size: number;
  max_model_len: number;
  gpu_memory_utilization: number;
  kv_cache_dtype: string;
  max_num_seqs: number;
  trust_remote_code: boolean;
  quantization: string | null;
  dtype: string | null;
  host: string;
  port: number;
  served_model_name: string | null;
  env_vars: Record<string, string> | null;
  extra_args: Record<string, unknown>;
}

export interface RecipeWithStatus extends RecipeBase {
  status: RecipeStatus;
}

export type DownloadStatus =
  | "queued"
  | "downloading"
  | "paused"
  | "completed"
  | "failed"
  | "canceled";

export interface ModelDownload {
  id: string;
  model_id: string;
  revision: string | null;
  status: DownloadStatus;
  source?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  target_dir: string;
  total_bytes: number | null;
  downloaded_bytes: number;
  speed_bytes_per_second?: number | null;
  error: string | null;
}

export interface ModelInfo {
  path: string;
  name: string;
  size_bytes?: number | null;
  quantization?: string | null;
  context_length?: number | null;
  has_recipe?: boolean;
}

export interface HuggingFaceModel {
  modelId: string;
  downloads: number;
  likes: number;
  tags: string[];
  pipeline_tag?: string;
  library_name?: string;
  author?: string;
  weightBytes?: number;
}

export type ExploreModelState = "local" | "remote" | "starting" | DownloadStatus;

export interface ExploreVariant {
  modelId: string;
  quant: string | null;
  needGb: number;
  downloads: number;
  likes: number;
  state: ExploreModelState;
}

export interface ExploreModelGroup {
  key: string;
  lead: ExploreVariant;
  variants: ExploreVariant[];
  fits: boolean;
}

export type LaunchStage =
  | "preempting"
  | "evicting"
  | "launching"
  | "waiting"
  | "ready"
  | "cancelled"
  | "error";

export interface LaunchProgress {
  stage: LaunchStage;
  message?: string;
  recipe_id?: string;
}

export type RecipesSection = "explore" | "recipes" | "downloads";

export type RecipeEditorTab =
  | "general"
  | "model"
  | "resources"
  | "performance"
  | "features"
  | "environment"
  | "command";
