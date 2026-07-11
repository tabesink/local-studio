import type {
  BenchmarkResult,
  ModelRecommendation,
  RuntimeTargetRow,
  StudioDiagnostics,
  StudioSettings,
} from "../types";

export const settingsFixture: StudioSettings = {
  config_path: "/home/operator/.config/local-studio/config.json",
  effective: { models_dir: "/mnt/llm_models" },
  persisted: { models_dir: "/mnt/llm_models" },
};

export const diagnosticsFixture: StudioDiagnostics = {
  platform: "linux",
  arch: "x86_64",
  cpu_model: "AMD EPYC 7443P 24-Core Processor",
  cpu_cores: 48,
  memory_total_gb: 256,
  gpus: [
    { name: "NVIDIA RTX 6000 Ada Generation", memory_total_gb: 48 },
    { name: "NVIDIA RTX 6000 Ada Generation", memory_total_gb: 48 },
  ],
  runtime: { vllm_installed: true },
};

export const recommendationsFixture: ModelRecommendation[] = [
  {
    id: "Qwen/Qwen3-32B-AWQ",
    name: "Qwen3 32B AWQ",
    description: "Strong general model quantized to fit a single 48 GB GPU with headroom.",
    size_gb: 19.4,
    min_vram_gb: 24,
    tags: ["chat", "reasoning"],
  },
  {
    id: "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B",
    name: "DeepSeek R1 Distill 14B",
    description: "Compact reasoning distill that keeps long-context throughput high.",
    size_gb: 29.5,
    min_vram_gb: 32,
    tags: ["reasoning"],
  },
  {
    id: "meta-llama/Llama-3.1-8B-Instruct",
    name: "Llama 3.1 8B Instruct",
    description: "Reliable small instruct model; good first launch on any CUDA GPU.",
    size_gb: 16.1,
    min_vram_gb: 18,
    tags: ["chat"],
  },
  {
    id: "microsoft/Phi-4-mini-instruct",
    name: "Phi-4 mini instruct",
    description: "Tiny but capable; ideal for CPU-only or low-VRAM smoke tests.",
    size_gb: 7.7,
    min_vram_gb: 8,
    tags: ["small"],
  },
];

export const runtimeTargetsFixture: RuntimeTargetRow[] = [
  {
    id: "runtime-vllm",
    backend: "vllm",
    label: "vLLM",
    installed: true,
    detail: "venv /opt/local-studio/runtimes/vllm · python 3.11.9 · vllm 0.9.2",
  },
  {
    id: "runtime-sglang",
    backend: "sglang",
    label: "SGLang",
    installed: false,
    detail: "Not installed on the active target",
  },
  {
    id: "runtime-mlx",
    backend: "mlx",
    label: "MLX",
    installed: false,
    detail: "Requires Apple silicon target",
  },
];

export const benchmarkFixture: BenchmarkResult = {
  prompt_tokens: 1000,
  completion_tokens: 100,
  total_time_s: 3.42,
  generation_tps: 41.8,
};

export const downloadTotalBytes = 19_460_000_000;
