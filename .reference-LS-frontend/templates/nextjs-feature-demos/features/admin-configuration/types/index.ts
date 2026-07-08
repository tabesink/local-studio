export type AdminTab = "system" | "engines" | "plugins" | "skills" | "setup";

export interface SystemFactRow {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "default" | "good" | "warning" | "danger" | "info";
  statusLabel?: string;
}

export interface RuntimeTarget {
  id: string;
  backend: "vllm" | "sglang" | "llamacpp" | "mlx";
  version: string;
  installed: boolean;
}

export interface EngineJob {
  id: string;
  backend: RuntimeTarget["backend"];
  status: "queued" | "running" | "success" | "error" | "cancelled";
  message?: string;
}

export interface McpServer {
  id: string;
  name: string;
  command?: string;
  enabled: boolean;
  tags?: string[];
  toolCount?: number;
}

export interface CuratedPlugin {
  id: string;
  name: string;
  description: string;
  installed: boolean;
}

export interface SkillGroup {
  source: string;
  count: number;
  detail: string;
}

export interface SetupCheck {
  id: string;
  label: string;
  ok: boolean;
  value: string;
  guidance: string;
}
