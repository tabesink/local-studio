"use client";

import { X } from "lucide-react";
import { cx, SegmentedControl } from "../../../_shared/ui";
import { useAgentWorkspace } from "../hooks/use-agent-workspace";
import type { WorkspaceView } from "../types";
import { ComputerPanel } from "./computer-panel";
import { PaneGrid } from "./pane-grid";
import { SessionsCommand } from "./sessions-command";
import { SessionsPage } from "./sessions-page";

/* Agent workspace — mirrors features/agent/*: the /agent workspace shell
   (pane grid + right computer panel) and the /agent/sessions index page,
   with the ⌘K command palette overlaying both. */
export function AgentWorkspaceDemo() {
  const model = useAgentWorkspace();

  return (
    <div className="flex h-full min-h-0 flex-col bg-(--agent-bg) text-(--fg)">
      {/* Demo-only view switcher (reference: /agent vs /agent/sessions routes). */}
      <div className="flex shrink-0 items-center justify-center gap-2 border-b border-(--border)/40 px-4 py-1.5 text-[length:var(--fs-sm)] text-(--dim)">
        <span>Route</span>
        <SegmentedControl<WorkspaceView>
          size="sm"
          items={[
            { id: "workspace", label: "/agent" },
            { id: "sessions", label: "/agent/sessions" },
          ]}
          value={model.view}
          onChange={model.setView}
        />
        <span className="font-mono text-[length:var(--fs-xs)] text-(--dim)/70">⌘K palette</span>
      </div>

      {model.view === "sessions" ? (
        <SessionsPage model={model} />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Dismissible error / warning overlay banners (agent-workspace-shell). */}
          {model.banner ? (
            <div
              role="alert"
              className={cx(
                "flex items-center gap-3 border-b px-4 py-2 text-[length:var(--fs-sm)]",
                model.banner.tone === "error"
                  ? "border-(--err)/30 bg-(--err)/10 text-(--err)"
                  : "border-(--warn)/30 bg-(--warn)/10 text-(--warn)",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{model.banner.text}</span>
              <button
                type="button"
                onClick={() => model.setBanner(null)}
                aria-label="Dismiss"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-white/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}

          <div className="flex min-h-0 flex-1">
            <PaneGrid model={model} />
            {model.computerOpen ? <ComputerPanel model={model} /> : null}
          </div>
        </div>
      )}

      {model.commandOpen ? <SessionsCommand model={model} /> : null}
    </div>
  );
}
