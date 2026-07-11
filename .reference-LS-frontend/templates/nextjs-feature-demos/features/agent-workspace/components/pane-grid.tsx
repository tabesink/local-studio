"use client";

import { useCallback, useRef } from "react";
import { cx } from "../../../_shared/ui";
import type { AgentWorkspaceModel } from "../hooks/use-agent-workspace";
import type { PaneLayout } from "../types";
import { ChatPane } from "./chat-pane";

/* Pane grid — mirrors workspace/layout.ts + agent-workspace-shell.tsx: a
   binary split tree (vertical = side by side, horizontal = stacked) with
   draggable separators clamped to 0.15–0.85. */
export function PaneGrid({ model }: { model: AgentWorkspaceModel }) {
  return (
    <div className="flex min-h-0 flex-1">
      <PaneNode node={model.layout} model={model} />
    </div>
  );
}

function PaneNode({ node, model }: { node: PaneLayout; model: AgentWorkspaceModel }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startDrag = useCallback(
    (event: React.PointerEvent, split: Extract<PaneLayout, { type: "split" }>) => {
      event.preventDefault();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const vertical = split.direction === "vertical";

      const onMove = (move: PointerEvent) => {
        const ratio = vertical
          ? (move.clientX - rect.left) / rect.width
          : (move.clientY - rect.top) / rect.height;
        model.resizeSplit(split, ratio);
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [model],
  );

  if (node.type === "leaf") {
    return (
      <div
        className={cx(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          model.leaves.length > 1 && node.paneId === model.focusedPaneId
            ? "ring-1 ring-inset ring-(--border)/70"
            : "",
        )}
        onFocusCapture={() => model.setFocusedPaneId(node.paneId)}
        onPointerDownCapture={() => model.setFocusedPaneId(node.paneId)}
      >
        <ChatPane paneId={node.paneId} sessionId={node.sessionId} model={model} />
      </div>
    );
  }

  const vertical = node.direction === "vertical";
  return (
    <div ref={containerRef} className={cx("flex min-h-0 min-w-0 flex-1", vertical ? "" : "flex-col")}>
      <div
        className={cx("flex min-h-0 min-w-0", vertical ? "" : "flex-col")}
        style={{ flexBasis: `${node.ratio * 100}%`, flexGrow: 0, flexShrink: 1 }}
      >
        <PaneNode node={node.a} model={model} />
      </div>
      <div
        role="separator"
        aria-orientation={vertical ? "vertical" : "horizontal"}
        onPointerDown={(event) => startDrag(event, node)}
        className={cx(
          "shrink-0 bg-(--border)/60 transition-colors hover:bg-(--link)/50",
          vertical ? "w-1 cursor-col-resize" : "h-1 cursor-row-resize",
        )}
      />
      <div className={cx("flex min-h-0 min-w-0 flex-1", vertical ? "" : "flex-col")}>
        <PaneNode node={node.b} model={model} />
      </div>
    </div>
  );
}
