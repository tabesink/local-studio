import type { LogSession, ServerStatus } from "../types";

export const logSessions: LogSession[] = [
  {
    id: "controller",
    model: "controller",
    backend: "system",
    status: "running",
    created_at: "2026-07-08T07:41:00Z",
  },
  {
    id: "20260708-074104-qwen2.5-coder-14b",
    model: "Qwen/Qwen2.5-Coder-14B-Instruct",
    backend: "vllm",
    status: "running",
    created_at: "2026-07-08T07:41:04Z",
  },
  {
    id: "20260707-192013-llama-3.3-70b-awq",
    model: "Llama 3.3 70B AWQ",
    backend: "vllm",
    status: "stopped",
    created_at: "2026-07-07T19:20:13Z",
  },
  {
    id: "20260706-101530-gpt-oss-20b",
    model: "GPT-OSS 20B",
    backend: "sglang",
    status: "stopped",
    created_at: "2026-07-06T10:15:30Z",
  },
];

export const logLinesBySession: Record<string, string[]> = {
  controller: [
    "2026-07-08 07:41:00 INFO controller listening on http://127.0.0.1:8080",
    "2026-07-08 07:41:01 INFO proxy ready, strict backend headers enabled",
    "2026-07-08 07:41:02 INFO scanned 2 GPUs (cuda 12.4)",
    "2026-07-08 07:41:30 WARN metrics endpoint delayed by 1200ms",
    "2026-07-08 07:42:00 INFO /status 200 in 4ms",
  ],
  "20260708-074104-qwen2.5-coder-14b": [
    "2026-07-08 07:41:04 INFO launching recipe qwen2.5-coder-14b (vllm)",
    "2026-07-08 07:41:06 INFO loading weights shard 1/6",
    "2026-07-08 07:41:09 INFO loading weights shard 4/6",
    "2026-07-08 07:41:18 INFO vLLM engine initialized, kv cache 42112 blocks",
    "2026-07-08 07:41:19 INFO serving Qwen/Qwen2.5-Coder-14B-Instruct on :8000",
    "2026-07-08 07:43:11 INFO /v1/chat/completions 200 in 1.82s",
    "2026-07-08 07:44:27 WARN kv cache usage above 70%",
    "2026-07-08 07:45:01 INFO /v1/chat/completions 200 in 2.04s",
  ],
  "20260707-192013-llama-3.3-70b-awq": [
    "2026-07-07 19:20:13 INFO launching recipe llama-3.3-70b-awq (vllm)",
    "2026-07-07 19:20:45 INFO loading weights shard 9/30",
    "2026-07-07 19:22:02 ERROR CUDA out of memory: tried to allocate 1.42 GiB",
    "2026-07-07 19:22:03 ERROR engine start failed, evicting process",
    "2026-07-07 19:22:04 INFO session stopped",
  ],
  "20260706-101530-gpt-oss-20b": [
    "2026-07-06 10:15:30 INFO launching recipe gpt-oss-20b (sglang)",
    "2026-07-06 10:16:12 INFO sglang server ready on :8000",
    "2026-07-06 10:40:03 INFO /v1/chat/completions 200 in 0.94s",
    "2026-07-06 12:01:44 INFO session stopped by user",
  ],
};

/* Lines appended while auto-refresh is on, simulating the SSE stream at
   /api/proxy/logs/{id}/stream?tail=0. */
export const streamedLines = [
  "INFO /v1/chat/completions 200 in 1.67s",
  "INFO metrics sample received (gen 73.8 tok/s)",
  "INFO /v1/chat/completions 200 in 2.11s",
  "WARN kv cache usage above 75%",
  "INFO /v1/chat/completions 200 in 1.90s",
];

export const serverStatus: ServerStatus = {
  backendUrl: "http://127.0.0.1:8080",
  connected: true,
  running: true,
  inferencePort: 8000,
  platform: "cuda",
  gpuCount: 2,
  controllerVersion: "0.9.4",
  activeModel: "Qwen/Qwen2.5-Coder-14B-Instruct",
  backends: ["vllm 0.8.4", "sglang 0.4.6", "llama.cpp b4521"],
  sessions: logSessions.length,
};
