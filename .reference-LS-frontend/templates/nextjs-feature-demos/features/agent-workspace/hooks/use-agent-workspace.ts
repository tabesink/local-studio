"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as api from "../api";
import {
  COMPUTER_DEFAULT_WIDTH,
  COMPUTER_TAB_STORAGE_KEY,
  COMPUTER_WIDTH_STORAGE_KEY,
  PANE_STATE_STORAGE_KEY,
  SPLIT_RATIO_MAX,
  SPLIT_RATIO_MIN,
} from "../constants";
import {
  canvasDefaultText,
  initialMessagesBySession,
  planTasksFixture,
  sessionFixtures,
} from "../fixtures";
import type {
  AgentSession,
  ComputerTab,
  PaneLayout,
  PiEvent,
  PlanTask,
  QueueItem,
  TimelineBlock,
  WorkspaceMessage,
  WorkspaceView,
} from "../types";

let paneCounter = 1;
function nextPaneId(): string {
  paneCounter += 1;
  return `pane-${paneCounter}`;
}

function collectLeaves(layout: PaneLayout): Array<Extract<PaneLayout, { type: "leaf" }>> {
  if (layout.type === "leaf") return [layout];
  return [...collectLeaves(layout.a), ...collectLeaves(layout.b)];
}

function removeLeaf(layout: PaneLayout, paneId: string): PaneLayout | null {
  if (layout.type === "leaf") return layout.paneId === paneId ? null : layout;
  const a = removeLeaf(layout.a, paneId);
  const b = removeLeaf(layout.b, paneId);
  if (a && b) return { ...layout, a, b };
  return a ?? b;
}

function splitLeaf(
  layout: PaneLayout,
  paneId: string,
  direction: "vertical" | "horizontal",
  newLeaf: PaneLayout,
): PaneLayout {
  if (layout.type === "leaf") {
    if (layout.paneId !== paneId) return layout;
    return { type: "split", direction, ratio: 0.5, a: layout, b: newLeaf };
  }
  return {
    ...layout,
    a: splitLeaf(layout.a, paneId, direction, newLeaf),
    b: splitLeaf(layout.b, paneId, direction, newLeaf),
  };
}

function setRatio(layout: PaneLayout, target: PaneLayout, ratio: number): PaneLayout {
  if (layout === target && layout.type === "split") {
    return { ...layout, ratio: Math.min(SPLIT_RATIO_MAX, Math.max(SPLIT_RATIO_MIN, ratio)) };
  }
  if (layout.type === "leaf") return layout;
  return {
    ...layout,
    a: setRatio(layout.a, target, ratio),
    b: setRatio(layout.b, target, ratio),
  };
}

/* Applies a Pi event to the assistant message under construction — a
   simplified port of runtime/pi-event-applier.ts. */
function applyPiEvent(blocks: TimelineBlock[], event: PiEvent, messageId: string): TimelineBlock[] {
  switch (event.type) {
    case "message_update": {
      const inner = event.assistantMessageEvent;
      if (inner.type === "text_delta") {
        const last = blocks.at(-1);
        if (last?.kind === "text") {
          return [...blocks.slice(0, -1), { ...last, text: last.text + inner.delta }];
        }
        return [...blocks, { id: `${messageId}-text-${blocks.length}`, kind: "text", text: inner.delta }];
      }
      if (inner.type === "thinking_delta") {
        const last = blocks.at(-1);
        if (last?.kind === "thinking") {
          return [...blocks.slice(0, -1), { ...last, text: last.text + inner.delta }];
        }
        return [
          ...blocks,
          { id: `${messageId}-think-${blocks.length}`, kind: "thinking", text: inner.delta },
        ];
      }
      return blocks;
    }
    case "tool_execution_start":
      return [
        ...blocks,
        {
          id: event.toolCallId,
          kind: "tool",
          text: event.args,
          toolName: event.toolName,
          toolStatus: "running",
        },
      ];
    case "tool_execution_end":
      return blocks.map((block) =>
        block.id === event.toolCallId
          ? { ...block, toolStatus: event.status, text: event.output }
          : block,
      );
    case "compaction_end":
      return [
        ...blocks,
        {
          id: `${messageId}-compact-${blocks.length}`,
          kind: "event",
          text: event.result ?? "Context compacted",
        },
      ];
    default:
      return blocks;
  }
}

export function useAgentWorkspace() {
  const [view, setView] = useState<WorkspaceView>("workspace");
  const [sessions, setSessions] = useState<AgentSession[]>(sessionFixtures);
  const [messagesBySession, setMessagesBySession] = useState<Record<string, WorkspaceMessage[]>>(
    () => structuredClone(initialMessagesBySession),
  );
  const [runningSessionId, setRunningSessionId] = useState<string | null>(null);

  const [layout, setLayout] = useState<PaneLayout>({
    type: "leaf",
    paneId: "pane-1",
    sessionId: "sess-usage-panel",
  });
  const [focusedPaneId, setFocusedPaneId] = useState("pane-1");

  const [computerOpen, setComputerOpen] = useState(true);
  const [computerTab, setComputerTab] = useState<ComputerTab>("status");
  const [computerWidth, setComputerWidth] = useState(COMPUTER_DEFAULT_WIDTH);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [planTasks, setPlanTasks] = useState<PlanTask[]>(planTasksFixture);
  const [canvasText, setCanvasText] = useState(canvasDefaultText);
  const [compacting, setCompacting] = useState(false);
  const [banner, setBanner] = useState<{ tone: "error" | "warning"; text: string } | null>(null);

  const [commandOpen, setCommandOpen] = useState(false);
  const [showReasoning, setShowReasoning] = useState(true);

  const streamToken = useRef(0);

  /* Persisted UI state (pane layout, computer width/tab). */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PANE_STATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { layout?: PaneLayout; focusedPaneId?: string };
        if (parsed.layout) setLayout(parsed.layout);
        if (parsed.focusedPaneId) setFocusedPaneId(parsed.focusedPaneId);
      }
      const width = window.localStorage.getItem(COMPUTER_WIDTH_STORAGE_KEY);
      if (width) setComputerWidth(Number(width) || COMPUTER_DEFAULT_WIDTH);
      const tab = window.localStorage.getItem(COMPUTER_TAB_STORAGE_KEY) as ComputerTab | null;
      if (tab) setComputerTab(tab);
    } catch {
      /* storage unavailable */
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        PANE_STATE_STORAGE_KEY,
        JSON.stringify({ version: 1, layout, focusedPaneId }),
      );
    } catch {
      /* storage unavailable */
    }
  }, [layout, focusedPaneId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMPUTER_WIDTH_STORAGE_KEY, String(computerWidth));
      window.localStorage.setItem(COMPUTER_TAB_STORAGE_KEY, computerTab);
    } catch {
      /* storage unavailable */
    }
  }, [computerWidth, computerTab]);

  /* Cmd/Ctrl+K command palette. */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
      if (event.key === "Escape") setCommandOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const leaves = useMemo(() => collectLeaves(layout), [layout]);
  const focusedLeaf = leaves.find((leaf) => leaf.paneId === focusedPaneId) ?? leaves[0];
  const focusedSession =
    sessions.find((session) => session.id === focusedLeaf?.sessionId) ?? sessions[0];

  const openSessionInPane = useCallback((paneId: string, sessionId: string) => {
    setLayout((current) => {
      const patch = (node: PaneLayout): PaneLayout => {
        if (node.type === "leaf") return node.paneId === paneId ? { ...node, sessionId } : node;
        return { ...node, a: patch(node.a), b: patch(node.b) };
      };
      return patch(current);
    });
    setFocusedPaneId(paneId);
  }, []);

  const forkPane = useCallback(
    (paneId: string) => {
      const leaf = leaves.find((node) => node.paneId === paneId);
      if (!leaf) return;
      const newLeaf: PaneLayout = {
        type: "leaf",
        paneId: nextPaneId(),
        sessionId: leaf.sessionId,
      };
      setLayout((current) => splitLeaf(current, paneId, "vertical", newLeaf));
      if (newLeaf.type === "leaf") setFocusedPaneId(newLeaf.paneId);
    },
    [leaves],
  );

  const closePane = useCallback(
    (paneId: string) => {
      if (leaves.length <= 1) return;
      setLayout((current) => removeLeaf(current, paneId) ?? current);
      setFocusedPaneId((currentFocus) => {
        if (currentFocus !== paneId) return currentFocus;
        const remaining = leaves.filter((leaf) => leaf.paneId !== paneId);
        return remaining[0]?.paneId ?? currentFocus;
      });
    },
    [leaves],
  );

  const resizeSplit = useCallback((target: PaneLayout, ratio: number) => {
    setLayout((current) => setRatio(current, target, ratio));
  }, []);

  const submitTurn = useCallback(
    async (sessionId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed || runningSessionId) return;

      const token = ++streamToken.current;
      const userId = `u-${Date.now().toString(36)}`;
      const assistantId = `a-${Date.now().toString(36)}`;

      setMessagesBySession((current) => ({
        ...current,
        [sessionId]: [
          ...(current[sessionId] ?? []),
          { id: userId, role: "user", blocks: [{ id: `${userId}-t`, kind: "text", text: trimmed }] },
        ],
      }));
      setRunningSessionId(sessionId);
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId
            ? { ...session, running: true, turns: session.turns + 1, updatedAt: Date.now() }
            : session,
        ),
      );

      for await (const frame of api.streamTurn(sessionId, assistantId)) {
        if (token !== streamToken.current) return;
        if (frame.type !== "pi") continue;
        const event = frame.event;
        if (event.type === "message_start") {
          setMessagesBySession((current) => ({
            ...current,
            [sessionId]: [
              ...(current[sessionId] ?? []),
              { id: assistantId, role: "assistant", blocks: [] },
            ],
          }));
          continue;
        }
        if (event.type === "agent_end") break;
        if (event.type === "message_end") continue;
        setMessagesBySession((current) => ({
          ...current,
          [sessionId]: (current[sessionId] ?? []).map((message) =>
            message.id === assistantId
              ? { ...message, blocks: applyPiEvent(message.blocks, event, assistantId) }
              : message,
          ),
        }));
      }

      setRunningSessionId(null);
      setSessions((current) =>
        current.map((session) =>
          session.id === sessionId ? { ...session, running: false, updatedAt: Date.now() } : session,
        ),
      );

      /* Drain the follow-up queue (reference: queue_update reconciliation). */
      setQueue((currentQueue) => {
        const [next, ...rest] = currentQueue;
        if (next) window.setTimeout(() => void submitTurn(sessionId, next.text), 400);
        return rest;
      });
    },
    [runningSessionId],
  );

  const abortTurn = useCallback(async () => {
    streamToken.current += 1;
    if (runningSessionId) {
      await api.abortTurn(runningSessionId);
      setSessions((current) =>
        current.map((session) =>
          session.id === runningSessionId ? { ...session, running: false } : session,
        ),
      );
    }
    setRunningSessionId(null);
  }, [runningSessionId]);

  const queueMessage = useCallback((text: string, mode: "steer" | "queue") => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setQueue((current) => [...current, { id: `q-${Date.now().toString(36)}`, mode, text: trimmed }]);
  }, []);

  const removeQueued = useCallback((id: string) => {
    setQueue((current) => current.filter((item) => item.id !== id));
  }, []);

  const compact = useCallback(async () => {
    if (!focusedSession) return;
    setCompacting(true);
    const result = await api.compactSession(focusedSession.id);
    setMessagesBySession((current) => ({
      ...current,
      [focusedSession.id]: [
        ...(current[focusedSession.id] ?? []),
        {
          id: `compact-${Date.now().toString(36)}`,
          role: "assistant",
          blocks: [{ id: `compact-${Date.now().toString(36)}-e`, kind: "event", text: result.message }],
        },
      ],
    }));
    setCompacting(false);
  }, [focusedSession]);

  const togglePlanTask = useCallback((taskId: string) => {
    setPlanTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    );
  }, []);

  return {
    view,
    setView,

    sessions,
    messagesBySession,
    runningSessionId,

    layout,
    leaves,
    focusedPaneId,
    setFocusedPaneId,
    focusedSession,
    openSessionInPane,
    forkPane,
    closePane,
    resizeSplit,

    computerOpen,
    setComputerOpen,
    computerTab,
    setComputerTab,
    computerWidth,
    setComputerWidth,

    submitTurn,
    abortTurn,
    queue,
    queueMessage,
    removeQueued,
    compact,
    compacting,

    planTasks,
    togglePlanTask,
    canvasText,
    setCanvasText,

    banner,
    setBanner,
    commandOpen,
    setCommandOpen,
    showReasoning,
    setShowReasoning,
  };
}

export type AgentWorkspaceModel = ReturnType<typeof useAgentWorkspace>;
