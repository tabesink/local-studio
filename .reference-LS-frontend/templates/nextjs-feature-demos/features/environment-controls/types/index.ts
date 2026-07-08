export interface SavedController {
  url: string;
  apiKey?: string;
  name?: string;
}

export interface ApiConnectionSettings {
  backendUrl: string;
  apiKey: string;
  hasApiKey: boolean;
  voiceUrl: string;
  voiceModel: string;
}

export type ConnectionStatus = "unknown" | "connected" | "error";

export interface ControllerEntry extends SavedController {
  id: string;
}
