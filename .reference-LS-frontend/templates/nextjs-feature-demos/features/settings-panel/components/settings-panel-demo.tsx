"use client";

import {
  Archive,
  Cable,
  Cpu,
  GraduationCap,
  Paintbrush,
  Plug,
  ServerCog,
} from "lucide-react";
import {
  SettingsButton,
  SettingsFactRows,
  SettingsGroup,
  SettingsLayout,
  SettingsNotice,
  SettingsRow,
  SettingsValue,
  StatusPill,
  type SectionNavItem,
  type UiTone,
} from "../../../_shared/ui";
import { useSettingsPanel } from "../hooks/use-settings-panel";
import type { SettingsSectionId, SystemFact } from "../types";

const sectionIcons: Record<string, typeof Cable> = {
  cable: Cable,
  cpu: Cpu,
  paintbrush: Paintbrush,
  archive: Archive,
  plug: Plug,
  "graduation-cap": GraduationCap,
  "server-cog": ServerCog,
};

/* Settings panel — two-column layout with sticky section nav, mirroring
   features/settings/settings-view.tsx + ui/settings.tsx in the reference. */
export function SettingsPanelDemo() {
  const settings = useSettingsPanel();

  const navItems: SectionNavItem<SettingsSectionId>[] = settings.sections.map((section) => {
    const Icon = sectionIcons[section.icon] ?? Cable;
    return {
      id: section.id,
      label: section.label,
      description: section.description,
      icon: <Icon className="h-3.5 w-3.5" />,
    };
  });

  return (
    <SettingsLayout
      sections={navItems}
      activeSection={settings.activeSection}
      title="Settings"
      status={settings.loading ? "refreshing" : settings.snapshot.status}
      loading={settings.loading}
      onReload={() => void settings.reload()}
      onSelectSection={settings.setActiveSection}
    >
      <ActiveSection settings={settings} />
    </SettingsLayout>
  );
}

function ActiveSection({ settings }: { settings: ReturnType<typeof useSettingsPanel> }) {
  const { snapshot } = settings;

  switch (settings.activeSection) {
    case "connection":
      return (
        <>
          <SettingsGroup
            title="API connection"
            description="Detailed controller row management lives in the environment-controls slice."
          >
            <SettingsRow
              label="Controller URL"
              value={<SettingsValue mono>{snapshot.apiSettings.backendUrl}</SettingsValue>}
              status={<StatusPill tone="good">connected</StatusPill>}
            />
            <SettingsRow
              label="API key"
              description="Masked keys are never overwritten unless a new key is supplied."
              value={<SettingsValue mono dim>{snapshot.apiSettings.apiKey}</SettingsValue>}
            />
            <SettingsRow
              label="Voice URL"
              value={<SettingsValue mono>{snapshot.apiSettings.voiceUrl}</SettingsValue>}
            />
            <SettingsRow
              label="Voice model"
              value={<SettingsValue mono>{snapshot.apiSettings.voiceModel}</SettingsValue>}
            />
          </SettingsGroup>
          <SettingsGroup title="Connection">
            <SettingsRow
              label="Active connection check"
              status={<StatusPill tone="good">Connected</StatusPill>}
              actions={
                <>
                  <SettingsButton>Test</SettingsButton>
                  <SettingsButton tone="primary">Save active</SettingsButton>
                </>
              }
            />
          </SettingsGroup>
        </>
      );
    case "system":
      return (
        <>
          <SettingsGroup title="Controller state">
            <SettingsFactRows rows={toFactRows(snapshot.systemFacts.controller)} />
          </SettingsGroup>
          <SettingsGroup title="Network">
            <SettingsFactRows rows={toFactRows(snapshot.systemFacts.network)} />
          </SettingsGroup>
          <SettingsGroup title="Storage">
            <SettingsFactRows rows={toFactRows(snapshot.systemFacts.storage)} />
          </SettingsGroup>
          <SettingsGroup title="Hardware">
            <SettingsFactRows rows={toFactRows(snapshot.systemFacts.hardware)} />
          </SettingsGroup>
        </>
      );
    case "appearance":
      return (
        <>
          <SettingsNotice tone="info" className="mb-4">
            Full appearance behavior (theme picker, token editor, density sliders) lives in the
            user-preferences slice.
          </SettingsNotice>
          <SettingsGroup title="Theme">
            <SettingsRow
              label="Active theme"
              value={<SettingsValue>Zai Dark</SettingsValue>}
              status={<StatusPill tone="info">active</StatusPill>}
            />
            <SettingsRow label="Mode" value={<SettingsValue dim>Dark</SettingsValue>} />
          </SettingsGroup>
          <SettingsGroup title="Typography / density">
            <SettingsRow label="Font family" value={<SettingsValue>Geist</SettingsValue>} />
            <SettingsRow label="UI scale" value={<SettingsValue mono>1.0</SettingsValue>} />
            <SettingsRow label="Radius" value={<SettingsValue mono>7px</SettingsValue>} />
          </SettingsGroup>
        </>
      );
    case "archive":
      return (
        <SettingsGroup
          title="Archived chats"
          description="Archived Pi sessions stay out of normal chat lists but remain restorable."
        >
          {snapshot.archivedChats.map((chat) => (
            <SettingsRow
              key={chat.id}
              label={chat.title}
              description={
                <span className="font-mono text-[length:var(--fs-xs)]">
                  {chat.project} · archived {chat.archivedAt}
                </span>
              }
              actions={
                <>
                  <SettingsButton>Restore</SettingsButton>
                  <SettingsButton tone="danger">Delete</SettingsButton>
                </>
              }
            />
          ))}
        </SettingsGroup>
      );
    case "plugins":
      return (
        <SettingsGroup
          title="MCP servers"
          description="Full plugin management (manual add, JSON config, curated catalog) lives in the admin-configuration slice."
        >
          {snapshot.plugins.map((plugin) => (
            <SettingsRow
              key={plugin.id}
              label={plugin.name}
              value={
                <SettingsValue mono dim>
                  {plugin.toolCount} tools
                </SettingsValue>
              }
              status={
                <StatusPill tone={plugin.enabled ? "good" : "default"}>
                  {plugin.enabled ? "enabled" : "disabled"}
                </StatusPill>
              }
            />
          ))}
        </SettingsGroup>
      );
    case "skills":
      return (
        <SettingsGroup title="Skills" description="Normalized local skills discovered across agent tools.">
          {snapshot.skills.map((skill) => (
            <SettingsRow
              key={skill.id}
              label={skill.name}
              description={skill.description}
              value={
                <SettingsValue mono dim>
                  {skill.source}
                </SettingsValue>
              }
            />
          ))}
        </SettingsGroup>
      );
    case "setup":
      return (
        <SettingsGroup title="Setup checks">
          {snapshot.setupChecks.map((check) => (
            <SettingsRow
              key={check.id}
              label={check.label}
              description={<span className="font-mono text-[length:var(--fs-xs)]">{check.detail}</span>}
              status={
                <StatusPill
                  tone={check.status === "ok" ? "good" : check.status === "warning" ? "warning" : "danger"}
                >
                  {check.status}
                </StatusPill>
              }
            />
          ))}
        </SettingsGroup>
      );
    default:
      return null;
  }
}

function toFactRows(facts: SystemFact[]) {
  return facts.map((fact) => ({
    label: fact.label,
    value: fact.value,
    mono: fact.mono,
    status: fact.statusLabel
      ? { label: fact.statusLabel, tone: (fact.tone ?? "default") as UiTone }
      : undefined,
  }));
}
