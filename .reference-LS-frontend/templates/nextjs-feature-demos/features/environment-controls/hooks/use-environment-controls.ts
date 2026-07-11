"use client";

import { useMemo, useState } from "react";
import { saveEnvironmentSettings, testController, normalizeControllerUrl } from "../api";
import { apiConnectionSettings, controllerEntries } from "../fixtures";
import type { ApiConnectionSettings, ConnectionStatus, ControllerEntry, SavedController } from "../types";

export function useEnvironmentControls() {
  const [settings, setSettings] = useState<ApiConnectionSettings>(apiConnectionSettings);
  const [controllers, setControllers] = useState<ControllerEntry[]>(controllerEntries);
  const [draft, setDraft] = useState<SavedController>({ url: "" });
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("unknown");
  const [statusMessage, setStatusMessage] = useState("");
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeId = useMemo(() => normalizeControllerUrl(settings.backendUrl), [settings.backendUrl]);

  function addDraft() {
    const url = normalizeControllerUrl(draft.url);
    if (!url || controllers.some((entry) => entry.id === url)) return;
    setControllers((current) => [...current, { id: url, url, apiKey: draft.apiKey?.trim() || undefined, name: draft.name?.trim() || undefined }]);
    setDraft({ url: "" });
  }

  function activate(entry: ControllerEntry) {
    setSettings((current) => ({
      ...current,
      backendUrl: entry.url,
      apiKey: entry.apiKey ?? "",
      hasApiKey: Boolean(entry.apiKey),
    }));
    setConnectionStatus("unknown");
    setStatusMessage("");
  }

  async function testActive() {
    setTesting(true);
    setStatusMessage("Testing...");
    const result = await testController(settings.backendUrl);
    setConnectionStatus(result.status);
    setStatusMessage(result.message);
    setTesting(false);
  }

  async function saveActive() {
    setSaving(true);
    await saveEnvironmentSettings(settings, controllers);
    setStatusMessage("Settings saved");
    setSaving(false);
  }

  return {
    activeId,
    connectionStatus,
    controllers,
    draft,
    revealed,
    saving,
    settings,
    statusMessage,
    testing,
    activate,
    addDraft,
    saveActive,
    setControllers,
    setDraft,
    setSettings,
    testActive,
    toggleReveal: (id: string) => setRevealed((current) => ({ ...current, [id]: !current[id] })),
  };
}
