"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Activity,
  Code2,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  GitBranch,
  Globe2,
  MessageSquarePlus,
  Plus,
  TerminalSquare,
} from "lucide-react";
import { cx, ProgressBar } from "../../../_shared/ui";
import { TAB_LABELS } from "../constants";
import {
  browserFixture,
  fileContentsFixture,
  fsTreeFixture,
  gitDiffFixture,
  planMarkdownFixture,
  projectFixtures,
  terminalScrollbackFixture,
} from "../fixtures";
import type { AgentWorkspaceModel } from "../hooks/use-agent-workspace";
import type { ComputerTab, FsNode } from "../types";
import { ChatPane } from "./chat-pane";

const TAB_ICONS: Partial<Record<ComputerTab, React.ReactNode>> = {
  status: <Activity className="h-3.5 w-3.5" />,
  tools: <Plus className="h-3.5 w-3.5" />,
  canvas: <Code2 className="h-3.5 w-3.5" />,
  "side-chat": <MessageSquarePlus className="h-3.5 w-3.5" />,
  browser: <Globe2 className="h-3.5 w-3.5" />,
  files: <FolderTree className="h-3.5 w-3.5" />,
  diff: <GitBranch className="h-3.5 w-3.5" />,
  terminal: <TerminalSquare className="h-3.5 w-3.5" />,
};

const VISIBLE_TABS: ComputerTab[] = [
  "status",
  "plan",
  "files",
  "diff",
  "terminal",
  "browser",
  "canvas",
  "side-chat",
];

/* Right "computer" panel — mirrors agent-browser-panel.tsx: h-10 tab bar,
   default 440px width with left-edge resize (min max(280px,25%), max 65%),
   and one panel per tab. Status is never closable. */
export function ComputerPanel({ model }: { model: AgentWorkspaceModel }) {
  const startResize = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = model.computerWidth;
      const onMove = (move: PointerEvent) => {
        const next = startWidth + (startX - move.clientX);
        const min = Math.max(280, window.innerWidth * 0.25);
        const max = window.innerWidth * 0.65;
        model.setComputerWidth(Math.round(Math.min(max, Math.max(min, next))));
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [model],
  );

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-l border-(--border)/85 bg-(--color-panel) shadow-[inset_1px_0_rgba(255,255,255,0.02)]"
      style={{ width: `${model.computerWidth}px` }}
    >
      {/* Left-edge resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        onPointerDown={startResize}
        className="absolute left-0 top-0 z-10 h-full w-1 cursor-col-resize transition-colors hover:bg-(--link)/50"
      />

      {/* Tab bar */}
      <div className="flex h-10 shrink-0 items-center gap-0.5 overflow-x-auto border-b border-(--border)/85 bg-(--color-header) px-1.5 text-[length:var(--fs-sm)]">
        {VISIBLE_TABS.map((tab) => {
          const active = model.computerTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => model.setComputerTab(tab)}
              className={cx(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 transition-colors",
                active
                  ? "bg-(--color-surface-hover) text-(--fg)/85"
                  : "text-(--dim) hover:text-(--fg)",
              )}
            >
              {TAB_ICONS[tab]}
              {TAB_LABELS[tab]}
            </button>
          );
        })}
        <div className="ml-auto shrink-0">
          <button
            type="button"
            onClick={() => model.setComputerTab("tools")}
            title="Show tools"
            aria-label="Show tools"
            className={cx(
              "flex h-8 w-8 items-center justify-center rounded-md transition-colors",
              model.computerTab === "tools"
                ? "bg-(--color-surface-hover) text-(--fg)/85"
                : "text-(--dim) hover:text-(--fg)",
            )}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {model.computerTab === "status" ? <StatusPanel model={model} /> : null}
        {model.computerTab === "tools" ? <ToolsPanel model={model} /> : null}
        {model.computerTab === "plan" ? <PlanPanel model={model} /> : null}
        {model.computerTab === "files" ? <FilesPanel /> : null}
        {model.computerTab === "diff" ? <GitDiffPanel model={model} /> : null}
        {model.computerTab === "terminal" ? <TerminalPanel /> : null}
        {model.computerTab === "browser" ? <BrowserPanel /> : null}
        {model.computerTab === "canvas" ? <CanvasPanel model={model} /> : null}
        {model.computerTab === "side-chat" ? <SideChatPanel model={model} /> : null}
      </div>
    </aside>
  );
}

/* Status tab — session summary, Compact, token totals, workspace rows. */
function StatusPanel({ model }: { model: AgentWorkspaceModel }) {
  const session = model.focusedSession;
  const project = projectFixtures.find((row) => row.id === session?.projectId);
  if (!session) return null;
  const percent = Math.round((session.tokens / session.contextWindow) * 100);
  return (
    <div className="space-y-4 p-3">
      <section>
        <PanelSectionLabel>Session</PanelSectionLabel>
        <div className="mt-1.5 space-y-1.5 rounded-md border border-(--border)/50 bg-(--surface)/30 p-2.5">
          <PanelRow label="Title" value={session.title} />
          <PanelRow label="Model" value={session.modelId} mono />
          <PanelRow label="Turns" value={String(session.turns)} mono />
          <PanelRow label="State" value={session.running ? "running" : "idle"} mono />
        </div>
      </section>
      <section>
        <PanelSectionLabel>Context</PanelSectionLabel>
        <div className="mt-1.5 space-y-2 rounded-md border border-(--border)/50 bg-(--surface)/30 p-2.5">
          <PanelRow
            label="Tokens"
            value={`${session.tokens.toLocaleString()} / ${session.contextWindow.toLocaleString()} · ${percent}%`}
            mono
          />
          <ProgressBar progress={percent} />
          <button
            type="button"
            onClick={() => void model.compact()}
            disabled={model.compacting}
            className="inline-flex h-7 items-center rounded-md border border-(--border)/60 px-2.5 font-mono text-[length:var(--fs-xs)] uppercase tracking-[0.12em] text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg) disabled:opacity-45"
          >
            {model.compacting ? "Compacting" : "Compact"}
          </button>
        </div>
      </section>
      <section>
        <PanelSectionLabel>Workspace</PanelSectionLabel>
        <div className="mt-1.5 space-y-1.5 rounded-md border border-(--border)/50 bg-(--surface)/30 p-2.5">
          <PanelRow label="Project" value={project?.name ?? "—"} />
          <PanelRow label="Path" value={session.cwd} mono />
          <PanelRow label="Git" value={`${session.gitBranch} · ${session.gitSummary}`} mono />
          <PanelRow label="Browser" value={browserFixture.url} mono />
        </div>
      </section>
    </div>
  );
}

/* Tools launcher tab — card list (computer-launcher-panel). */
function ToolsPanel({ model }: { model: AgentWorkspaceModel }) {
  const tools: Array<{ tab: ComputerTab; label: string; description: string; icon: React.ReactNode }> = [
    { tab: "files", label: "Files", description: "Browse the workspace tree and open files.", icon: <FolderTree className="h-4 w-4" /> },
    { tab: "side-chat", label: "Side chat", description: "A second session beside the main pane.", icon: <MessageSquarePlus className="h-4 w-4" /> },
    { tab: "plan", label: "Plan", description: "Track the agent's task checklist.", icon: <FileText className="h-4 w-4" /> },
    { tab: "browser", label: "Browser", description: "Watch agent-driven navigation.", icon: <Globe2 className="h-4 w-4" /> },
    { tab: "diff", label: "Review", description: "Inspect uncommitted changes.", icon: <GitBranch className="h-4 w-4" /> },
    { tab: "terminal", label: "Terminal", description: "Persistent shells owned by the session.", icon: <TerminalSquare className="h-4 w-4" /> },
  ];
  return (
    <div className="space-y-2 p-3">
      {tools.map((tool) => (
        <button
          key={tool.tab}
          type="button"
          onClick={() => model.setComputerTab(tool.tab)}
          className="flex w-full items-start gap-3 rounded-md border border-(--border)/50 bg-(--surface)/30 p-3 text-left transition-colors hover:bg-(--hover)"
        >
          <span className="mt-0.5 shrink-0 text-(--dim)">{tool.icon}</span>
          <span className="min-w-0">
            <span className="block text-[length:var(--fs-base)] font-medium text-(--fg)">
              {tool.label}
            </span>
            <span className="mt-0.5 block text-[length:var(--fs-sm)] text-(--dim)">
              {tool.description}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* Plan tab — List/Raw toggle, progress bar, checkbox todos (plan-panel). */
function PlanPanel({ model }: { model: AgentWorkspaceModel }) {
  const [mode, setMode] = useState<"list" | "raw">("list");
  const done = model.planTasks.filter((task) => task.done).length;
  const percent = model.planTasks.length ? Math.round((done / model.planTasks.length) * 100) : 0;
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-0.5 rounded-lg border border-(--ui-border) bg-(--ui-bg) p-0.5">
          {(["list", "raw"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMode(option)}
              className={cx(
                "rounded-md px-2 py-0.5 text-[length:var(--fs-sm)] capitalize transition-colors",
                mode === option
                  ? "bg-(--ui-surface) text-(--ui-fg) shadow-sm"
                  : "text-(--ui-muted) hover:text-(--ui-fg)",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <span className="font-mono text-[length:var(--fs-xs)] text-(--dim)">
          {done}/{model.planTasks.length} · {percent}%
        </span>
      </div>
      <ProgressBar progress={percent} />
      {model.planTasks.length === 0 ? (
        <div className="space-y-1 pt-4 text-center">
          <div className="text-[length:var(--fs-base)] text-(--fg)/80">No tasks yet</div>
          <div className="font-mono text-[length:var(--fs-xs)] text-(--dim)">- [ ] task</div>
        </div>
      ) : mode === "list" ? (
        <div className="space-y-1">
          {model.planTasks.map((task) => (
            <label
              key={task.id}
              className="flex items-start gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-(--hover)"
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => model.togglePlanTask(task.id)}
                className="mt-0.5 h-3.5 w-3.5 accent-(--ui-info)"
              />
              <span
                className={cx(
                  "text-[length:var(--fs-sm)] leading-5",
                  task.done ? "text-(--dim) line-through" : "text-(--fg)/90",
                )}
              >
                {task.label}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <pre className="overflow-x-auto rounded-md border border-(--border)/50 bg-(--surface)/30 p-3 font-mono text-[length:var(--fs-xs)] leading-relaxed text-(--fg)/80">
          {planMarkdownFixture}
        </pre>
      )}
    </div>
  );
}

/* Filesystem tab — tree + file viewer (filesystem-panel). */
function FilesPanel() {
  const [selectedPath, setSelectedPath] = useState<string | null>(
    "frontend/src/features/usage/use-usage.ts",
  );
  const content = selectedPath ? fileContentsFixture[selectedPath] : undefined;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="max-h-56 shrink-0 overflow-y-auto border-b border-(--border)/50 p-2">
        {fsTreeFixture.map((node) => (
          <FsNodeRow key={node.path} node={node} depth={0} selectedPath={selectedPath} onSelect={setSelectedPath} />
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {selectedPath ? (
          <>
            <div className="mb-2 truncate font-mono text-[length:var(--fs-xs)] text-(--dim)">
              {selectedPath}
            </div>
            {content ? (
              <pre className="overflow-x-auto rounded-md border border-(--border)/50 bg-(--surface)/30 p-3 font-mono text-[length:var(--fs-xs)] leading-relaxed text-(--fg)/85">
                {content}
              </pre>
            ) : (
              <div className="text-[length:var(--fs-sm)] text-(--dim)">
                No preview for this file in the fixture set.
              </div>
            )}
          </>
        ) : (
          <div className="text-[length:var(--fs-sm)] text-(--dim)">Select a file to preview.</div>
        )}
      </div>
    </div>
  );
}

function FsNodeRow({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: FsNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(true);
  if (node.kind === "dir") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[length:var(--fs-sm)] text-(--fg)/85 transition-colors hover:bg-(--hover)"
          style={{ paddingLeft: `${6 + depth * 12}px` }}
        >
          {open ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-(--dim)" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-(--dim)" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {open
          ? node.children?.map((child) => (
              <FsNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))
          : null}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(node.path)}
      className={cx(
        "flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left font-mono text-[length:var(--fs-sm)] transition-colors",
        node.path === selectedPath
          ? "bg-(--selected) text-(--fg)"
          : "text-(--dim) hover:bg-(--hover) hover:text-(--fg)",
      )}
      style={{ paddingLeft: `${6 + depth * 12}px` }}
    >
      <FileText className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

/* Git tab — branch bar + unified diff (git-diff-panel). */
function GitDiffPanel({ model }: { model: AgentWorkspaceModel }) {
  const session = model.focusedSession;
  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between gap-2 rounded-md border border-(--border)/50 bg-(--surface)/30 px-2.5 py-1.5">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-[length:var(--fs-sm)] text-(--fg)/85">
          <GitBranch className="h-3.5 w-3.5 shrink-0 text-(--dim)" />
          <span className="truncate">{session?.gitBranch ?? "main"}</span>
        </span>
        <span className="shrink-0 font-mono text-[length:var(--fs-xs)] text-(--dim)">
          {session?.gitSummary ?? "clean"}
        </span>
      </div>
      {gitDiffFixture.map((file) => (
        <div key={file.path} className="overflow-hidden rounded-md border border-(--border)/50">
          <div className="flex items-center justify-between gap-2 border-b border-(--border)/50 bg-(--surface)/40 px-2.5 py-1.5">
            <span className="truncate font-mono text-[length:var(--fs-xs)] text-(--fg)/85">
              {file.path}
            </span>
            <span className="shrink-0 font-mono text-[length:var(--fs-xs)]">
              <span className="text-(--ok)">+{file.additions}</span>{" "}
              <span className="text-(--err)">-{file.deletions}</span>
            </span>
          </div>
          <pre className="overflow-x-auto p-2 font-mono text-[length:var(--fs-xs)] leading-relaxed">
            {file.hunks.map((line, index) => (
              <div
                key={index}
                className={cx(
                  line.startsWith("+")
                    ? "bg-(--ok)/10 text-(--ok)"
                    : line.startsWith("-")
                      ? "bg-(--err)/10 text-(--err)"
                      : "text-(--dim)",
                )}
              >
                {line}
              </div>
            ))}
          </pre>
        </div>
      ))}
    </div>
  );
}

/* Terminal tab — fixture scrollback (PersistentTerminals stand-in; the
   reference mounts real PTYs, out of scope for a fixture demo). */
function TerminalPanel() {
  return (
    <div className="flex h-full flex-col p-3">
      <pre className="min-h-0 flex-1 overflow-auto rounded-md border border-(--border)/50 bg-[#0c0c0c] p-3 font-mono text-[length:var(--fs-sm)] leading-relaxed text-(--fg)/85">
        {terminalScrollbackFixture.join("\n")}
      </pre>
    </div>
  );
}

/* Browser tab — URL bar + static screencast frame (agent-browser). */
function BrowserPanel() {
  return (
    <div className="flex h-full flex-col gap-3 p-3">
      <div className="flex items-center gap-2 rounded-md border border-(--border)/50 bg-(--surface)/30 px-2.5 py-1.5">
        <Globe2 className="h-3.5 w-3.5 shrink-0 text-(--dim)" />
        <span className="truncate font-mono text-[length:var(--fs-sm)] text-(--fg)/85">
          {browserFixture.url}
        </span>
      </div>
      {/* Static screencast placeholder — real screencast is CDP-backed. */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-md border border-(--border)/50 bg-(--ui-bg)">
        <div className="border-b border-(--border)/40 px-3 py-2 text-[length:var(--fs-sm)] text-(--fg)/85">
          {browserFixture.title}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <div className="h-6 w-2/3 rounded bg-(--surface)" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-14 rounded border border-(--border)/40 bg-(--surface)/60" />
            ))}
          </div>
          <div className="mt-1 flex flex-1 items-end gap-1">
            {[34, 52, 41, 68, 58, 75, 62, 80, 71, 88, 79, 92].map((height, index) => (
              <div
                key={index}
                className="flex-1 rounded-t bg-(--color-usage-chart-1)/70"
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="text-center font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.12em] text-(--dim)/60">
        static frame — live screencast is CDP-backed in the reference
      </div>
    </div>
  );
}

/* Canvas tab — shared scratchboard (canvas-panel). */
function CanvasPanel({ model }: { model: AgentWorkspaceModel }) {
  return (
    <div className="flex h-full flex-col p-3">
      <textarea
        value={model.canvasText}
        onChange={(event) => model.setCanvasText(event.target.value)}
        className="min-h-0 flex-1 resize-none rounded-md border border-(--border)/50 bg-(--surface)/30 p-3 font-mono text-[length:var(--fs-sm)] leading-relaxed text-(--fg)/90 outline-none focus:border-(--ui-info)/50"
        aria-label="Canvas scratchboard"
      />
    </div>
  );
}

/* Side chat tab — nested mini chat pane, no header (paneId "computer-side-chat"). */
function SideChatPanel({ model }: { model: AgentWorkspaceModel }) {
  const sideSessionId = model.sessions.find((session) => session.id === "sess-release-notes")?.id;
  if (!sideSessionId) return null;
  return (
    <div className="h-full">
      <ChatPane paneId="computer-side-chat" sessionId={sideSessionId} model={model} compact />
    </div>
  );
}

function PanelSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[length:var(--fs-2xs)] font-medium uppercase tracking-[0.14em] text-(--dim)/75">
      {children}
    </div>
  );
}

function PanelRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[length:var(--fs-sm)]">
      <span className="shrink-0 text-(--dim)">{label}</span>
      <span className={cx("min-w-0 truncate text-right text-(--fg)/85", mono ? "font-mono" : "")}>
        {value}
      </span>
    </div>
  );
}
