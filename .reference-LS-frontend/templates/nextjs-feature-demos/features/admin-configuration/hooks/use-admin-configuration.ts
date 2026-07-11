"use client";

import { useState } from "react";
import { adminTabs } from "../constants";
import {
  curatedPlugins,
  engineJobs,
  mcpServers,
  runtimeTargets,
  setupChecks,
  skillGroups,
  systemFacts,
} from "../fixtures";
import type { AdminTab, McpServer } from "../types";

export function useAdminConfiguration() {
  const [tab, setTab] = useState<AdminTab>("system");
  const [servers, setServers] = useState(mcpServers);
  const [curated, setCurated] = useState(curatedPlugins);
  const [jobs, setJobs] = useState(engineJobs);
  const [mcpJson, setMcpJson] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCommand, setManualCommand] = useState("");

  function toggleServer(id: string) {
    setServers((current) =>
      current.map((server) => (server.id === id ? { ...server, enabled: !server.enabled } : server)),
    );
  }

  function removeServer(id: string) {
    setServers((current) => current.filter((server) => server.id !== id));
  }

  function addManualServer() {
    const name = manualName.trim();
    if (!name || servers.some((server) => server.id === name)) return;
    const next: McpServer = {
      id: name,
      name,
      command: manualCommand.trim() || undefined,
      enabled: true,
      tags: ["manual"],
    };
    setServers((current) => [...current, next]);
    setManualName("");
    setManualCommand("");
  }

  function installCurated(id: string) {
    setCurated((current) =>
      current.map((plugin) => (plugin.id === id ? { ...plugin, installed: true } : plugin)),
    );
    const plugin = curated.find((item) => item.id === id);
    if (plugin && !servers.some((server) => server.id === plugin.id)) {
      setServers((current) => [
        ...current,
        { id: plugin.id, name: plugin.name, enabled: true, tags: ["curated"] },
      ]);
    }
  }

  function cancelJob(id: string) {
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, status: "cancelled", message: "Cancelled" } : job)),
    );
  }

  return {
    curated,
    jobs,
    manualCommand,
    manualName,
    mcpJson,
    runtimeTargets,
    servers,
    setupChecks,
    skillGroups,
    systemFacts,
    tab,
    tabs: adminTabs,
    addManualServer,
    cancelJob,
    installCurated,
    removeServer,
    setManualCommand,
    setManualName,
    setMcpJson,
    setTab,
    toggleServer,
  };
}
