export interface NavItemDef {
  href: string;
  label: string;
  icon: string;
}

export interface ProjectNavRow {
  id: string;
  name: string;
  path: string;
  activeSessions: number;
}

export interface SidebarPrefs {
  desktopSidebarPinnedOpen: boolean;
  sidebarWidth: number;
}

export interface ActiveSessionDetail {
  projectId: string;
  cwd: string;
  paneId: string;
  tabId: string;
  piSessionId: string | null;
  title: string;
  status: string;
  updatedAt: string;
}
