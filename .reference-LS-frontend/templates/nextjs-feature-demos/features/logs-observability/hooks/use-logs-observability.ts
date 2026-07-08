"use client";

import { useEffect, useMemo, useState } from "react";
import { logLinesBySession, logSessions, serverStatus, streamedLines } from "../fixtures";
import type { LogSession, ObservabilityTab, ServerConsoleTab } from "../types";

export function useLogsObservability() {
  const [tab, setTab] = useState<ObservabilityTab>("logs");
  const [serverTab, setServerTab] = useState<ServerConsoleTab>("server-logs");
  const [sessions, setSessions] = useState<LogSession[]>(logSessions);
  const [linesBySession, setLinesBySession] = useState(logLinesBySession);
  const [selectedSession, setSelectedSession] = useState<string | null>(logSessions[0]?.id ?? null);
  const [filter, setFilter] = useState("");
  const [contentFilter, setContentFilter] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);

  /* Auto-refresh simulates the reference's log stream by appending fixture
     lines to the selected running session every 2s. */
  useEffect(() => {
    if (!autoRefresh || !selectedSession) return;
    let cursor = 0;
    const interval = window.setInterval(() => {
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const line = `${now} ${streamedLines[cursor % streamedLines.length]}`;
      cursor += 1;
      setLinesBySession((current) => ({
        ...current,
        [selectedSession]: [...(current[selectedSession] ?? []), line],
      }));
    }, 2000);
    return () => window.clearInterval(interval);
  }, [autoRefresh, selectedSession]);

  const filteredSessions = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter(
      (session) =>
        session.id.toLowerCase().includes(query) ||
        session.model?.toLowerCase().includes(query),
    );
  }, [filter, sessions]);

  const visibleLines = useMemo(() => {
    const lines = selectedSession ? (linesBySession[selectedSession] ?? []) : [];
    const query = contentFilter.trim().toLowerCase();
    return query ? lines.filter((line) => line.toLowerCase().includes(query)) : lines;
  }, [contentFilter, linesBySession, selectedSession]);

  function deleteSession(id: string) {
    if (id === "controller") return;
    setSessions((current) => current.filter((session) => session.id !== id));
    setSelectedSession((current) => (current === id ? "controller" : current));
  }

  function downloadSelected() {
    if (!selectedSession) return;
    const content = (linesBySession[selectedSession] ?? []).join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selectedSession}.log`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return {
    autoRefresh,
    autoScroll,
    contentFilter,
    filter,
    filteredSessions,
    selectedSession,
    serverStatus,
    serverTab,
    tab,
    visibleLines,
    deleteSession,
    downloadSelected,
    setAutoRefresh,
    setAutoScroll,
    setContentFilter,
    setFilter,
    setSelectedSession,
    setServerTab,
    setTab,
  };
}
