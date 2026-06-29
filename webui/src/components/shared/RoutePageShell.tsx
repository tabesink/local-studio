import type { ReactNode } from "react";

import { cx } from "@/components/shared/cx";

export function RoutePageShell({
  headingId,
  title,
  controlsLabel,
  contentLayout = "scroll",
  trailing,
  children,
  aside,
}: {
  headingId: string;
  title: string;
  controlsLabel: string;
  contentLayout?: "scroll" | "fill";
  trailing?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  const fill = contentLayout === "fill";

  return (
    <main data-testid="route-work-surface" className="flex h-full min-h-0 bg-[var(--ui-bg)]">
      <section
        aria-labelledby={headingId}
        className={cx(
          "min-h-0 min-w-0 flex-1 flex-col",
          fill ? "flex overflow-hidden" : "flex overflow-auto pb-6",
        )}
      >
        <header className="shrink-0 px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="mb-5 flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <h1
              id={headingId}
              className="m-0 text-[length:var(--fs-3xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)] text-[var(--ui-fg)]"
            >
              {title}
            </h1>
            {trailing}
          </div>
          <div
            role="region"
            aria-label={controlsLabel}
            className="mb-5 flex min-h-9 flex-wrap items-center gap-2"
          >
            <span className="inline-flex h-[var(--ui-control-h)] items-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-2 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-muted)]">
              Domain unavailable
            </span>
            <span className="inline-flex h-[var(--ui-control-h)] items-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-surface)] px-2 text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">
              Waiting for backend data
            </span>
          </div>
        </header>
        <div className={cx("min-h-0 flex-1 px-5 sm:px-6", fill ? "overflow-hidden pb-6" : "")}>{children}</div>
      </section>
      {aside}
    </main>
  );
}
