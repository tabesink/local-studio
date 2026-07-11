import type { ComponentType, ReactNode } from "react";
import { AdminConfigurationDemo } from "../../features/admin-configuration";
import { AgentWorkspaceDemo } from "../../features/agent-workspace";
import { ChatShellDemo } from "../../features/chat-shell";
import { DashboardDemo } from "../../features/dashboard";
import { EnvironmentControlsDemo } from "../../features/environment-controls";
import { LogsObservabilityDemo } from "../../features/logs-observability";
import { NavigationSidebarDemo } from "../../features/navigation-sidebar";
import { RecipesModelsDemo } from "../../features/recipes-models";
import { SettingsPanelDemo } from "../../features/settings-panel";
import { SetupWizardDemo } from "../../features/setup-wizard";
import { UsageCostReportingDemo } from "../../features/usage-cost-reporting";
import { UserPreferencesDemo } from "../../features/user-preferences";

export type FeatureSlug =
  | "navigation-sidebar"
  | "dashboard"
  | "settings-panel"
  | "environment-controls"
  | "logs-observability"
  | "usage-cost-reporting"
  | "chat-shell"
  | "user-preferences"
  | "admin-configuration"
  | "recipes-models"
  | "setup-wizard"
  | "agent-workspace";

export type FeatureEntry = {
  slug: FeatureSlug;
  title: string;
  description: string;
  Demo: ComponentType<{ children?: ReactNode }>;
};

export const FEATURES: FeatureEntry[] = [
  {
    slug: "navigation-sidebar",
    title: "Navigation Sidebar",
    description: "Collapsible sidebar, search, and route list.",
    Demo: NavigationSidebarDemo,
  },
  {
    slug: "dashboard",
    title: "Dashboard",
    description: "Operator status panel, GPU strip, and log tail.",
    Demo: DashboardDemo,
  },
  {
    slug: "settings-panel",
    title: "Settings Panel",
    description: "Compact settings sections and form controls.",
    Demo: SettingsPanelDemo,
  },
  {
    slug: "environment-controls",
    title: "Environment Controls",
    description: "Environment selector and runtime controls.",
    Demo: EnvironmentControlsDemo,
  },
  {
    slug: "logs-observability",
    title: "Logs / Observability",
    description: "Log stream, filters, and observability panels.",
    Demo: LogsObservabilityDemo,
  },
  {
    slug: "usage-cost-reporting",
    title: "Usage / Cost Reporting",
    description: "Token usage and cost breakdown views.",
    Demo: UsageCostReportingDemo,
  },
  {
    slug: "chat-shell",
    title: "Chat Shell",
    description: "Chat transcript, composer, and tool-call states.",
    Demo: ChatShellDemo,
  },
  {
    slug: "user-preferences",
    title: "User Preferences",
    description: "Local UI preference toggles and persistence.",
    Demo: UserPreferencesDemo,
  },
  {
    slug: "admin-configuration",
    title: "Admin Configuration",
    description: "Admin-only configuration surfaces.",
    Demo: AdminConfigurationDemo,
  },
  {
    slug: "recipes-models",
    title: "Recipes / Models",
    description: "Model library: explore, launch recipes, and downloads.",
    Demo: RecipesModelsDemo,
  },
  {
    slug: "setup-wizard",
    title: "Setup Wizard",
    description: "First-run onboarding: hardware, model, download, launch, benchmark.",
    Demo: SetupWizardDemo,
  },
  {
    slug: "agent-workspace",
    title: "Agent Workspace",
    description: "Pane grid, computer panel with nine tabs, sessions, and ⌘K.",
    Demo: AgentWorkspaceDemo,
  },
];

export const FEATURES_BY_SLUG = Object.fromEntries(
  FEATURES.map((feature) => [feature.slug, feature]),
) as Record<FeatureSlug, FeatureEntry>;

export function isFeatureSlug(value: string): value is FeatureSlug {
  return value in FEATURES_BY_SLUG;
}

export function getFeature(slug: string): FeatureEntry | undefined {
  return isFeatureSlug(slug) ? FEATURES_BY_SLUG[slug] : undefined;
}
