"use client";

import { useState } from "react";
import {
  ArrowUp,
  ChevronDown,
  GitBranch,
  ListPlus,
  Paperclip,
  Square,
  Wrench,
  X,
} from "lucide-react";
import { cx } from "../../../_shared/ui";
import { chatSessionMeta } from "../fixtures";
import { useChatShell } from "../hooks/use-chat-shell";
import type { AssistantBlock, ChatMessage } from "../types";

/* Chat shell — mirrors features/chat/chat-pane.tsx, timeline.tsx, and
   agent-composer-frame.tsx: pane header with title/model/branch, block-based
   timeline, lifted charcoal composer on composer tokens, and a mono
   cwd | git | tokens status bar. */
export function ChatShellDemo() {
  const chat = useChatShell();
  const [model, setModel] = useState(chatSessionMeta.model);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--agent-bg) text-(--ui-fg)">
      {/* Pane header */}
      <header className="flex h-10 shrink-0 items-center justify-between gap-3 border-b border-(--border)/35 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[length:var(--fs-base)] font-medium text-(--fg)">
            {chatSessionMeta.title}
          </span>
          <span className="flex shrink-0 items-center gap-1 font-mono text-[length:var(--fs-xs)] text-(--dim)">
            <GitBranch className="h-3 w-3" />
            {chatSessionMeta.branch}
          </span>
        </div>
        <span className="shrink-0 font-mono text-[length:var(--fs-xs)] text-(--dim)">{model}</span>
      </header>

      {/* Error banner with Retry */}
      {chat.error ? (
        <div
          className="flex items-center gap-3 border-b border-(--err)/30 bg-(--err)/10 px-4 py-2 text-[length:var(--fs-sm)] text-(--err)"
          role="alert"
        >
          <span className="min-w-0 flex-1 truncate">{chat.error}</span>
          <button
            type="button"
            onClick={() =>
              void chat.sendMessage(
                chat.messages.filter((message) => message.role === "user").at(-1)?.text ?? "",
              )
            }
            className="shrink-0 rounded-md px-2 py-1 font-medium transition-colors hover:bg-(--err)/15"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={chat.clearError}
            aria-label="Dismiss error"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-(--err)/15"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : null}

      {/* Timeline */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {chat.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-(--dim)">
            Ask Local Studio to start.
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-[var(--thread-w)] flex-col gap-5">
            {chat.messages.map((message) => (
              <TimelineMessage key={message.id} message={message} streaming={chat.running} />
            ))}
          </div>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void chat.sendMessage();
        }}
        className="shrink-0 bg-(--agent-bg) px-4 pb-2 pt-2.5 sm:px-6"
      >
        {chat.queue.length ? (
          <div className="mx-auto mb-2 flex w-full max-w-[var(--composer-w)] flex-wrap gap-1">
            {chat.queue.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => chat.removeQueued(item.id)}
                title="Remove from queue"
                className="inline-flex items-center gap-1.5 rounded-md bg-(--surface) px-2 py-1 font-mono text-[length:var(--fs-xs)] text-(--dim) transition-colors hover:text-(--fg)"
              >
                <ListPlus className="h-3 w-3" />
                {item.text}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        ) : null}

        <div className="mx-auto w-full max-w-[var(--composer-w)] rounded-[var(--composer-radius)] border border-(--border)/60 bg-(--composer) shadow-[var(--composer-shadow)]">
          {chat.attachments.length ? (
            <div className="flex flex-wrap gap-1 border-b border-(--border)/40 px-3 py-2">
              {chat.attachments.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => chat.removeAttachment(name)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-(--hover) px-2 py-1 font-mono text-[length:var(--fs-xs)] text-(--dim) transition-colors hover:text-(--fg)"
                >
                  <Paperclip className="h-3 w-3" />
                  {name}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          ) : null}
          <textarea
            value={chat.input}
            onChange={(event) => chat.setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void chat.sendMessage();
              }
            }}
            placeholder="Ask anything"
            className="min-h-24 w-full resize-none bg-transparent px-4 py-3 text-[length:var(--fs-base)] leading-6 text-(--fg) outline-none placeholder:text-(--dim)/60"
          />
          <div className="flex items-center justify-between px-2.5 pb-2.5">
            <div className="flex items-center gap-1">
              <ComposerIconButton
                label="Attach files"
                onClick={() => chat.setAttachments((current) => [...current, "context.md"])}
              >
                <Paperclip className="h-4 w-4" />
              </ComposerIconButton>
              <ComposerIconButton label="Queue message" onClick={chat.queueMessage}>
                <ListPlus className="h-4 w-4" />
              </ComposerIconButton>
              {/* Model picker */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelPickerOpen((open) => !open)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-[length:var(--fs-sm)] text-(--dim) transition-colors hover:bg-(--hover) hover:text-(--fg)"
                  aria-expanded={modelPickerOpen}
                >
                  {model}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {modelPickerOpen ? (
                  <div className="absolute bottom-9 left-0 z-50 w-56 rounded-lg border border-(--border) bg-(--color-popover) py-1 shadow-[var(--composer-shadow)]">
                    {chatSessionMeta.models.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setModel(option);
                          setModelPickerOpen(false);
                        }}
                        className={cx(
                          "flex w-full items-center justify-between gap-2 px-3 py-1.5 text-left text-[length:var(--fs-sm)] transition-colors hover:bg-(--hover)",
                          option === model ? "text-(--fg)" : "text-(--dim)",
                        )}
                      >
                        {option}
                        {option === model ? <span className="h-1.5 w-1.5 rounded-full bg-(--ok)" /> : null}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {chat.running ? (
                <button
                  type="button"
                  onClick={() => void chat.abort()}
                  title="Stop turn"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-(--err) transition-colors hover:bg-(--err)/10"
                >
                  <Square className="h-3.5 w-3.5" fill="currentColor" />
                </button>
              ) : null}
              <button
                type="submit"
                disabled={chat.running || !chat.input.trim()}
                title="Send message"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-(--fg)/90 text-(--bg) transition-colors hover:bg-(--fg) disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Status bar — cwd | git | tokens */}
        <div className="mx-auto mt-1 flex w-full max-w-[var(--composer-w)] items-center justify-between gap-3 px-1 font-mono text-[length:var(--fs-xs)] text-(--dim)/80">
          <span className="truncate">{chatSessionMeta.cwd}</span>
          <span className="flex shrink-0 items-center gap-3">
            <span>{chatSessionMeta.gitStatus}</span>
            <span>{chatSessionMeta.tokens}</span>
          </span>
        </div>
      </form>
    </div>
  );
}

function TimelineMessage({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  if (message.role === "user") {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl bg-(--surface) px-4 py-2.5">
        <div className="whitespace-pre-wrap text-[length:var(--fs-base)] leading-6 text-(--fg)">
          {message.text}
        </div>
      </div>
    );
  }

  const blocks: AssistantBlock[] =
    message.blocks && message.blocks.length > 0
      ? message.blocks
      : message.text
        ? [{ kind: "text", id: `${message.id}-text`, text: message.text }]
        : [];

  return (
    <div className="mr-auto w-full max-w-[92%] space-y-2.5">
      {blocks.length === 0 && streaming ? (
        <div className="text-[length:var(--fs-sm)] text-(--dim)">Streaming...</div>
      ) : null}
      {blocks.map((block) => (
        <TimelineBlock key={block.id} block={block} />
      ))}
    </div>
  );
}

function TimelineBlock({ block }: { block: AssistantBlock }) {
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
              <span className="font-mono text-[length:var(--fs-sm)] text-(--fg)">{block.name}</span>
              <span
                className={cx(
                  "font-mono text-[length:var(--fs-2xs)] uppercase tracking-[0.12em]",
                  block.status === "done"
                    ? "text-(--ok)"
                    : block.status === "error"
                      ? "text-(--err)"
                      : "text-(--dim)",
                )}
              >
                {block.status}
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
