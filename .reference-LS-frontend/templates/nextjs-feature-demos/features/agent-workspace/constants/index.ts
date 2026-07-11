import type { ComputerTab } from "../types";

/* Tab labels — agent-browser-panel.tsx TAB_LABELS. */
export const TAB_LABELS: Record<ComputerTab, string> = {
  status: "Status",
  tools: "Tools",
  canvas: "Canvas",
  "side-chat": "Side chat",
  browser: "Browser",
  files: "Filesystem",
  diff: "Git",
  plan: "Plan",
  terminal: "Terminal",
};

/* localStorage keys mirrored from workspace/tools persistence. */
export const PANE_STATE_STORAGE_KEY = "local-studio.agent.paneState";
export const COMPUTER_WIDTH_STORAGE_KEY = "local-studio.agent.computer.width";
export const COMPUTER_TAB_STORAGE_KEY = "local-studio.agent.computer.tab";

export const COMPUTER_DEFAULT_WIDTH = 440;
export const SPLIT_RATIO_MIN = 0.15;
export const SPLIT_RATIO_MAX = 0.85;

/* Timeline empty-state copy (timeline.tsx). */
export const TIMELINE_EMPTY_TITLE = "A dream is something you build for yourself.";
export const TIMELINE_EMPTY_HINT = "Just talk to it.";

/* Command palette app destinations (sessions-command.tsx). */
export const APP_DESTINATIONS = [
  { label: "Status", href: "/" },
  { label: "Usage", href: "/usage" },
  { label: "Models", href: "/recipes" },
  { label: "Plugins", href: "/plugins" },
  { label: "Server", href: "/server" },
  { label: "Agent", href: "/agent" },
  { label: "Agent Sessions", href: "/agent/sessions" },
  { label: "Settings", href: "/settings" },
];
