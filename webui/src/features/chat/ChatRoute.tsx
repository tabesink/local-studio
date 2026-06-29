import { SendHorizonal } from "lucide-react";

export function ChatRoute() {
  return (
    <main data-testid="chat-route" className="flex h-full min-h-0 bg-[var(--ui-bg)]">
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden" aria-labelledby="chat-heading">
        <header className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="mb-5 flex min-h-9 items-center justify-between gap-3">
            <h1
              id="chat-heading"
              className="m-0 text-[length:var(--fs-3xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]"
            >
              Chat
            </h1>
          </div>
          <div role="region" aria-label="Chat controls" className="mb-5 flex min-h-9 flex-wrap items-center gap-2">
            <span className="inline-flex h-[var(--ui-control-h)] items-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-2 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-muted)]">
              Domain unavailable
            </span>
            <span className="inline-flex h-[var(--ui-control-h)] items-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">
              Synthesis: setup pending
            </span>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-5 sm:px-6">
          <div className="mx-auto flex min-h-full max-w-[900px] flex-col items-center justify-center py-8 text-center">
            <div className="rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-4 py-3">
              <p className="m-0 text-[length:var(--fs-xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
                Query the knowledge base
              </p>
              <p className="mt-2 max-w-[440px] text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
                Chat history, retrieved evidence, and streaming answers will occupy this conversation canvas.
              </p>
            </div>
          </div>
        </div>

        <footer className="shrink-0 border-t border-[var(--ui-border)] px-5 py-3 sm:px-6">
          <div className="mx-auto flex max-w-[900px] items-end gap-2 rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-input)] p-2">
            <textarea
              disabled
              aria-label="Ask LightRAG Domain"
              placeholder="Ask LightRAG Domain"
              className="min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-1 text-[length:var(--fs-base)] text-[var(--ui-fg)] outline-none placeholder:text-[var(--ui-fg-subtle)] disabled:opacity-100"
            />
            <button
              type="button"
              disabled
              aria-label="Send message"
              className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg-subtle)]"
            >
              <SendHorizonal aria-hidden size={15} />
            </button>
          </div>
        </footer>
      </section>

      <aside className="hidden w-[320px] shrink-0 border-l border-[var(--ui-border)] bg-[var(--ui-panel)] lg:flex lg:flex-col">
        <div className="border-b border-[var(--ui-border)] px-4 py-3">
          <h2 className="m-0 text-[length:var(--fs-lg)] font-[var(--weight-medium)]">Evidence</h2>
          <p className="mt-1 text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">Sources and retrieval frames appear here.</p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-4 text-center text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
          No evidence selected.
        </div>
      </aside>
    </main>
  );
}
