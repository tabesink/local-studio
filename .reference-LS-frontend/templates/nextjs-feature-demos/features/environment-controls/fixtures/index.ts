import type { ApiConnectionSettings, ControllerEntry } from "../types";

export const controllerEntries: ControllerEntry[] = [
  {
    id: "http://127.0.0.1:8080",
    url: "http://127.0.0.1:8080",
    name: "local",
    apiKey: "demo-local-key",
  },
  {
    id: "http://192.168.1.70:8080",
    url: "http://192.168.1.70:8080",
    name: "homelab",
  },
];

export const apiConnectionSettings: ApiConnectionSettings = {
  backendUrl: "http://127.0.0.1:8080",
  apiKey: "demo-local-key",
  hasApiKey: true,
  voiceUrl: "http://127.0.0.1:8081",
  voiceModel: "whisper-large-v3-turbo",
};
