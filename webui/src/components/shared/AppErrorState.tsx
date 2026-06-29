import { AlertTriangle } from "lucide-react";

type AppErrorStateProps = {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function AppErrorState({ title, message, action }: AppErrorStateProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ui-bg)] p-6 text-[var(--ui-fg)]">
      <section className="w-full max-w-[420px] rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-panel)] p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-[var(--ui-control-h)] w-[var(--ui-control-h)] shrink-0 items-center justify-center rounded-[var(--rad-lg)] bg-[var(--ui-surface)] text-[var(--ui-warn)]">
            <AlertTriangle aria-hidden size={15} />
          </span>
          <div className="min-w-0">
            <h1 className="m-0 text-[length:var(--fs-xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
              {title}
            </h1>
            <p className="mt-2 text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
              {message}
            </p>
            {action ? (
              <button
                type="button"
                onClick={action.onClick}
                className="mt-4 h-[var(--ui-control-h)] rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 text-[length:var(--fs-md)] font-[var(--weight-strong)] hover:border-[var(--ui-border-hover)] hover:bg-[var(--ui-hover)]"
              >
                {action.label}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
