import type {
  CuratedPlugin,
  EngineJob,
  McpServer,
  RuntimeTarget,
  SetupCheck,
  SkillGroup,
  SystemFactRow,
} from "../types";

export const systemFacts: Record<"controller" | "network" | "storage" | "hardware", SystemFactRow[]> = {
  controller: [
    { label: "Config status", value: "Loaded from controller", tone: "good", statusLabel: "live" },
    { label: "Controller version", value: "0.9.4", mono: true },
    { label: "Active backend", value: "vllm", mono: true },
    { label: "Uptime", value: "3d 4h", mono: true },
  ],
  network: [
    { label: "Host", value: "127.0.0.1", mono: true },
    { label: "Controller port", value: "8080", mono: true },
    { label: "Inference port", value: "8000", mono: true },
    { label: "API key", value: "configured", tone: "good", statusLabel: "set" },
  ],
  storage: [
    { label: "Models", value: "~/models", mono: true },
    { label: "Data", value: "~/.local-studio/data", mono: true },
    { label: "Free space", value: "212 GB", mono: true },
  ],
  hardware: [
    { label: "Platform", value: "linux / cuda", mono: true },
    { label: "GPU types", value: "NVIDIA RTX 6000 Ada Generation", mono: true },
    { label: "CUDA", value: "12.4", mono: true },
    { label: "GPU count", value: "2", mono: true, tone: "good", statusLabel: "detected" },
  ],
};

export const runtimeTargets: RuntimeTarget[] = [
  { id: "vllm", backend: "vllm", version: "0.8.4", installed: true },
  { id: "sglang", backend: "sglang", version: "0.4.6", installed: true },
  { id: "llamacpp", backend: "llamacpp", version: "b4521", installed: true },
  { id: "mlx", backend: "mlx", version: "—", installed: false },
];

export const engineJobs: EngineJob[] = [
  { id: "job-1", backend: "vllm", status: "success", message: "Installed 0.8.4" },
  { id: "job-2", backend: "llamacpp", status: "running", message: "Updating runtime to b4560" },
  { id: "job-3", backend: "sglang", status: "queued", message: "Waiting for llamacpp job" },
];

export const mcpServers: McpServer[] = [
  { id: "context7", name: "context7", command: "npx -y @upstash/context7-mcp", enabled: true, tags: ["docs"], toolCount: 2 },
  { id: "github", name: "github", command: "github-mcp-server stdio", enabled: true, tags: ["oauth"], toolCount: 24 },
  { id: "playwright", name: "playwright", command: "npx @playwright/mcp@latest", enabled: false, tags: ["browser"], toolCount: 12 },
];

export const curatedPlugins: CuratedPlugin[] = [
  { id: "reducto", name: "reducto", description: "Parse PDFs and documents into structured data.", installed: false },
  { id: "linear", name: "linear", description: "Manage Linear issues from the composer.", installed: false },
  { id: "sentry", name: "sentry", description: "Query Sentry issues and events.", installed: false },
];

export const skillGroups: SkillGroup[] = [
  { source: "Codex", count: 18, detail: "~/.codex/skills" },
  { source: "Claude", count: 7, detail: "~/.claude/skills" },
  { source: "Pi", count: 4, detail: "~/.pi/skills" },
  { source: "OpenCode", count: 0, detail: "not found" },
];

export const setupChecks: SetupCheck[] = [
  { id: "controller", label: "Controller reachable", ok: true, value: "http://127.0.0.1:8080", guidance: "" },
  { id: "pi", label: "Pi binary", ok: true, value: "pi 0.31.2", guidance: "" },
  { id: "models", label: "Models directory", ok: true, value: "~/models", guidance: "" },
  {
    id: "skills",
    label: "Local skills",
    ok: false,
    value: "OpenCode skills not found",
    guidance: "Attach local agents in Settings → Skills.",
  },
];

export const mcpJsonPlaceholder = `{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}`;
