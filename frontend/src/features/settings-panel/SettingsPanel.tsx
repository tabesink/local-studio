"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, KeyRound, Palette, Users } from "lucide-react";
import {
  EmptySafeNotice,
  SettingsButton,
  SettingsFactRows,
  SettingsGroup,
  SettingsInput,
  SettingsLayout,
  SettingsNotice,
  SettingsRow,
  StatusPill,
  type SettingsSectionDef,
  type UiTone,
} from "@/_shared/ui";
import { isApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/state/auth-store";
import { PreferencesPanel } from "@/features/user-preferences/PreferencesPanel";
import {
  getRuntimeSettings,
  listUsers,
  patchRuntimeSettings,
  rotateProviderCredential,
  type RuntimeSettingsSnapshot,
} from "@/features/settings-panel/api";
import {
  deleteDomain,
  listAdminDomains,
  startDomain,
  stopDomain,
  type AdminDomain,
} from "@/features/domains/api";
import type { CurrentUser } from "@/types/auth";

type SectionId = "general" | "provider" | "domains" | "users";

function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  return "Request failed.";
}

function domainTone(state: string): UiTone {
  if (state === "running") return "good";
  if (state === "error") return "danger";
  if (state === "stopped") return "default";
  return "warning";
}

/* LS settings-panel layout over CE-contracted admin surfaces. Controller,
   storage, hardware, plugins, and skills sections stay absent (F-010 gate). */
export function SettingsPanel() {
  const user = useAuthStore((state) => state.user);
  const isAdmin = user?.role === "administrator";
  const [section, setSection] = useState<SectionId>("general");
  const [runtime, setRuntime] = useState<RuntimeSettingsSnapshot | null>(null);
  const [domains, setDomains] = useState<AdminDomain[]>([]);
  const [users, setUsers] = useState<CurrentUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const sections = useMemo<SettingsSectionDef<SectionId>[]>(() => {
    const rows: SettingsSectionDef<SectionId>[] = [
      { id: "general", label: "General", description: "Personal preferences", icon: <Palette className="h-3.5 w-3.5" /> },
    ];
    if (isAdmin) {
      rows.push(
        { id: "provider", label: "Model Provider", description: "Providers and model profiles", icon: <KeyRound className="h-3.5 w-3.5" /> },
        { id: "domains", label: "Domains", description: "Knowledge Domain lifecycle", icon: <Database className="h-3.5 w-3.5" /> },
        { id: "users", label: "Users", description: "User accounts", icon: <Users className="h-3.5 w-3.5" /> },
      );
    }
    return rows;
  }, [isAdmin]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isAdmin) {
        const [runtimeSnapshot, domainRows, userRows] = await Promise.all([
          getRuntimeSettings(),
          listAdminDomains(),
          listUsers(),
        ]);
        setRuntime(runtimeSnapshot);
        setDomains(domainRows);
        setUsers(userRows);
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <SettingsLayout<SectionId>
      sections={sections}
      activeSection={section}
      onSelectSection={setSection}
      title="Settings"
      status={loading ? "Loading" : ""}
      loading={loading}
      onReload={() => void reload()}
    >
      {error ? <SettingsNotice tone="danger" className="mb-4">{error}</SettingsNotice> : null}
      {notice ? <SettingsNotice tone="good" className="mb-4">{notice}</SettingsNotice> : null}
      {section === "general" ? <PreferencesPanel /> : null}
      {section === "provider" && isAdmin ? (
        <ProviderSection
          runtime={runtime}
          onChanged={(message) => {
            setNotice(message);
            void reload();
          }}
          onError={(message) => setError(message)}
        />
      ) : null}
      {section === "domains" && isAdmin ? (
        <DomainsSection
          domains={domains}
          onChanged={(message) => {
            setNotice(message);
            void reload();
          }}
          onError={(message) => setError(message)}
        />
      ) : null}
      {section === "users" && isAdmin ? <UsersSection users={users} /> : null}
    </SettingsLayout>
  );
}

function ProviderSection({
  runtime,
  onChanged,
  onError,
}: {
  runtime: RuntimeSettingsSnapshot | null;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  if (!runtime) return <EmptySafeNotice>Runtime settings are unavailable.</EmptySafeNotice>;

  const rotate = async (providerKind: string) => {
    const credential = credentials[providerKind]?.trim();
    if (!credential) return;
    setSaving(providerKind);
    try {
      await rotateProviderCredential(providerKind, credential);
      setCredentials((current) => ({ ...current, [providerKind]: "" }));
      onChanged(`Credential updated for ${providerKind}.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setSaving(null);
    }
  };

  const setSynthesisProfile = async (profileId: string) => {
    try {
      await patchRuntimeSettings({ activeSynthesisProfileId: profileId });
      onChanged("Active synthesis profile updated.");
    } catch (err) {
      onError(errorMessage(err));
    }
  };

  return (
    <>
      <SettingsGroup title="Providers" description="Credentials are write-only; values are never displayed.">
        {runtime.providers.map((provider) => (
          <SettingsRow
            key={provider.providerKind}
            label={provider.providerKind}
            status={
              <StatusPill tone={provider.isConfigured ? "good" : "warning"}>
                {provider.isConfigured ? "Configured" : "Not configured"}
              </StatusPill>
            }
            control={
              <div className="flex w-full items-center justify-end gap-1.5">
                <SettingsInput
                  type="password"
                  value={credentials[provider.providerKind] ?? ""}
                  onChange={(value) =>
                    setCredentials((current) => ({ ...current, [provider.providerKind]: value }))
                  }
                  placeholder="New credential"
                  aria-label={`New credential for ${provider.providerKind}`}
                  className="max-w-56"
                />
                <SettingsButton
                  tone="primary"
                  disabled={saving === provider.providerKind || !(credentials[provider.providerKind] ?? "").trim()}
                  onClick={() => void rotate(provider.providerKind)}
                >
                  Rotate
                </SettingsButton>
              </div>
            }
          />
        ))}
      </SettingsGroup>

      <SettingsGroup title="Model profiles">
        {runtime.modelProfiles.length === 0 ? (
          <EmptySafeNotice>No model profiles configured.</EmptySafeNotice>
        ) : (
          runtime.modelProfiles.map((profile) => {
            const isActiveSynthesis = profile.id === runtime.runtimeSettings.activeSynthesisProfileId;
            return (
              <SettingsRow
                key={profile.id}
                label={profile.name}
                description={`${profile.profileKind} - ${profile.providerKind} - ${profile.modelName}`}
                status={
                  isActiveSynthesis ? <StatusPill tone="info">Active synthesis</StatusPill> : undefined
                }
                actions={
                  profile.profileKind === "synthesis" && !isActiveSynthesis ? (
                    <SettingsButton onClick={() => void setSynthesisProfile(profile.id)}>Make active</SettingsButton>
                  ) : undefined
                }
              />
            );
          })
        )}
      </SettingsGroup>

      <SettingsGroup title="Document parser">
        <SettingsFactRows
          rows={[{ label: "Active parser", value: runtime.runtimeSettings.activeParserKind, mono: true }]}
        />
      </SettingsGroup>
    </>
  );
}

function DomainsSection({
  domains,
  onChanged,
  onError,
}: {
  domains: AdminDomain[];
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (domainId: string, action: "start" | "stop" | "delete") => {
    setBusy(domainId);
    try {
      if (action === "start") await startDomain(domainId);
      if (action === "stop") await stopDomain(domainId);
      if (action === "delete") await deleteDomain(domainId);
      onChanged(`Domain ${domainId}: ${action} requested.`);
    } catch (err) {
      onError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <SettingsGroup title="Knowledge Domains" description="Lifecycle actions run on the backend; deletion is asynchronous.">
      {domains.length === 0 ? (
        <EmptySafeNotice>No Knowledge Domains configured.</EmptySafeNotice>
      ) : (
        domains.map((domain) => (
          <SettingsRow
            key={domain.id}
            variant="resource"
            label={domain.displayName}
            description={domain.id}
            status={<StatusPill tone={domainTone(domain.state)}>{domain.state}</StatusPill>}
            actions={
              <>
                <SettingsButton disabled={busy === domain.id} onClick={() => void run(domain.id, "start")}>
                  Start
                </SettingsButton>
                <SettingsButton disabled={busy === domain.id} onClick={() => void run(domain.id, "stop")}>
                  Stop
                </SettingsButton>
                <SettingsButton
                  tone="danger"
                  disabled={busy === domain.id}
                  onClick={() => {
                    if (window.confirm(`Delete domain "${domain.displayName}"? This cannot be undone.`)) {
                      void run(domain.id, "delete");
                    }
                  }}
                >
                  Delete
                </SettingsButton>
              </>
            }
          />
        ))
      )}
    </SettingsGroup>
  );
}

function UsersSection({ users }: { users: CurrentUser[] }) {
  return (
    <SettingsGroup title="Users">
      {users.length === 0 ? (
        <EmptySafeNotice>No users found.</EmptySafeNotice>
      ) : (
        users.map((row) => (
          <SettingsRow
            key={row.id}
            label={row.username}
            value={<span className="text-[length:var(--fs-sm)] text-[var(--dim)]">{row.role}</span>}
            status={
              row.isDisabled ? <StatusPill tone="danger">Disabled</StatusPill> : <StatusPill tone="good">Active</StatusPill>
            }
          />
        ))
      )}
    </SettingsGroup>
  );
}
