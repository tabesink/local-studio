"use client";

import { useMemo, useState } from "react";
import {
  ArrowUp,
  AtSign,
  Brain,
  ChevronDown,
  ListPlus,
  MoreHorizontal,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  Slash,
  Sparkles,
  Square,
  Wrench,
  X,
} from "lucide-react";
import { cx } from "../../../_shared/ui";
import { TIMELINE_EMPTY_HINT, TIMELINE_EMPTY_TITLE } from "../constants";
import { contextChipsFixture, modelOptionsFixture } from "../fixtures";
import type { AgentWorkspaceModel } from "../hooks/use-agent-workspace";
import type { TimelineBlock, WorkspaceMessage } from "../types";

/* Chat pane — mirrors features/agent/ui/chat-pane.tsx + agent-composer-frame.tsx:
   pane header with the ⋯ menu (Rename / Pin / Fork / Export / reasoning toggle),
   block timeline, lifted composer with queue panel, context chips, attachment
   tray, model picker, and the cwd | git | tokens status bar. */
export function ChatPane({
  paneId,
  sessionId,
  model,
  compact = false,
}: {
  paneId: string;
  sessionId: string;
  model: AgentWorkspaceModel;
  compact?: boolean;
}) {
  const session = model.sessions.find((row) => row.id === sessionId);
  const messages = model.messagesBySession[sessionId] ?? [];
  const running = model.runningSessionId === sessionId;

  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [queueExpanded, setQueueExpanded] = useState(true);

  const activeModel = useMemo(
    () => modelOptionsFixture.find((option) => option.id === session?.modelId) ?? modelOptionsFixture[0],
    [session?.modelId],
  );

  if (!session) return null;

  const send = () => {
    if (!input.trim()) return;
    if (running) {
      /* Enter while running = Steer in the reference. */
      model.queueMessage(input, "steer");
    } else {
      void model.submitTurn(sessionId, input);
    }
    setInput("");
  };

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col bg-(--agent-bg)">
      {!compact ? (
        <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-(--border)/85 bg-(--color-header) px-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[length:var(--fs-lg)] font-medium text-(--fg)">
              {session.title}
            </span>
            {session.running || running ? (
              <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-(--hl2)" />
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <div className="relative">
              <PaneIconButton label="Pane menu" onClick={() => setMenuOpen((open) => !open)}>
                <MoreHorizontal className="h-3.5 w-3.5" />
              </PaneIconButton>
              {menuOpen ? (
                <div className="absolute right-0 top-8 z-30 w-52 rounded-lg border border-(--border) bg-(--surface-2)/95 py-1 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md">
                  <PaneMenuItem label="Rename" onClick={() => setMenuOpen(false)} />
                  <PaneMenuItem label="Pin" onClick={() => setMenuOpen(false)} />
                  <PaneMenuItem
                    label="Fork"
                    onClick={() => {
                      model.forkPane(paneId);
                      setMenuOpen(false);
                    }}
                  />
                  <PaneMenuItem label="Export as Markdown" onClick={() => setMenuOpen(false)} />
                  <PaneMenuItem
                    label={model.showReasoning ? "Hide reasoning" : "Show reasoning"}
                    onClick={() => {
                      model.setShowReasoning(!model.showReasoning);
                      setMenuOpen(false);
                    }}
                  />
                </div>
              ) : null}
            </div>
            {model.leaves.length > 1 ? (
              <PaneIconButton label="Close pane" onClick={() => model.closePane(paneId)}>
                <X className="h-3.5 w-3.5" />
              </PaneIconButton>
            ) : null}
            <PaneIconButton
              label={model.computerOpen ? "Hide right sidebar" : "Show right sidebar"}
              onClick={() => model.setComputerOpen(!model.computerOpen)}
            >
              {model.computerOpen ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5" />
              )}
            </PaneIconButton>
          </div>
        </header>
      ) : null}

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
            <div className="text-[length:var(--fs-lg)] text-(--fg)/80">{TIMELINE_EMPTY_TITLE}</div>
            <div className="text-[length:var(--fs-sm)] text-(--dim)">{TIMELINE_EMPTY_HINT}</div>
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[var(--thread-w)] flex-col gap-5">
            {messages.map((message) => (
              <TimelineMessage
                key={message.id}
                message={message}
                showReasoning={model.showReasoning}
              />
            ))}
            {running ? (
              <div className="font-mono text-[length:var(--fs-xs)] text-(--dim)">running…</div>
            ) : null}
          </div>
        )}
      </div>

      {/* Composer stack */}
      <div className="shrink-0 bg-(--agent-bg) px-4 pb-2 pt-2.5">
        {/* Queue panel */}
        {model.queue.length > 0 ? (
          <div className="mx-auto mb-2 w-full max-w-[var(--composer-w)] rounded-lg border border-(--border)/50 bg-(--surface)/40">
            <button
              type="button"
              onClick={() => setQueueExpanded((open) => !open)}
              className="flex w-full items-center justify-between px-3 py-1.5 font-mono text-[length:var(--fs-xs)] text-(--dim)"
            >
              queue {model.queue.length}
              <ChevronDown className={cx("h-3 w-3 transition-transform", queueExpanded ? "" : "-rotate-90")} />
            </button>
            {queueExpanded
              ? model.queue.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 border-t border-(--border)/40 px-3 py-1.5 text-[length:var(--fs-sm)]"
                  >
                    <span
                      className={cx(
                        "shrink-0 font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.12em]",
                        item.mode === "steer" ? "text-(--link)" : "text-(--dim)",
                      )}
                    >
                      {item.mode}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-(--fg)/80">{item.text}</span>
                    <button
                      type="button"
                      onClick={() => model.removeQueued(item.id)}
                      aria-label="Remove from queue"
                      className="shrink-0 text-(--dim) transition-colors hover:text-(--fg)"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              : null}
          </div>
        ) : null}

        {/* Composer surface */}
        <div className="mx-auto w-full max-w-[var(--composer-w)] rounded-[var(--composer-radius)] border border-(--border)/60 bg-(--composer) shadow-[var(--composer-shadow)]">
          {/* Loaded-context chips: @ plugins (sky) · $ skills (emerald) · / templates (amber) */}
          <div className="flex flex-wrap gap-1 border-b border-(--border)/40 px-3 py-2">
            {contextChipsFixture.map((chip) => (
              <span
                key={chip.id}
                className={cx(
                  "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[length:var(--fs-xs)]",
                  chip.prefix === "@"
                    ? "bg-(--link)/12 text-(--link)"
                    : chip.prefix === "$"
                      ? "bg-(--ok)/12 text-(--ok)"
                      : "bg-(--warn)/12 text-(--warn)",
                )}
              >
                {chip.prefix === "@" ? (
                  <AtSign className="h-3 w-3" />
                ) : chip.prefix === "$" ? (
                  <Sparkles className="h-3 w-3" />
                ) : (
                  <Slash className="h-3 w-3" />
                )}
                {chip.label}
              </span>
            ))}
          </div>

          {/* Attachment tray */}
          {attachments.length > 0 ? (
            <div className="flex flex-wrap gap-1 border-b border-(--border)/40 px-3 py-2">
              {attachments.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setAttachments((current) => current.filter((file) => file !== name))}
                  className="inline-flex items-center gap-1.5 rounded-md bg-(--hover) px-2 py-1 font-mono text-[length:var(--fs-xs)] text-(--dim) transition-colors hover:text-(--fg)"
                >
                  <Paperclip className="h-3 w-3" />
                  {name}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="relative">
            {mentionOpen ? <MentionPicker onPick={() => setMentionOpen(false)} /> : null}
            <textarea
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
                const lastChar = event.target.value.at(-1);
                setMentionOpen(lastChar === "@" || lastChar === "$" || lastChar === "/");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
                if (event.key === "Tab" && input.trim()) {
                  event.preventDefault();
                  model.queueMessage(input, "queue");
                  setInput("");
                }
                if (event.key === "Escape" && running) void model.abortTurn();
              }}
              placeholder="Ask anything"
              className="min-h-20 w-full resize-none bg-transparent px-4 py-3 text-[length:var(--fs-base)] leading-6 text-(--fg) outline-none placeholder:text-(--dim)/60"
            />
          </div>

          {/* Composer actions */}
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              <ComposerIconButton
                label="Attach files"
                onClick={() => setAttachments((current) => [...current, "usage-notes.md"])}
              >
                <Paperclip className="h-4 w-4" />
              </ComposerIconButton>
              {/* Model picker (agent-model-picker.tsx) */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelPickerOpen((open) => !open)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-mono text-[length:var(--fs-sm)] text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
                  aria-expanded={modelPickerOpen}
                >
                  <Brain className="h-3.5 w-3.5" />
                  {activeModel.label}
                  {!activeModel.running ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-(--warn)" title="Model not running" />
                  ) : null}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {modelPickerOpen ? (
                  <div className="absolute bottom-9 left-0 z-40 w-[340px] rounded-lg border border-(--border) bg-[#151515] py-1 shadow-[var(--composer-shadow)]">
                    <div className="border-b border-(--border)/50 px-3 py-2">
                      <input
                        placeholder="Search models…"
                        className="w-full bg-transparent text-[length:var(--fs-sm)] text-(--fg) outline-none placeholder:text-(--dim)/60"
                      />
                    </div>
                    {modelOptionsFixture.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setModelPickerOpen(false)}
                        className={cx(
                          "flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-[length:var(--fs-sm)] transition-colors hover:bg-(--hover)",
                          option.id === activeModel.id ? "text-(--fg)" : "text-(--dim)",
                        )}
                      >
                        <span className="min-w-0 flex-1 truncate">{option.label}</span>
                        {option.reasoning ? <ModelBadge label="R" /> : null}
                        {option.vision ? <ModelBadge label="V" /> : null}
                        {option.running ? (
                          <span className="flex items-center gap-1 text-[length:var(--fs-2xs)] text-(--ok)">
                            <span className="h-1.5 w-1.5 rounded-full bg-(--ok)" />
                            running
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {running ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (input.trim()) {
                        model.queueMessage(input, "queue");
                        setInput("");
                      }
                    }}
                    title="Send (Enter) · Queue (Tab)"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[length:var(--fs-sm)] text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
                  >
                    <ListPlus className="h-3.5 w-3.5" />
                    Queue
                  </button>
                  <button
                    type="button"
                    onClick={send}
                    disabled={!input.trim()}
                    title="Steer (Enter): interrupt the running turn with new direction"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-[length:var(--fs-sm)] text-(--link) transition-colors hover:bg-(--link)/10 disabled:opacity-40"
                  >
                    Steer
                  </button>
                  <button
                    type="button"
                    onClick={() => void model.abortTurn()}
                    title="Stop (Esc)"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-(--err) transition-colors hover:bg-(--err)/10"
                  >
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={send}
                  disabled={!input.trim()}
                  title="Send (Enter) · Queue (Tab)"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-(--fg)/90 text-(--bg) transition-colors hover:bg-(--fg) disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status bar — cwd | git | tokens/contextWindow */}
        {!compact ? (
          <div className="mx-auto mt-1 flex w-full max-w-[var(--composer-w)] items-center justify-between gap-3 px-1 font-mono text-[length:var(--fs-xs)] text-(--dim)/80">
            <span className="truncate">{session.cwd}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span>
                {session.gitBranch} {session.gitSummary !== "-" ? `· ${session.gitSummary}` : ""}
              </span>
              <button
                type="button"
                onClick={() => {
                  model.setComputerOpen(true);
                  model.setComputerTab("status");
                }}
                className="transition-colors hover:text-(--fg)"
                title="Open Status tab"
              >
                {session.tokens.toLocaleString()}/{session.contextWindow.toLocaleString()}
              </button>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TimelineMessage({
  message,
  showReasoning,
}: {
  message: WorkspaceMessage;
  showReasoning: boolean;
}) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl bg-(--surface) px-4 py-2.5">
        <div className="whitespace-pre-wrap text-[length:var(--fs-base)] leading-6 text-(--fg)">
          {message.blocks[0]?.text}
        </div>
      </div>
    );
  }
  const blocks = showReasoning
    ? message.blocks
    : message.blocks.filter((block) => block.kind !== "thinking");
  return (
    <div className="mr-auto w-full max-w-[92%] space-y-2.5">
      {blocks.map((block) => (
        <TimelineBlockView key={block.id} block={block} />
      ))}
    </div>
  );
}

function TimelineBlockView({ block }: { block: TimelineBlock }) {
  switch (block.kind) {
    case "thinking":
      return (
        <div className="border-l-2 border-(--border) pl-3 text-[length:var(--fs-sm)] italic leading-6 text-(--dim)">
          {block.text}
        </div>
      );
    case "tool":
      return (
        <div className="flex items-start gap-2 rounded-md border border-(--border)/50 bg-(--surface)/40 px-3 py-2">
          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-(--dim)" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[length:var(--fs-sm)] text-(--fg)">
                {block.toolName}
              </span>
              <span
                className={cx(
                  "font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.12em]",
                  block.toolStatus === "done"
                    ? "text-(--ok)"
                    : block.toolStatus === "error"
                      ? "text-(--err)"
                      : "text-(--dim)",
                )}
              >
                {block.toolStatus}
              </span>
            </div>
            <div className="mt-0.5 truncate font-mono text-[length:var(--fs-xs)] text-(--dim)">
              {block.text}
            </div>
          </div>
        </div>
      );
    case "event":
      return (
        <div className="font-mono text-[length:var(--fs-xs)] uppercase tracking-[0.12em] text-(--dim)/70">
          {block.text}
        </div>
      );
    default:
      return (
        <div className="whitespace-pre-wrap text-[length:var(--fs-base)] leading-7 text-(--fg)">
          {block.text}
        </div>
      );
  }
}

/* Mention picker (agent-mention-picker.tsx) — @ plugins, $ skills, / commands. */
function MentionPicker({ onPick }: { onPick: () => void }) {
  const sections = [
    { title: "Plugins & files", items: ["filesystem", "browser", "usage-notes.md"] },
    { title: "Skills", items: ["code-review", "benchmark"] },
    { title: "Slash commands", items: ["plan", "compact"] },
  ];
  return (
    <div className="absolute bottom-full left-3 z-40 mb-1 w-72 rounded-lg border border-(--border) bg-(--color-popover) py-1 shadow-[var(--composer-shadow)]">
      {sections.map((section) => (
        <div key={section.title}>
          <div className="px-3 pb-0.5 pt-1.5 text-[length:var(--fs-2xs)] uppercase tracking-[0.12em] text-(--dim)/70">
            {section.title}
          </div>
          {section.items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={onPick}
              className="block w-full px-3 py-1 text-left font-mono text-[length:var(--fs-sm)] text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
            >
              {item}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

function ModelBadge({ label }: { label: string }) {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-(--surface) text-[length:var(--fs-2xs)] font-medium text-(--dim)">
      {label}
    </span>
  );
}

function PaneIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded-md text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
    >
      {children}
    </button>
  );
}

function PaneMenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-3 py-1.5 text-left text-[length:var(--fs-sm)] text-(--fg)/85 transition-colors hover:bg-(--hover)"
    >
      {label}
    </button>
  );
}

function ComposerIconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-md text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
    >
      {children}
    </button>
  );
}
