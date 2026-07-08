import type {
  ExploreModelGroup,
  ModelDownload,
  ModelInfo,
  RecipeWithStatus,
} from "../types";

function recipeDefaults() {
  return {
    tensor_parallel_size: 1,
    pipeline_parallel_size: 1,
    max_model_len: 32768,
    gpu_memory_utilization: 0.9,
    kv_cache_dtype: "auto",
    max_num_seqs: 256,
    trust_remote_code: true,
    quantization: null,
    dtype: "auto",
    host: "0.0.0.0",
    port: 8000,
    env_vars: null,
    extra_args: {},
  };
}

export const recipeFixtures: RecipeWithStatus[] = [
  {
    ...recipeDefaults(),
    id: "recipe-qwen3-32b",
    name: "Qwen3 32B AWQ",
    model_path: "/mnt/llm_models/Qwen3-32B-AWQ",
    backend: "vllm",
    served_model_name: "qwen3-32b-awq",
    quantization: "awq",
    tensor_parallel_size: 2,
    status: "running",
  },
  {
    ...recipeDefaults(),
    id: "recipe-deepseek-r1-distill",
    name: "DeepSeek R1 Distill 14B",
    model_path: "/mnt/llm_models/DeepSeek-R1-Distill-Qwen-14B",
    backend: "sglang",
    served_model_name: "deepseek-r1-distill-14b",
    max_model_len: 16384,
    status: "stopped",
  },
  {
    ...recipeDefaults(),
    id: "recipe-phi4-mini",
    name: "Phi-4 mini GGUF",
    model_path: "/mnt/llm_models/phi-4-mini-instruct-Q4_K_M.gguf",
    backend: "llamacpp",
    served_model_name: "phi-4-mini",
    quantization: "Q4_K_M",
    max_model_len: 8192,
    status: "stopped",
  },
  {
    ...recipeDefaults(),
    id: "recipe-llama31-8b",
    name: "Llama 3.1 8B Instruct",
    model_path: "/mnt/llm_models/Meta-Llama-3.1-8B-Instruct",
    backend: "vllm",
    served_model_name: "llama-3.1-8b-instruct",
    status: "error",
  },
];

export const localModelFixtures: ModelInfo[] = [
  {
    path: "/mnt/llm_models/Qwen3-32B-AWQ",
    name: "Qwen3-32B-AWQ",
    size_bytes: 19_460_000_000,
    quantization: "awq",
    context_length: 32768,
    has_recipe: true,
  },
  {
    path: "/mnt/llm_models/DeepSeek-R1-Distill-Qwen-14B",
    name: "DeepSeek-R1-Distill-Qwen-14B",
    size_bytes: 29_550_000_000,
    context_length: 131072,
    has_recipe: true,
  },
  {
    path: "/mnt/llm_models/phi-4-mini-instruct-Q4_K_M.gguf",
    name: "phi-4-mini-instruct-Q4_K_M.gguf",
    size_bytes: 2_490_000_000,
    quantization: "Q4_K_M",
    context_length: 131072,
    has_recipe: true,
  },
  {
    path: "/mnt/llm_models/Meta-Llama-3.1-8B-Instruct",
    name: "Meta-Llama-3.1-8B-Instruct",
    size_bytes: 16_070_000_000,
    context_length: 131072,
    has_recipe: true,
  },
];

export const downloadFixtures: ModelDownload[] = [
  {
    id: "dl-glm-47-air",
    model_id: "zai-org/GLM-4.5-Air",
    revision: null,
    status: "downloading",
    source: "Hugging Face",
    created_at: "2026-07-08T12:04:11Z",
    updated_at: "2026-07-08T12:19:42Z",
    completed_at: null,
    target_dir: "/mnt/llm_models/GLM-4.5-Air",
    total_bytes: 221_500_000_000,
    downloaded_bytes: 74_020_000_000,
    speed_bytes_per_second: 118_000_000,
    error: null,
  },
  {
    id: "dl-qwen3-coder",
    model_id: "Qwen/Qwen3-Coder-30B-A3B-Instruct",
    revision: null,
    status: "paused",
    source: "Hugging Face",
    created_at: "2026-07-08T09:31:02Z",
    updated_at: "2026-07-08T10:02:19Z",
    completed_at: null,
    target_dir: "/mnt/llm_models/Qwen3-Coder-30B-A3B-Instruct",
    total_bytes: 61_100_000_000,
    downloaded_bytes: 18_930_000_000,
    speed_bytes_per_second: null,
    error: null,
  },
  {
    id: "dl-phi4-mini",
    model_id: "microsoft/Phi-4-mini-instruct",
    revision: null,
    status: "completed",
    source: "Hugging Face",
    created_at: "2026-07-07T18:12:44Z",
    updated_at: "2026-07-07T18:41:03Z",
    completed_at: "2026-07-07T18:41:03Z",
    target_dir: "/mnt/llm_models/Phi-4-mini-instruct",
    total_bytes: 7_680_000_000,
    downloaded_bytes: 7_680_000_000,
    speed_bytes_per_second: null,
    error: null,
  },
  {
    id: "dl-mixtral",
    model_id: "mistralai/Mixtral-8x22B-Instruct-v0.1",
    revision: null,
    status: "failed",
    source: "Hugging Face",
    created_at: "2026-07-06T21:44:19Z",
    updated_at: "2026-07-06T22:03:51Z",
    completed_at: null,
    target_dir: "/mnt/llm_models/Mixtral-8x22B-Instruct-v0.1",
    total_bytes: 281_200_000_000,
    downloaded_bytes: 44_310_000_000,
    speed_bytes_per_second: null,
    error: "401 Unauthorized: gated repo requires an accepted license and a valid HF token.",
  },
];

/* Grouped Hugging Face search results (Search Models section). `fits`
   drives the model-row-shine success highlight. */
export const exploreGroupFixtures: ExploreModelGroup[] = [
  {
    key: "Qwen/Qwen3-32B",
    lead: {
      modelId: "Qwen/Qwen3-32B",
      quant: null,
      needGb: 65.6,
      downloads: 2_143_882,
      likes: 1544,
      state: "remote",
    },
    fits: false,
    variants: [
      {
        modelId: "Qwen/Qwen3-32B-AWQ",
        quant: "awq",
        needGb: 19.4,
        downloads: 311_204,
        likes: 208,
        state: "local",
      },
      {
        modelId: "unsloth/Qwen3-32B-GGUF",
        quant: "Q4_K_M",
        needGb: 20.1,
        downloads: 188_930,
        likes: 173,
        state: "remote",
      },
    ],
  },
  {
    key: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    lead: {
      modelId: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
      quant: null,
      needGb: 29.5,
      downloads: 1_402_113,
      likes: 1102,
      state: "local",
    },
    fits: true,
    variants: [
      {
        modelId: "bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF",
        quant: "Q5_K_M",
        needGb: 10.5,
        downloads: 424_551,
        likes: 301,
        state: "remote",
      },
    ],
  },
  {
    key: "zai-org/GLM-4.5-Air",
    lead: {
      modelId: "zai-org/GLM-4.5-Air",
      quant: null,
      needGb: 221.5,
      downloads: 891_020,
      likes: 986,
      state: "downloading",
    },
    fits: false,
    variants: [],
  },
  {
    key: "microsoft/Phi-4-mini-instruct",
    lead: {
      modelId: "microsoft/Phi-4-mini-instruct",
      quant: null,
      needGb: 7.7,
      downloads: 655_483,
      likes: 512,
      state: "local",
    },
    fits: true,
    variants: [
      {
        modelId: "unsloth/Phi-4-mini-instruct-GGUF",
        quant: "Q4_K_M",
        needGb: 2.5,
        downloads: 209_113,
        likes: 144,
        state: "local",
      },
    ],
  },
];

/* Explore FALLBACK_MODELS — shown when a search has no results. */
export const exploreFallbackRows = [
  { modelId: "Qwen/Qwen3-32B", note: "fallback" },
  { modelId: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", note: "fallback" },
  { modelId: "microsoft/Phi-4-mini-instruct", note: "fallback" },
];

export const detectedVramGb = 48;
