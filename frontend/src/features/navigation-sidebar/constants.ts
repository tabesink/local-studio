export const SIDEBAR_MIN_WIDTH = 188;
export const SIDEBAR_MAX_WIDTH = 320;
export const SIDEBAR_DEFAULT_WIDTH = 224;

export type NavItemDef = {
  href: string;
  label: string;
  icon: "chat" | "library" | "graph" | "logs" | "settings";
  adminOnly?: boolean;
};

/* Production nav registry. LS product surfaces without CE contracts
   (Status/dashboard, Usage, Models/recipes, Plugins, Server) stay
   unregistered until F-010 API/data contracts exist. */
export const NAV_ITEMS: NavItemDef[] = [
  { href: "/chat", label: "Chat", icon: "chat" },
  { href: "/documents", label: "Library", icon: "library" },
  { href: "/database-visualize", label: "Graph", icon: "graph" },
  { href: "/logs", label: "Logs", icon: "logs", adminOnly: true },
];

export const SETTINGS_NAV_ITEM: NavItemDef = {
  href: "/settings",
  label: "Settings",
  icon: "settings",
};
