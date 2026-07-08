"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { cx } from "../../../_shared/ui";
import { projectFixtures } from "../fixtures";
import type { AgentWorkspaceModel } from "../hooks/use-agent-workspace";
import type { AgentSession } from "../types";

type StatusFilter = "all" | "running" | "idle";
type SortKey = "updated" | "title" | "turns";

function relativeTime(timestamp: number): string {
  const deltaMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (deltaMinutes < 1) return "just now";
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const hours = Math.round(deltaMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/* Sessions page — mirrors features/agent/sessions/sessions-page.tsx: eyebrow
   "Agent" / title "Sessions", summary chips, search with ⌘K hint, status
   pills, project select, and the sortable session table. */
export function SessionsPage({ model }: { model: AgentWorkspaceModel }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [projectId, setProjectId] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated");
  const [refreshing, setRefreshing] = useState(false);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let filtered = model.sessions;
    if (needle) {
      filtered = filtered.filter((session) =>
        [session.title, session.modelId, projectFixtures.find((p) => p.id === session.projectId)?.name ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      );
    }
    if (status !== "all") {
      filtered = filtered.filter((session) => (status === "running" ? session.running : !session.running));
    }
    if (projectId !== "all") {
      filtered = filtered.filter((session) => session.projectId === projectId);
    }
    return [...filtered].sort((a, b) => {
      if (sortKey === "title") return a.title.localeCompare(b.title);
      if (sortKey === "turns") return b.turns - a.turns;
      return b.updatedAt - a.updatedAt;
    });
  }, [model.sessions, query, status, projectId, sortKey]);

  const runningCount = model.sessions.filter((session) => session.running).length;

  return (
    <main className="min-h-full overflow-y-auto bg-(--ui-bg) text-(--ui-fg)">
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 lg:py-8">
        {/* Header */}
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <div className="text-[length:var(--fs-xs)] uppercase tracking-[0.14em] text-(--ui-muted)">
              Agent
            </div>
            <h1 className="mt-1 text-[length:var(--fs-3xl)] font-medium tracking-[-0.02em] text-(--ui-fg)">
              Sessions
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SummaryChip label="Sessions" value={String(model.sessions.length)} />
            <SummaryChip label="Running" value={String(runningCount)} highlight={runningCount > 0} />
            <SummaryChip label="Projects" value={String(projectFixtures.length)} />
            <button
              type="button"
              onClick={() => {
                setRefreshing(true);
                window.setTimeout(() => setRefreshing(false), 500);
              }}
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-(--ui-border) px-2.5 text-[length:var(--fs-sm)] text-(--ui-muted) transition-colors hover:bg-(--ui-hover) hover:text-(--ui-fg)"
            >
              <RefreshCw className={cx("h-3.5 w-3.5", refreshing ? "animate-spin" : "")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-64 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-(--ui-muted)" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by prompt, project, model…"
              className="h-8 w-full rounded-md border border-(--ui-border) bg-(--ui-bg) pl-8 pr-12 text-[length:var(--fs-sm)] text-(--ui-fg) outline-none placeholder:text-(--ui-muted) focus:border-(--ui-info)/50"
            />
            <button
              type="button"
              onClick={() => model.setCommandOpen(true)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-(--ui-border) px-1 font-mono text-[length:var(--fs-2xs)] text-(--ui-muted) transition-colors hover:text-(--ui-fg)"
              title="Open command palette"
            >
              ⌘K
            </button>
          </div>
          <div className="inline-flex items-center gap-0.5 rounded-lg border border-(--ui-border) bg-(--ui-bg) p-0.5">
            {(["all", "running", "idle"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setStatus(option)}
                className={cx(
                  "rounded-md px-2.5 py-1 text-[length:var(--fs-sm)] capitalize transition-colors",
                  status === option
                    ? "bg-(--ui-surface) text-(--ui-fg) shadow-sm"
                    : "text-(--ui-muted) hover:text-(--ui-fg)",
                )}
              >
                {option === "all" ? "All" : option}
              </button>
            ))}
          </div>
          <select
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-8 rounded-md border border-(--ui-separator) bg-(--ui-bg) px-2.5 text-[length:var(--fs-sm)] text-(--ui-fg) outline-none focus:border-(--ui-info)/50"
            aria-label="Filter by project"
          >
            <option value="all">All projects</option>
            {projectFixtures.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-[var(--ui-radius)] border border-(--ui-border)">
          <table className="w-full text-left">
            <thead className="border-b border-(--ui-border) bg-(--ui-surface)">
              <tr>
                <SortableTH label="Title" active={sortKey === "title"} onClick={() => setSortKey("title")} />
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-(--ui-muted)">
                  Project
                </th>
                <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-(--ui-muted)">
                  Model
                </th>
                <SortableTH label="Turns" active={sortKey === "turns"} onClick={() => setSortKey("turns")} align="right" />
                <SortableTH label="Updated" active={sortKey === "updated"} onClick={() => setSortKey("updated")} align="right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-(--ui-border)">
              {rows.map((session) => (
                <SessionRow key={session.id} session={session} model={model} />
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[length:var(--fs-sm)] text-(--ui-muted)">
                    No sessions match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

function SessionRow({ session, model }: { session: AgentSession; model: AgentWorkspaceModel }) {
  const project = projectFixtures.find((row) => row.id === session.projectId);
  return (
    <tr
      className="cursor-pointer transition-colors hover:bg-(--ui-hover)"
      onClick={() => {
        model.openSessionInPane(model.focusedPaneId, session.id);
        model.setView("workspace");
      }}
    >
      <td className="px-4 py-2.5">
        <span className="flex items-center gap-2">
          <span
            className={cx(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              session.running ? "animate-pulse bg-(--ui-success)" : "bg-(--ui-muted)/60",
            )}
          />
          <span className="truncate text-[length:var(--fs-base)] text-(--ui-fg)">{session.title}</span>
        </span>
      </td>
      <td className="px-4 py-2.5 text-[length:var(--fs-sm)] text-(--ui-muted)">{project?.name}</td>
      <td className="px-4 py-2.5 font-mono text-[length:var(--fs-sm)] text-(--ui-muted)">
        {session.modelId}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-[length:var(--fs-sm)] tabular-nums text-(--ui-muted)">
        {session.turns}
      </td>
      <td className="px-4 py-2.5 text-right font-mono text-[length:var(--fs-sm)] text-(--ui-muted)">
        {relativeTime(session.updatedAt)}
      </td>
    </tr>
  );
}

function SummaryChip({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <span
      className={cx(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[length:var(--fs-sm)]",
        highlight
          ? "border-(--ui-success)/30 bg-(--ui-success)/10 text-(--ui-success)"
          : "border-(--ui-border) text-(--ui-muted)",
      )}
    >
      {label}
      <span className="font-mono tabular-nums">{value}</span>
    </span>
  );
}

function SortableTH({
  label,
  active,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      className={cx(
        "px-4 py-2.5 text-xs font-medium uppercase tracking-wider",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cx(
          "uppercase tracking-wider transition-colors",
          active ? "text-(--ui-fg)" : "text-(--ui-muted) hover:text-(--ui-fg)",
        )}
      >
        {label}
        {active ? " ↓" : ""}
      </button>
    </th>
  );
}
