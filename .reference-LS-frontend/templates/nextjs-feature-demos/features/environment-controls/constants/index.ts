export const CONTROLLERS_STORAGE_KEY = "local-studio.controllers";
export const BACKEND_URL_STORAGE_KEY = "localstudio_backend_url";
export const DEFAULT_BACKEND_URL = "http://127.0.0.1:8080";

export const environmentEndpoints = {
  settings: "/api/settings",
  statusViaProxy: "/api/proxy/status",
} as const;
