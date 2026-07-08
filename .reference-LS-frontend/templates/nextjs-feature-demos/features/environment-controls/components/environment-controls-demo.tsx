"use client";

import { Eye, EyeOff, X } from "lucide-react";
import {
  cx,
  SettingsButton,
  SettingsGroup,
  SettingsInput,
  StatusPill,
} from "../../../_shared/ui";
import { useEnvironmentControls } from "../hooks/use-environment-controls";
import type { ControllerEntry } from "../types";

/* Environment controls — mirrors features/settings/api-connection-section.tsx:
   one saved-controller list with radio activation, per-row secret reveal,
   an inline add row, and a separate Connection group with Test / Save active. */
export function EnvironmentControlsDemo() {
  const env = useEnvironmentControls();

  return (
    <main className="min-h-full overflow-y-auto bg-(--ui-bg) text-(--ui-fg)">
      <div className="mx-auto w-full max-w-[640px] px-4 py-6">
        <SettingsGroup
          title="Controllers"
          description="Every controller is saved in one list. The selected radio row becomes the active backend."
        >
          {env.controllers.length === 0 ? (
            <div className="px-3.5 py-2.5 text-[length:var(--fs-md)] text-(--ui-muted)">
              No controllers yet. Add one below.
            </div>
          ) : (
            env.controllers.map((entry, index) => (
              <ControllerRow
                key={entry.id}
                entry={entry}
                active={entry.id === env.activeId}
                revealed={Boolean(env.revealed[entry.id])}
                onActivate={() => env.activate(entry)}
                onToggleReveal={() => env.toggleReveal(entry.id)}
                onRemove={() =>
                  env.setControllers((current) => current.filter((_, i) => i !== index))
                }
              />
            ))
          )}
          {/* Inline add row with compact inputs. */}
          <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5">
            <SettingsInput
              value={env.draft.name ?? ""}
              onChange={(name) => env.setDraft((current) => ({ ...current, name }))}
              placeholder="Name"
              aria-label="Controller name"
              className="w-28 shrink-0"
            />
            <SettingsInput
              value={env.draft.url}
              onChange={(url) => env.setDraft((current) => ({ ...current, url }))}
              placeholder="http://127.0.0.1:8080"
              aria-label="Controller URL"
              className="min-w-52 flex-1 font-mono"
            />
            <SettingsInput
              value={env.draft.apiKey ?? ""}
              onChange={(apiKey) => env.setDraft((current) => ({ ...current, apiKey }))}
              placeholder="API key"
              type="password"
              aria-label="Controller API key"
              className="w-32 shrink-0"
            />
            <SettingsButton onClick={env.addDraft} disabled={!env.draft.url.trim()}>
              Add
            </SettingsButton>
          </div>
        </SettingsGroup>

        <SettingsGroup
          title="Connection"
          description="Test probes GET /status through /api/proxy with override headers. Save persists locally first, then to the server."
        >
          <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
            <div className="min-w-0">
              <div className="text-[length:var(--fs-base)] font-medium text-(--ui-fg)">
                Active connection check
              </div>
              <div className="mt-0.5 truncate font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
                {env.settings.backendUrl}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ConnectionStatusPill status={env.connectionStatus} message={env.statusMessage} />
              <SettingsButton onClick={() => void env.testActive()} disabled={env.testing}>
                {env.testing ? "Testing" : "Test"}
              </SettingsButton>
              <SettingsButton
                tone="primary"
                onClick={() => void env.saveActive()}
                disabled={env.saving}
              >
                {env.saving ? "Saving" : "Save active"}
              </SettingsButton>
            </div>
          </div>
        </SettingsGroup>
      </div>
    </main>
  );
}

function ConnectionStatusPill({
  status,
  message,
}: {
  status: "unknown" | "connected" | "error";
  message: string;
}) {
  const tone = status === "connected" ? "good" : status === "error" ? "danger" : "default";
  return <StatusPill tone={tone}>{message || "unknown"}</StatusPill>;
}

function ControllerRow({
  entry,
  active,
  revealed,
  onActivate,
  onToggleReveal,
  onRemove,
}: {
  entry: ControllerEntry;
  active: boolean;
  revealed: boolean;
  onActivate: () => void;
  onToggleReveal: () => void;
  onRemove: () => void;
}) {
  const hasKey = Boolean(entry.apiKey);
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-(--ui-hover)/35">
      {/* Radio-dot activation, matching the reference row. */}
      <button
        type="button"
        role="radio"
        aria-checked={active}
        aria-label={`Activate ${entry.name || entry.url}`}
        onClick={onActivate}
        className={cx(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          active ? "border-(--ui-fg)/70" : "border-(--ui-border) hover:border-(--ui-fg)/40",
        )}
      >
        {active ? <span className="h-2 w-2 rounded-full bg-(--ui-fg)/85" /> : null}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[length:var(--fs-base)] font-medium text-(--ui-fg)">
            {entry.name || entry.url}
          </span>
          {active ? <StatusPill tone="good">active</StatusPill> : null}
        </div>
        <div className="truncate font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
          {entry.url}
        </div>
      </div>
      <span className="shrink-0 font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
        {hasKey ? (revealed ? entry.apiKey : "••••••••") : "none"}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onToggleReveal}
          disabled={!hasKey}
          className="flex h-7 w-7 items-center justify-center rounded-md text-(--ui-muted) transition-colors hover:bg-(--ui-hover) hover:text-(--ui-fg) disabled:opacity-30"
          aria-label={revealed ? "Hide API key" : "Reveal API key"}
          title={revealed ? "Hide API key" : "Reveal API key"}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-md text-(--ui-muted) transition-colors hover:bg-(--ui-danger)/10 hover:text-(--ui-danger)"
          aria-label={`Remove ${entry.name || entry.url}`}
          title="Remove controller"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
