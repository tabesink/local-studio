import type { SettingsSectionDef } from "../types";

/* Section list mirrors features/settings/settings-view.tsx in the reference. */
export const settingsSections: SettingsSectionDef[] = [
  {
    id: "connection",
    label: "Connection",
    description: "Controller URL, API key, voice defaults.",
    icon: "cable",
  },
  {
    id: "system",
    label: "System",
    description: "Runtime targets, services, storage, hardware.",
    icon: "cpu",
  },
  {
    id: "appearance",
    label: "Appearance",
    description: "Theme variables, typography, density.",
    icon: "paintbrush",
  },
  {
    id: "archive",
    label: "Archived chats",
    description: "Pi sessions kept out of normal chat lists.",
    icon: "archive",
  },
  {
    id: "plugins",
    label: "Plugins",
    description: "MCP server catalog, OAuth connections, and composer availability.",
    icon: "plug",
  },
  {
    id: "skills",
    label: "Skills",
    description: "Normalized local skills from Codex, Pi, Claude, Factory, OpenCode.",
    icon: "graduation-cap",
  },
  {
    id: "setup",
    label: "Setup",
    description: "First-run checks for Pi, controller, and local directories.",
    icon: "server-cog",
  },
];

export const settingsEndpoints = {
  apiSettings: "/api/settings",
  config: "/config",
  compat: "/compat",
} as const;
