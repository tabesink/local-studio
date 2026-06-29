import type { ReactNode } from "react";

export function FeaturePlaceholder({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string;
  title: string;
  description: string;
  meta?: ReactNode;
}) {
  return (
    <section className="mx-auto flex min-h-full w-full max-w-[900px] items-center px-4 py-8 sm:px-6">
      <div className="w-full rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-panel)]">
        <div className="border-b border-[var(--ui-border)] px-4 py-3">
          <p className="m-0 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">
            {eyebrow}
          </p>
          <h1 className="m-0 mt-1 text-[length:var(--fs-3xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
            {title}
          </h1>
          <p className="mt-2 max-w-[620px] text-[length:var(--fs-md)] leading-[var(--leading)] text-[var(--ui-fg-muted)]">
            {description}
          </p>
        </div>
        <div className="min-h-[var(--row-h)] px-4 py-3 text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
          {meta ?? "No data is available yet."}
        </div>
      </div>
    </section>
  );
}
