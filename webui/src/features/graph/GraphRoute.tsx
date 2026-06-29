import { Maximize2, Network, RefreshCw, SlidersHorizontal, ZoomIn, ZoomOut } from "lucide-react";

import { RoutePageShell } from "@/components/shared/RoutePageShell";

const controls = [
  { label: "Refresh graph", icon: RefreshCw },
  { label: "Zoom in", icon: ZoomIn },
  { label: "Zoom out", icon: ZoomOut },
  { label: "Graph settings", icon: SlidersHorizontal },
  { label: "Fullscreen graph", icon: Maximize2 },
];

export function GraphRoute({ compatibility = false }: { compatibility?: boolean }) {
  return (
    <RoutePageShell
      headingId="knowledge-graph-heading"
      title="Knowledge Graph"
      controlsLabel="Knowledge Graph controls"
      contentLayout="fill"
      trailing={
        compatibility ? (
          <span className="font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">/database-visualize</span>
        ) : null
      }
    >
      <div
        data-testid="graph-route"
        className="relative h-full min-h-[320px] overflow-hidden rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-panel)]"
      >
        <div className="absolute inset-0 opacity-70" aria-hidden>
          <div className="absolute left-[18%] top-[22%] h-2 w-2 rounded-[var(--rad-full)] bg-[var(--ui-accent)]" />
          <div className="absolute left-[44%] top-[34%] h-2 w-2 rounded-[var(--rad-full)] bg-[var(--ui-fg-muted)]" />
          <div className="absolute left-[62%] top-[58%] h-2 w-2 rounded-[var(--rad-full)] bg-[var(--ui-accent)]" />
          <div className="absolute left-[31%] top-[68%] h-2 w-2 rounded-[var(--rad-full)] bg-[var(--ui-fg-subtle)]" />
          <div className="absolute left-[18%] top-[calc(22%+4px)] h-px w-[28%] origin-left rotate-[16deg] bg-[var(--ui-border-hover)]" />
          <div className="absolute left-[44%] top-[calc(34%+4px)] h-px w-[25%] origin-left rotate-[35deg] bg-[var(--ui-border-hover)]" />
          <div className="absolute left-[31%] top-[calc(68%+4px)] h-px w-[32%] origin-left -rotate-[15deg] bg-[var(--ui-border-hover)]" />
        </div>

        <div className="absolute right-2 top-2 z-10 flex flex-col overflow-hidden rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-popover)]">
          {controls.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              disabled
              aria-label={label}
              title={label}
              className="inline-flex h-8 w-8 items-center justify-center border-b border-[var(--ui-border)] text-[var(--ui-fg-muted)] last:border-b-0"
            >
              <Icon aria-hidden size={14} />
            </button>
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center px-4 text-center">
          <div className="rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-bg)]/90 px-4 py-3">
            <Network aria-hidden size={17} className="mx-auto mb-2 text-[var(--ui-fg-muted)]" />
            <p className="m-0 text-[length:var(--fs-lg)] font-[var(--weight-medium)]">Graph data is not loaded yet</p>
            <p className="mt-1 max-w-[420px] text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
              Entity nodes, relationship edges, controls, and detail panels will occupy this canvas.
            </p>
          </div>
        </div>
      </div>
    </RoutePageShell>
  );
}
