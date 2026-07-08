export const SIDEBAR_MIN_WIDTH = 188;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 224;
export const SIDEBAR_STORAGE_KEY = "local-studio-demo.sidebar";

export const navigationEndpoints = {
  projects: "/api/agent/projects",
  sessionsSearch: "/api/agent/sessions/all?since=30d",
} as const;
