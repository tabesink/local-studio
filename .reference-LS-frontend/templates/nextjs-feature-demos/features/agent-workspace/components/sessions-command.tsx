"use client";

import { useMemo, useState } from "react";
import { CornerDownLeft, Search } from "lucide-react";
import { cx } from "../../../_shared/ui";
import { APP_DESTINATIONS } from "../constants";
import { projectFixtures } from "../fixtures";
import type { AgentWorkspaceModel } from "../hooks/use-agent-workspace";

/* ⌘K command palette — mirrors sessions/sessions-command.tsx: centered
   min(720px,92vw) rounded-2xl card over a bg-black/55 backdrop-blur scrim,
   sections App destinations / Running now / Recent sessions, ↑↓ ↵ esc footer. */
export function SessionsCommand({ model }: { model: AgentWorkspaceModel }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const running = model.sessions.filter((session) => session.running);
  const recent = [...model.sessions].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);

  const entries = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = (text: string) => !needle || text.toLowerCase().includes(needle);
    return [
      ...APP_DESTINATIONS.filter((destination) => matches(destination.label)).map((destination) => ({
        section: "App destinations",
        id: `dest-${destination.href}`,
        label: destination.label,
        hint: destination.href,
        action: () => model.setCommandOpen(false),
      })),
      ...running
        .filter((session) => matches(session.title))
        .map((session) => ({
          section: "Running now",
          id: `run-${session.id}`,
          label: session.title,
          hint: session.modelId,
          action: () => {
            model.openSessionInPane(model.focusedPaneId, session.id);
            model.setView("workspace");
            model.setCommandOpen(false);
          },
        })),
      ...recent
        .filter((session) => matches(session.title))
        .map((session) => ({
          section: "Recent sessions",
          id: `recent-${session.id}`,
          label: session.title,
          hint: projectFixtures.find((project) => project.id === session.projectId)?.name ?? "",
          action: () => {
            model.openSessionInPane(model.focusedPaneId, session.id);
            model.setView("workspace");
            model.setCommandOpen(false);
          },
        })),
    ];
  }, [query, running, recent, model]);

  const clampedIndex = Math.min(activeIndex, Math.max(0, entries.length - 1));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[14vh]">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={() => model.setCommandOpen(false)}
      />
      <div className="relative z-10 w-[min(720px,92vw)] overflow-hidden rounded-2xl border border-(--border) bg-(--color-popover) shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        {/* Search row */}
        <div className="flex items-center gap-2.5 border-b border-(--border)/60 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-(--dim)" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActiveIndex((index) => Math.min(entries.length - 1, index + 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActiveIndex((index) => Math.max(0, index - 1));
              }
              if (event.key === "Enter") {
                event.preventDefault();
                entries[clampedIndex]?.action();
              }
            }}
            placeholder="Search sessions, projects, destinations…"
            className="w-full bg-transparent text-[length:var(--fs-base)] text-(--fg) outline-none placeholder:text-(--dim)/60"
          />
        </div>

        {/* Result sections */}
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {entries.length === 0 ? (
            <div className="px-4 py-6 text-center text-[length:var(--fs-sm)] text-(--dim)">
              Nothing matches &quot;{query}&quot;.
            </div>
          ) : (
            entries.map((entry, index) => {
              const previous = entries[index - 1];
              const showHeader = !previous || previous.section !== entry.section;
              return (
                <div key={entry.id}>
                  {showHeader ? (
                    <div className="px-4 pb-1 pt-2 text-[length:var(--fs-2xs)] uppercase tracking-[0.14em] text-(--dim)/70">
                      {entry.section}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={entry.action}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={cx(
                      "flex w-full items-center justify-between gap-3 px-4 py-2 text-left transition-colors",
                      index === clampedIndex ? "bg-(--hover) text-(--fg)" : "text-(--fg)/80",
                    )}
                  >
                    <span className="min-w-0 truncate text-[length:var(--fs-base)]">{entry.label}</span>
                    <span className="shrink-0 font-mono text-[length:var(--fs-xs)] text-(--dim)">
                      {entry.hint}
                    </span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-(--border)/60 px-4 py-2 font-mono text-[length:var(--fs-2xs)] text-(--dim)/70">
          <span>↑↓ navigate</span>
          <span className="flex items-center gap-1">
            <CornerDownLeft className="h-3 w-3" /> open
          </span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
