import type { SettingsPanelSnapshot } from "../types";

export const settingsPanelSnapshot: SettingsPanelSnapshot = {
  status: "controller synced",
  apiSettings: {
    backendUrl: "http://127.0.0.1:8080",
    apiKey: "sk-local-****",
    hasApiKey: true,
    voiceUrl: "http://127.0.0.1:8880",
    voiceModel: "kokoro-82m",
  },
  systemFacts: {
    controller: [
      { label: "Config status", value: "Loaded from controller", tone: "good", statusLabel: "live" },
      { label: "Controller version", value: "0.9.4", mono: true },
      { label: "Active backend", value: "vllm", mono: true },
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
      { label: "Database", value: "~/.local-studio/data/studio.db", mono: true },
    ],
    hardware: [
      { label: "Platform", value: "linux / cuda", mono: true },
      { label: "GPU types", value: "NVIDIA RTX 6000 Ada Generation", mono: true },
      { label: "CUDA", value: "12.4", mono: true },
      { label: "GPU count", value: "2", mono: true },
    ],
  },
  archivedChats: [
    {
      id: "pi-4821",
      title: "Refactor recipe launcher",
      project: "local-studio",
      archivedAt: "2026-07-01",
    },
    {
      id: "pi-4760",
      title: "Debug kv-cache spike",
      project: "context-engine",
      archivedAt: "2026-06-27",
    },
  ],
  plugins: [
    { id: "context7", name: "context7", enabled: true, toolCount: 2 },
    { id: "github", name: "github", enabled: true, toolCount: 24 },
    { id: "playwright", name: "playwright", enabled: false, toolCount: 12 },
    { id: "reducto", name: "reducto", enabled: true, toolCount: 8 },
  ],
  skills: [
    {
      id: "create-rule",
      name: "create-rule",
      source: "codex",
      description: "Create project rules for persistent agent guidance.",
    },
    {
      id: "pdf-tools",
      name: "pdf-tools",
      source: "claude",
      description: "Split, merge, and extract text from PDF files.",
    },
    {
      id: "release-notes",
      name: "release-notes",
      source: "pi",
      description: "Draft release notes from conventional commits.",
    },
  ],
  setupChecks: [
    { id: "pi", label: "Pi binary", status: "ok", detail: "pi 0.31.2 on PATH" },
    { id: "controller", label: "Controller reachable", status: "ok", detail: "http://127.0.0.1:8080" },
    { id: "models-dir", label: "Models directory", status: "warning", detail: "~/models is 92% full" },
    { id: "data-dir", label: "Data directory", status: "ok", detail: "~/.local-studio/data writable" },
  ],
};
