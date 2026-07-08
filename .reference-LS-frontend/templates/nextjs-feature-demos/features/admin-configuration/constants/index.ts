export const adminTabs = [
  { id: "system", label: "System" },
  { id: "engines", label: "Engines" },
  { id: "plugins", label: "Plugins" },
  { id: "skills", label: "Skills" },
  { id: "setup", label: "Setup" },
] as const;

export const adminEndpoints = {
  config: "/config",
  compat: "/compat",
  runtimeTargets: "/runtime/targets",
  runtimeJobs: "/runtime/jobs",
  mcpServers: "/api/mcp/servers?includeDisabled=1",
  skills: "/api/agent/skills",
  setupChecks: "/api/agent/setup-checks",
} as const;
