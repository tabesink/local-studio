import { FileText, Search, Upload } from "lucide-react";

import { RoutePageShell } from "@/components/shared/RoutePageShell";

const columns = ["Name", "Status", "Updated", "Domain"];

export function DocumentRoute() {
  return (
    <RoutePageShell
      headingId="document-library-heading"
      title="Documents"
      controlsLabel="Document library controls"
      trailing={
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled
            aria-label="Search documents"
            className="inline-flex h-[var(--ui-control-h)] w-[var(--ui-control-h)] items-center justify-center rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-input)] text-[var(--ui-fg-subtle)]"
          >
            <Search aria-hidden size={14} />
          </button>
          <button
            type="button"
            disabled
            aria-label="Upload document"
            className="inline-flex h-[var(--ui-control-h)] items-center gap-2 rounded-[var(--rad-md)] border border-[var(--ui-border)] bg-[var(--ui-input)] px-2 text-[length:var(--fs-md)] font-[var(--weight-strong)] text-[var(--ui-fg-subtle)]"
          >
            <Upload aria-hidden size={14} />
            Upload
          </button>
        </div>
      }
    >
      <div
        data-testid="documents-route"
        role="region"
        aria-labelledby="document-library-heading"
        className="overflow-hidden rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-panel)]"
      >
        <div className="grid h-[var(--row-h)] grid-cols-[minmax(220px,1.6fr)_minmax(96px,0.6fr)_minmax(120px,0.8fr)_minmax(120px,0.8fr)] items-center border-b border-[var(--ui-border)] bg-[var(--ui-surface)] px-3 font-mono text-[length:var(--fs-xs)] text-[var(--ui-fg-subtle)]">
          {columns.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-4 py-8 text-center">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--rad-lg)] border border-[var(--ui-border)] bg-[var(--ui-surface)] text-[var(--ui-fg-muted)]">
            <FileText aria-hidden size={16} />
          </span>
          <div>
            <p className="m-0 text-[length:var(--fs-lg)] font-[var(--weight-medium)]">No documents loaded</p>
            <p className="mt-1 max-w-[440px] text-[length:var(--fs-md)] text-[var(--ui-fg-muted)]">
              Uploaded documents, indexing state, and metadata will render in this library table.
            </p>
          </div>
        </div>
      </div>
    </RoutePageShell>
  );
}
