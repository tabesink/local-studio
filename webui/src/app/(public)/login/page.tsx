import Link from "next/link";

export default function LoginPlaceholderPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--ui-bg)] px-4 text-[var(--ui-fg)]">
      <section className="w-full max-w-[420px] rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-panel)] px-4 py-3">
        <p className="m-0 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">AUTH</p>
        <h1 className="m-0 mt-1 text-[length:var(--fs-2xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
          Sign in placeholder
        </h1>
        <p className="mt-2 text-[length:var(--fs-md)] leading-[var(--leading)] text-[var(--ui-fg-muted)]">
          Sign in is not connected in this local shell yet.
        </p>
        <Link
          href="/chat"
          className="mt-3 inline-flex h-[var(--ui-control-h)] items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 text-[length:var(--fs-md)] font-[var(--weight-strong)] hover:border-[var(--ui-border-hover)] hover:bg-[var(--ui-hover)]"
        >
          Return to app
        </Link>
      </section>
    </main>
  );
}
