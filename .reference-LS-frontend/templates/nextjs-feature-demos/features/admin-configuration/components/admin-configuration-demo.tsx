"use client";

import {
  SegmentedControl,
  SettingsButton,
  SettingsFactRows,
  SettingsGroup,
  SettingsInput,
  SettingsRow,
  SettingsTextarea,
  SettingsValue,
  StatusPill,
  type UiTone,
} from "../../../_shared/ui";
import { mcpJsonPlaceholder } from "../fixtures";
import { useAdminConfiguration } from "../hooks/use-admin-configuration";
import type { AdminTab, EngineJob, SystemFactRow } from "../types";

const jobTone: Record<EngineJob["status"], UiTone> = {
  queued: "default",
  running: "info",
  success: "good",
  error: "danger",
  cancelled: "default",
};

/* Admin configuration — mirrors system-settings-section.tsx (fact groups),
   engines-section.tsx (runtime targets + jobs), plugins-page.tsx (installed
   rows, manual add, MCP JSON, curated list), plus skills and setup checks. */
export function AdminConfigurationDemo() {
  const admin = useAdminConfiguration();

  return (
    <main className="min-h-full overflow-y-auto bg-(--ui-bg) text-(--ui-fg)">
      <div className="mx-auto w-full max-w-[640px] px-4 py-6">
        <div className="mb-5">
          <SegmentedControl<AdminTab>
            items={admin.tabs.map((tab) => ({ id: tab.id, label: tab.label }))}
            value={admin.tab}
            onChange={admin.setTab}
          />
        </div>

        {admin.tab === "system" ? (
          <>
            <SettingsGroup title="Controller state">
              <SettingsFactRows rows={toFactRows(admin.systemFacts.controller)} />
            </SettingsGroup>
            <SettingsGroup title="Network">
              <SettingsFactRows rows={toFactRows(admin.systemFacts.network)} />
            </SettingsGroup>
            <SettingsGroup title="Storage">
              <SettingsFactRows rows={toFactRows(admin.systemFacts.storage)} />
            </SettingsGroup>
            <SettingsGroup title="Hardware">
              <SettingsFactRows rows={toFactRows(admin.systemFacts.hardware)} />
            </SettingsGroup>
          </>
        ) : null}

        {admin.tab === "engines" ? (
          <>
            <SettingsGroup title="Runtime targets" description="Backends the controller can install and serve.">
              {admin.runtimeTargets.map((target) => (
                <SettingsRow
                  key={target.id}
                  label={target.backend}
                  value={<SettingsValue mono dim>{target.version}</SettingsValue>}
                  status={
                    <StatusPill tone={target.installed ? "good" : "default"}>
                      {target.installed ? "installed" : "not installed"}
                    </StatusPill>
                  }
                  actions={
                    target.installed ? (
                      <SettingsButton>Update</SettingsButton>
                    ) : (
                      <SettingsButton tone="primary">Install</SettingsButton>
                    )
                  }
                />
              ))}
            </SettingsGroup>
            <SettingsGroup title="Runtime jobs">
              {admin.jobs.map((job) => (
                <SettingsRow
                  key={job.id}
                  label={`${job.backend} · ${job.id}`}
                  description={job.message}
                  status={<StatusPill tone={jobTone[job.status]}>{job.status}</StatusPill>}
                  actions={
                    job.status === "running" || job.status === "queued" ? (
                      <SettingsButton tone="danger" onClick={() => admin.cancelJob(job.id)}>
                        Cancel
                      </SettingsButton>
                    ) : undefined
                  }
                />
              ))}
            </SettingsGroup>
          </>
        ) : null}

        {admin.tab === "plugins" ? (
          <>
            <SettingsGroup title="Installed servers" description="MCP servers available to the composer.">
              {admin.servers.map((server) => (
                <SettingsRow
                  key={server.id}
                  label={server.name}
                  description={
                    server.command ? (
                      <span className="font-mono text-[length:var(--fs-xs)]">{server.command}</span>
                    ) : undefined
                  }
                  value={
                    server.toolCount !== undefined ? (
                      <SettingsValue mono dim>{`${server.toolCount} tools`}</SettingsValue>
                    ) : undefined
                  }
                  status={
                    <StatusPill tone={server.enabled ? "good" : "default"}>
                      {server.enabled ? "enabled" : "disabled"}
                    </StatusPill>
                  }
                  actions={
                    <>
                      <SettingsButton onClick={() => admin.toggleServer(server.id)}>
                        {server.enabled ? "Disable" : "Enable"}
                      </SettingsButton>
                      <SettingsButton tone="danger" onClick={() => admin.removeServer(server.id)}>
                        Remove
                      </SettingsButton>
                    </>
                  }
                />
              ))}
            </SettingsGroup>

            <SettingsGroup title="Add manually">
              <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
                <SettingsInput
                  value={admin.manualName}
                  onChange={admin.setManualName}
                  placeholder="Server name"
                  aria-label="Server name"
                  className="w-36 shrink-0"
                />
                <SettingsInput
                  value={admin.manualCommand}
                  onChange={admin.setManualCommand}
                  placeholder="npx -y my-mcp-server"
                  aria-label="Server command"
                  className="min-w-48 flex-1 font-mono"
                />
                <SettingsButton onClick={admin.addManualServer} disabled={!admin.manualName.trim()}>
                  Add
                </SettingsButton>
              </div>
              <div className="px-3.5 py-2.5">
                <div className="mb-1.5 text-[length:var(--fs-sm)] text-(--ui-muted)">
                  Or paste an MCP JSON config
                </div>
                <SettingsTextarea
                  value={admin.mcpJson}
                  onChange={admin.setMcpJson}
                  placeholder={mcpJsonPlaceholder}
                  rows={6}
                  mono
                />
              </div>
            </SettingsGroup>

            <SettingsGroup title="Curated" description="One-click installs from the plugin catalog.">
              {admin.curated.map((plugin) => (
                <SettingsRow
                  key={plugin.id}
                  label={plugin.name}
                  description={plugin.description}
                  status={plugin.installed ? <StatusPill tone="good">installed</StatusPill> : undefined}
                  actions={
                    plugin.installed ? undefined : (
                      <SettingsButton tone="primary" onClick={() => admin.installCurated(plugin.id)}>
                        Install
                      </SettingsButton>
                    )
                  }
                />
              ))}
            </SettingsGroup>
          </>
        ) : null}

        {admin.tab === "skills" ? (
          <SettingsGroup title="Skills" description="Normalized local skills discovered per agent tool.">
            {admin.skillGroups.map((group) => (
              <SettingsRow
                key={group.source}
                label={`${group.source} skills`}
                description={<span className="font-mono text-[length:var(--fs-xs)]">{group.detail}</span>}
                value={<SettingsValue mono dim>{String(group.count)}</SettingsValue>}
                status={
                  <StatusPill tone={group.count > 0 ? "good" : "default"}>
                    {group.count > 0 ? "loaded" : "empty"}
                  </StatusPill>
                }
              />
            ))}
          </SettingsGroup>
        ) : null}

        {admin.tab === "setup" ? (
          <SettingsGroup title="Setup checks">
            {admin.setupChecks.map((check) => (
              <SettingsRow
                key={check.id}
                label={check.label}
                description={check.guidance || undefined}
                value={<SettingsValue mono dim>{check.value}</SettingsValue>}
                status={
                  <StatusPill tone={check.ok ? "good" : "warning"}>
                    {check.ok ? "ok" : "needs action"}
                  </StatusPill>
                }
              />
            ))}
          </SettingsGroup>
        ) : null}
      </div>
    </main>
  );
}

function toFactRows(facts: SystemFactRow[]) {
  return facts.map((fact) => ({
    label: fact.label,
    value: fact.value,
    mono: fact.mono,
    status: fact.statusLabel
      ? { label: fact.statusLabel, tone: (fact.tone ?? "default") as UiTone }
      : undefined,
  }));
}
