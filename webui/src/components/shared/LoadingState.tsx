type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Loading" }: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-[var(--ui-bg)] text-[var(--ui-fg)]"
    >
      <div className="flex h-[var(--row-h)] items-center gap-2 rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-panel)] px-3 text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
        <span className="h-1.5 w-1.5 rounded-[var(--rad-full)] bg-[var(--ui-accent)]" />
        {label}
      </div>
    </div>
  );
}
