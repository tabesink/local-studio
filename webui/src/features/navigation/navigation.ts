import type { Role } from "@/features/auth/session";

export type NavigationItemId = "chat" | "documents" | "graph" | "operations";
export type NavigationIcon = "MessageSquare" | "Files" | "Network" | "Activity";

export type NavigationItem = {
  id: NavigationItemId;
  label: string;
  href: string;
  icon: NavigationIcon;
  roles: readonly Role[];
};

export const navigationItems = [
  {
    id: "chat",
    label: "Chat",
    href: "/chat",
    icon: "MessageSquare",
    roles: ["member", "admin"],
  },
  {
    id: "documents",
    label: "Documents",
    href: "/documents",
    icon: "Files",
    roles: ["member", "admin"],
  },
  {
    id: "graph",
    label: "Knowledge Graph",
    href: "/graph",
    icon: "Network",
    roles: ["member", "admin"],
  },
  {
    id: "operations",
    label: "Operations",
    href: "/operations",
    icon: "Activity",
    roles: ["admin"],
  },
] as const satisfies readonly NavigationItem[];

export type SettingsSectionId = "general" | "users" | "domains" | "providers";

export type SettingsSection = {
  id: SettingsSectionId;
  label: string;
  description: string;
  roles: readonly Role[];
};

export const settingsSections = [
  {
    id: "general",
    label: "General",
    description: "Theme and personal workbench preferences.",
    roles: ["member", "admin"],
  },
  {
    id: "users",
    label: "Users",
    description: "User and role administration placeholder.",
    roles: ["admin"],
  },
  {
    id: "domains",
    label: "Domains",
    description: "Domain administration placeholder.",
    roles: ["admin"],
  },
  {
    id: "providers",
    label: "Providers",
    description: "Model provider configuration placeholder.",
    roles: ["admin"],
  },
] as const satisfies readonly SettingsSection[];

export function canRoleAccess(roles: readonly Role[], role: Role) {
  return roles.includes(role);
}

export function filterNavigationItems(role: Role) {
  return navigationItems.filter((item) => canRoleAccess(item.roles, role));
}

export function filterSettingsSections(role: Role) {
  return settingsSections.filter((section) => canRoleAccess(section.roles, role));
}

export function isRouteActive(pathname: string, href: string) {
  if (href === "/graph") {
    return pathname === "/graph" || pathname.startsWith("/graph/") || pathname === "/database-visualize";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminOnlyPath(pathname: string) {
  return pathname === "/operations" || pathname.startsWith("/operations/");
}
