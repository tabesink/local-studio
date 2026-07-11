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
  UiModal,
  UiModalHeader,
  type SettingsSectionDef,
} from "@/_shared/ui";
import { isApiError } from "@/lib/api/errors";
import { useAuthStore } from "@/state/auth-store";
import { PreferencesPanel } from "@/features/user-preferences/PreferencesPanel";
import {
  getRuntimeSettings,
  listUsers,
  patchRuntimeSettings,
  rotateProviderCredential,
  type ModelProfile,
  type RuntimeSettingsSnapshot,
} from "@/features/settings-panel/api";
import {
  createDomain,
  deleteDomain,
  listAdminDomains,
  startDomain,
  stopDomain,
  type AdminDomain,
} from "@/features/domains/api";
import {
  busyLabel,
  canDeployDomain,
  defaultEmbeddingProfileId,
  deployDomain,
  domainTone,
  filterEmbeddingProfiles,
  isValidDomainId,
  primaryLifecycleAction,
  shouldRequestDelete,
  type DomainBusyAction,
} from "@/features/settings-panel/domainSettingsHelpers";
import type { CurrentUser } from "@/types/auth";

type SectionId = "general" | "provider" | "domains" | "users";

function errorMessage(error: unknown): string {
  if (isApiError(error)) return error.message;
  return "Request failed.";
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

  const reload = useCallback(async (opts?: { clearError?: boolean }) => {
    setLoading(true);
    if (opts?.clearError !== false) setError(null);
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
          modelProfiles={runtime?.modelProfiles ?? []}
          onChanged={(message) => {
            setError(null);
            setNotice(message);
            void reload();
          }}
          onError={(message) => {
            setNotice(null);
            setError(message);
          }}
          reload={() => reload({ clearError: false })}
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
  modelProfiles,
  onChanged,
  onError,
  reload,
}: {
  domains: AdminDomain[];
  modelProfiles: ModelProfile[];
  onChanged: (message: string) => void;
  onError: (message: string) => void;
  reload: () => Promise<void>;
}) {
  const embeddingProfiles = useMemo(() => filterEmbeddingProfiles(modelProfiles), [modelProfiles]);
  const [draftId, setDraftId] = useState("");
  const [draftName, setDraftName] = useState("");
  const [draftEmbeddingId, setDraftEmbeddingId] = useState(() => defaultEmbeddingProfileId(embeddingProfiles) ?? "");
  const [busy, setBusy] = useState<{ id: string; action: DomainBusyAction } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminDomain | null>(null);

  useEffect(() => {
    if (!draftEmbeddingId || !embeddingProfiles.some((profile) => profile.id === draftEmbeddingId)) {
      setDraftEmbeddingId(defaultEmbeddingProfileId(embeddingProfiles) ?? "");
    }
  }, [draftEmbeddingId, embeddingProfiles]);

  const deployEnabled = canDeployDomain({
    id: draftId,
    displayName: draftName,
    embeddingProfileId: draftEmbeddingId,
    hasEmbeddingProfiles: embeddingProfiles.length > 0,
  });

  const run = async (domainId: string, action: "start" | "stop" | "delete") => {
    setBusy({ id: domainId, action });
    try {
      if (action === "start") await startDomain(domainId);
      if (action === "stop") await stopDomain(domainId);
      if (action === "delete") await deleteDomain(domainId);
      onChanged(`Domain ${domainId}: ${action} requested.`);
    } catch (err) {
      onError(errorMessage(err));
      await reload();
    } finally {
      setBusy((current) => (current?.id === domainId ? null : current));
    }
  };

  const onDeploy = async () => {
    if (!deployEnabled) return;
    if (!isValidDomainId(draftId)) {
      onError("Domain id must be 2–63 characters: lowercase letters, digits, underscore, or hyphen.");
      return;
    }
    setBusy({ id: "__deploy__", action: "deploy" });
    try {
      const outcome = await deployDomain(
        {
          id: draftId,
          displayName: draftName,
          embeddingProfileId: draftEmbeddingId,
        },
        { createDomain, startDomain },
      );
      if (outcome.kind === "success") {
        setDraftId("");
        setDraftName("");
        setDraftEmbeddingId(defaultEmbeddingProfileId(embeddingProfiles) ?? "");
        onChanged(`Domain ${draftId.trim()}: deploy requested.`);
        return;
      }
      if (outcome.kind === "create_failed") {
        onError(errorMessage(outcome.error));
        return;
      }
      // start_failed_keep: keep domain, danger notice, reload — no success flash
      onError(errorMessage(outcome.error));
      await reload();
    } finally {
      setBusy((current) => (current?.id === "__deploy__" ? null : current));
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete || !shouldRequestDelete(true)) return;
    const target = pendingDelete;
    setPendingDelete(null);
    void run(target.id, "delete");
  };

  const anyBusy = busy !== null;
  const deployBusy = busy?.id === "__deploy__";

  return (
    <>
      <SettingsGroup
        title="Knowledge Domains"
        description="Lifecycle on backend. No Docker details in UI."
      >
        {domains.length === 0 ? (
          <EmptySafeNotice>No Knowledge Domains configured.</EmptySafeNotice>
        ) : (
          domains.map((domain) => {
            const rowBusy = busy?.id === domain.id;
            const lifecycle = primaryLifecycleAction(domain.state);
            const pillLabel = rowBusy && busy ? busyLabel(busy.action) : domain.state;
            const pillTone = rowBusy ? "warning" : domainTone(domain.state);
            return (
              <SettingsRow
                key={domain.id}
                variant="resource"
                label={domain.displayName}
                description={domain.id}
                status={<StatusPill tone={pillTone}>{pillLabel}</StatusPill>}
                actions={
                  <>
                    {lifecycle === "stop" ? (
                      <SettingsButton disabled={anyBusy} onClick={() => void run(domain.id, "stop")}>
                        Stop
                      </SettingsButton>
                    ) : (
                      <SettingsButton disabled={anyBusy} onClick={() => void run(domain.id, "start")}>
                        Start
                      </SettingsButton>
                    )}
                    <SettingsButton tone="danger" disabled={anyBusy} onClick={() => setPendingDelete(domain)}>
                      Delete
                    </SettingsButton>
                  </>
                }
              />
            );
          })
        )}

        <div className="flex flex-col gap-2 border-t border-(--ui-separator) px-3.5 py-3 sm:flex-row sm:items-center sm:justify-end">
          <SettingsInput
            value={draftId}
            onChange={setDraftId}
            placeholder="id"
            aria-label="New domain id"
            className="max-w-40"
          />
          <SettingsInput
            value={draftName}
            onChange={setDraftName}
            placeholder="display name"
            aria-label="New domain display name"
            className="max-w-48"
          />
          <select
            value={draftEmbeddingId}
            onChange={(event) => setDraftEmbeddingId(event.target.value)}
            disabled={embeddingProfiles.length === 0 || anyBusy}
            aria-label="Embedding profile"
            className="h-7 max-w-48 rounded-md border border-(--ui-separator) bg-(--ui-bg) px-2.5 text-[length:var(--fs-base)] text-(--ui-fg) outline-none focus:border-(--ui-accent)/40 disabled:opacity-50"
          >
            {embeddingProfiles.length === 0 ? (
              <option value="">No embedding profiles</option>
            ) : (
              embeddingProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))
            )}
          </select>
          <SettingsButton tone="primary" disabled={!deployEnabled || anyBusy} onClick={() => void onDeploy()}>
            {deployBusy ? "Deploying…" : "Deploy"}
          </SettingsButton>
        </div>
        {embeddingProfiles.length === 0 ? (
          <p className="px-3.5 pb-3 text-[length:var(--fs-sm)] text-(--ui-muted)">
            Add an embedding model profile before deploying a domain.
          </p>
        ) : null}
      </SettingsGroup>

      <UiModal isOpen={pendingDelete !== null} onClose={() => setPendingDelete(null)} maxWidth="max-w-md">
        <UiModalHeader title="Delete domain" onClose={() => setPendingDelete(null)} />
        <div className="space-y-4 px-6 py-4">
          <p className="text-[length:var(--fs-base)] text-(--ui-fg)">
            Delete domain &ldquo;{pendingDelete?.displayName}&rdquo;? This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <SettingsButton onClick={() => setPendingDelete(null)}>Cancel</SettingsButton>
            <SettingsButton tone="danger" onClick={confirmDelete}>
              Delete
            </SettingsButton>
          </div>
        </div>
      </UiModal>
    </>
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
