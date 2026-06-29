import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function ForbiddenState({
  title = "Forbidden",
  description = "Your current role does not include access to this area.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="flex min-h-full items-center justify-center px-4 py-8">
      <div className="w-full max-w-[520px] rounded-[var(--rad-xl)] border border-[var(--ui-border)] bg-[var(--ui-panel)]">
        <div className="flex items-start gap-3 border-b border-[var(--ui-border)] px-4 py-3">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-warn)]">
            <ShieldAlert aria-hidden size={15} />
          </span>
          <div className="min-w-0">
            <h1 className="m-0 text-[length:var(--fs-2xl)] font-[var(--weight-medium)] leading-[var(--leading-tight)]">
              {title}
            </h1>
            <p className="mt-1 text-[length:var(--fs-md)] leading-[var(--leading)] text-[var(--ui-fg-muted)]">
              {description}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end px-4 py-3">
          <Link
            href="/chat"
            className="inline-flex h-[var(--ui-control-h)] items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-3 text-[length:var(--fs-md)] font-[var(--weight-strong)] text-[var(--ui-fg)] hover:border-[var(--ui-border-hover)] hover:bg-[var(--ui-hover)]"
          >
            Back to Chat
          </Link>
        </div>
      </div>
    </section>
  );
}
