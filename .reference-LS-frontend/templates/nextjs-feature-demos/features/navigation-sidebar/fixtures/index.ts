import type { ActiveSessionDetail, NavItemDef, ProjectNavRow } from "../types";

export const navItems: NavItemDef[] = [
  { href: "/", label: "Status", icon: "gauge" },
  { href: "/usage", label: "Usage", icon: "microchip" },
  { href: "/recipes", label: "Models", icon: "hard-drive" },
  { href: "/plugins", label: "Plugins", icon: "plug" },
  { href: "/server", label: "Server", icon: "globe" },
];

export const projectRows: ProjectNavRow[] = [
  { id: "chats", name: "Chats", path: "~/Local Studio/Chats", activeSessions: 2 },
  { id: "context-engine", name: "context-engine", path: "~/work/context-engine", activeSessions: 1 },
];

export const activeSessions: ActiveSessionDetail[] = [
  {
    projectId: "context-engine",
    cwd: "~/work/context-engine",
    paneId: "pane-main",
    tabId: "tab-a",
    piSessionId: "pi_abc",
    title: "Implement feature docs",
    status: "running",
    updatedAt: "2026-07-07T15:30:00Z",
  },
];
