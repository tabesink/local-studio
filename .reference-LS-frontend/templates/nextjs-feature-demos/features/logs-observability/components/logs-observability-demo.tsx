"use client";

import { useEffect, useRef } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import {
  AppPage,
  Checkbox,
  cx,
  ListGroup,
  ListRow,
  RowValue,
  SearchInput,
  SegmentedControl,
  StatusPill,
  Tabs,
} from "../../../_shared/ui";
import { useLogsObservability } from "../hooks/use-logs-observability";

/* Logs / observability — mirrors features/logs/logs-view.tsx (18rem session
   sidebar + mono content pane with severity coloring) and server-view.tsx
   (status aside + Server Logs / API Docs tabs). */
export function LogsObservabilityDemo() {
  const logs = useLogsObservability();

  return (
    <AppPage className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-(--ui-border) px-4 py-2">
        <SegmentedControl
          items={[
            { id: "logs", label: "Logs" },
            { id: "server", label: "Server" },
          ]}
          value={logs.tab}
          onChange={logs.setTab}
        />
        <span className="text-[length:var(--fs-xs)] text-(--ui-muted)/70">
          {logs.tab === "logs" ? "/logs" : "/server"}
        </span>
      </div>

      {logs.tab === "logs" ? <LogsView logs={logs} /> : <ServerView logs={logs} />}
    </AppPage>
  );
}

function LogsView({ logs }: { logs: ReturnType<typeof useLogsObservability> }) {
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!logs.autoScroll) return;
    const pane = paneRef.current;
    if (pane) pane.scrollTop = pane.scrollHeight;
  }, [logs.autoScroll, logs.visibleLines]);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Session sidebar — fixed 18rem, filter on top, scrollable list. */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-(--ui-border) bg-(--ui-surface)/40 md:flex">
        <div className="border-b border-(--ui-border) p-3">
          <h1 className="mb-2.5 text-[length:var(--fs-sm)] font-medium uppercase tracking-[0.14em] text-(--ui-muted)">
            Log Sessions
          </h1>
          <SearchInput value={logs.filter} onChange={logs.setFilter} placeholder="Filter sessions..." />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {logs.filteredSessions.map((session) => {
            const selected = session.id === logs.selectedSession;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => logs.setSelectedSession(session.id)}
                className={cx(
                  "block w-full border-b border-(--ui-border)/50 px-3 py-2.5 text-left transition-colors",
                  selected ? "bg-(--ui-active)" : "hover:bg-(--ui-hover)",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[length:var(--fs-base)] text-(--ui-fg)">
                    {session.model || session.id}
                  </span>
                  <StatusPill tone={session.status === "running" ? "good" : "default"}>
                    {session.status}
                  </StatusPill>
                </div>
                <div className="mt-0.5 truncate font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
                  {session.id}
                </div>
                {session.backend ? (
                  <div className="mt-1">
                    <StatusPill tone="info" variant="badge">
                      {session.backend}
                    </StatusPill>
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Content pane — header controls + mono log body. */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-(--ui-border) px-4 py-2">
          <span className="min-w-0 truncate font-mono text-[length:var(--fs-xs)] text-(--ui-muted)">
            {logs.selectedSession ?? "No session selected"}
          </span>
          <div className="flex flex-wrap items-center gap-2.5">
            <Checkbox checked={logs.autoRefresh} onChange={logs.setAutoRefresh} label="Auto-refresh" />
            <Checkbox checked={logs.autoScroll} onChange={logs.setAutoScroll} label="Auto-scroll" />
            <SearchInput
              value={logs.contentFilter}
              onChange={logs.setContentFilter}
              placeholder="Filter..."
              className="w-36"
            />
            <HeaderIconButton label="Refresh logs" onClick={() => undefined}>
              <RefreshCw className="h-3.5 w-3.5" />
            </HeaderIconButton>
            <HeaderIconButton label="Download log file" onClick={logs.downloadSelected}>
              <Download className="h-3.5 w-3.5" />
            </HeaderIconButton>
            <HeaderIconButton
              label="Delete session"
              onClick={() => logs.selectedSession && logs.deleteSession(logs.selectedSession)}
              disabled={!logs.selectedSession || logs.selectedSession === "controller"}
              danger
            >
              <Trash2 className="h-3.5 w-3.5" />
            </HeaderIconButton>
          </div>
        </div>
        <div
          ref={paneRef}
          className="min-h-0 flex-1 overflow-auto bg-(--ui-bg) p-3 font-mono text-[length:var(--fs-xs)] leading-5"
        >
          {logs.visibleLines.length ? (
            logs.visibleLines.map((line, index) => <LogLine key={`${index}-${line}`} line={line} />)
          ) : (
            <div className="text-(--ui-muted)">No log content</div>
          )}
        </div>
      </section>
    </div>
  );
}

function ServerView({ logs }: { logs: ReturnType<typeof useLogsObservability> }) {
  const status = logs.serverStatus;
  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="overflow-y-auto border-r border-(--ui-border) p-4">
        <ListGroup title="Connection">
          <ListRow label="URL" value={<RowValue mono truncate>{status.backendUrl}</RowValue>} />
          <ListRow
            label="Reachable"
            value={<RowValue>{status.connected ? "yes" : "no"}</RowValue>}
            status={
              <StatusPill tone={status.connected ? "good" : "danger"}>
                {status.connected ? "online" : "offline"}
              </StatusPill>
            }
          />
          <ListRow label="Inference port" value={<RowValue mono>{String(status.inferencePort)}</RowValue>} />
          <ListRow label="Version" value={<RowValue mono>{status.controllerVersion}</RowValue>} />
        </ListGroup>
        <ListGroup title="Runtime">
          <ListRow label="Platform" value={<RowValue mono>{status.platform}</RowValue>} />
          <ListRow label="GPUs detected" value={<RowValue mono>{String(status.gpuCount)}</RowValue>} />
          <ListRow
            label="Active model"
            value={<RowValue truncate>{status.activeModel ?? "none"}</RowValue>}
            status={status.running ? <StatusPill tone="good">running</StatusPill> : undefined}
          />
          <ListRow label="Sessions" value={<RowValue mono>{String(status.sessions)}</RowValue>} />
        </ListGroup>
        <ListGroup title="Backends">
          {status.backends.map((backend) => (
            <ListRow key={backend} label={backend.split(" ")[0]} value={<RowValue mono dim>{backend}</RowValue>} />
          ))}
        </ListGroup>
      </aside>
      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="border-b border-(--ui-border) px-4">
          <Tabs
            variant="underline"
            items={[
              { id: "server-logs", label: "Server Logs" },
              { id: "api-docs", label: "API Docs" },
            ]}
            activeTab={logs.serverTab}
            onSelectTab={logs.setServerTab}
          />
        </div>
        {logs.serverTab === "server-logs" ? (
          <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[length:var(--fs-xs)] leading-5">
            {(logs.filteredSessions.find((session) => session.id === "controller")
              ? logs.visibleLines
              : []
            ).map((line, index) => (
              <LogLine key={`${index}-${line}`} line={line} />
            ))}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <ListGroup
              title="API Docs"
              description="The reference embeds interactive docs served from the controller."
            >
              <ListRow
                label="Docs source"
                value={<RowValue mono>/api/proxy/api/spec</RowValue>}
                status={<StatusPill tone="info">proxy</StatusPill>}
              />
            </ListGroup>
          </div>
        )}
      </section>
    </div>
  );
}

function HeaderIconButton({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cx(
        "flex h-7 w-7 items-center justify-center rounded-md text-(--ui-muted) transition-colors disabled:opacity-30",
        danger
          ? "hover:bg-(--ui-danger)/10 hover:text-(--ui-danger)"
          : "hover:bg-(--ui-hover) hover:text-(--ui-fg)",
      )}
    >
      {children}
    </button>
  );
}

function LogLine({ line }: { line: string }) {
  const tone = line.includes("ERROR")
    ? "text-(--ui-danger)"
    : line.includes("WARN")
      ? "text-(--ui-warning)"
      : line.includes("INFO")
        ? "text-(--ui-fg)/75"
        : "text-(--ui-muted)";
  return <div className={`${tone} px-2 py-0.5 hover:bg-(--ui-hover)`}>{line || " "}</div>;
}
