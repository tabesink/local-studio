export interface LogSession {
  id: string;
  model?: string;
  backend?: string;
  status: string;
  created_at: string;
}

export interface ServerStatus {
  backendUrl: string;
  connected: boolean;
  running: boolean;
  inferencePort: number;
  platform: string;
  gpuCount: number;
  controllerVersion: string;
  activeModel: string | null;
  backends: string[];
  sessions: number;
}

export type ObservabilityTab = "logs" | "server";
export type ServerConsoleTab = "server-logs" | "api-docs";
