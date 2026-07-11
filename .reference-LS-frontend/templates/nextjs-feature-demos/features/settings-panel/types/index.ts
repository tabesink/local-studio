export type SettingsSectionId =
  | "connection"
  | "system"
  | "appearance"
  | "archive"
  | "plugins"
  | "skills"
  | "setup";

export interface SettingsSectionDef {
  id: SettingsSectionId;
  label: string;
  description: string;
  icon: string;
}

export interface ApiConnectionSettings {
  backendUrl: string;
  apiKey: string;
  hasApiKey: boolean;
  voiceUrl: string;
  voiceModel: string;
}

export interface SystemFact {
  label: string;
  value: string;
  mono?: boolean;
  tone?: "default" | "good" | "warning" | "danger" | "info";
  statusLabel?: string;
}

export interface ArchivedChatRow {
  id: string;
  title: string;
  project: string;
  archivedAt: string;
}

export interface PluginSummaryRow {
  id: string;
  name: string;
  enabled: boolean;
  toolCount: number;
}

export interface SkillRow {
  id: string;
  name: string;
  source: string;
  description: string;
}

export interface SetupCheckRow {
  id: string;
  label: string;
  status: "ok" | "warning" | "error";
  detail: string;
}

export interface SettingsPanelSnapshot {
  status: "checking controller" | "refreshing" | "controller synced" | "local fallbacks" | "ready";
  apiSettings: ApiConnectionSettings;
  systemFacts: {
    controller: SystemFact[];
    network: SystemFact[];
    storage: SystemFact[];
    hardware: SystemFact[];
  };
  archivedChats: ArchivedChatRow[];
  plugins: PluginSummaryRow[];
  skills: SkillRow[];
  setupChecks: SetupCheckRow[];
}
