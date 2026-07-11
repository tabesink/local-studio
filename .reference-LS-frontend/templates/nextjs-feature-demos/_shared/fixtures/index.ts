export const featureNavItems = [
  { href: "/", label: "Status", icon: "gauge" },
  { href: "/usage", label: "Usage", icon: "microchip" },
  { href: "/recipes", label: "Models", icon: "hard-drive" },
  { href: "/plugins", label: "Plugins", icon: "plug" },
  { href: "/server", label: "Server", icon: "globe" },
  { href: "/settings", label: "Settings", icon: "settings" },
] as const;

export const featureSlices = [
  "navigation-sidebar",
  "dashboard",
  "settings-panel",
  "environment-controls",
  "logs-observability",
  "usage-cost-reporting",
  "chat-shell",
  "user-preferences",
  "admin-configuration",
] as const;

export type FeatureSliceId = (typeof featureSlices)[number];
