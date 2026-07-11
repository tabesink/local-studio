import Link from "next/link";
import { FEATURES } from "../lib/features";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="space-y-2 border-b border-(--ui-border)/40 pb-5">
        <p className="text-[length:var(--fs-xs)] uppercase tracking-[0.18em] text-(--ui-muted)">
          Local Studio parity
        </p>
        <h1 className="text-[length:var(--fs-2xl)] font-medium">Feature demo playground</h1>
        <p className="max-w-2xl text-[length:var(--fs-base)] text-(--ui-muted)">
          Pick a slice to preview fixture-backed UI. Each route renders one feature from{" "}
          <code className="text-(--ui-fg)">features/</code> with shared tokens and primitives.
        </p>
      </header>

      <ul className="grid gap-2">
        {FEATURES.map((feature) => (
          <li key={feature.slug}>
            <Link
              href={`/features/${feature.slug}`}
              className="block rounded-md border border-(--ui-border)/60 bg-(--ui-surface) px-4 py-3 transition hover:border-(--ui-border) hover:bg-(--ui-hover)"
            >
              <div className="text-[length:var(--fs-lg)] font-medium">{feature.title}</div>
              <div className="mt-1 text-[length:var(--fs-sm)] text-(--ui-muted)">{feature.description}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
