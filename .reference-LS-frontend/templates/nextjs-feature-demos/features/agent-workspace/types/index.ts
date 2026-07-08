/* Types shaped after features/agent/* contracts (runtime-schema.ts,
   session-contracts.ts, workspace/layout.ts, tools/types.ts) so the fixture
   stream and a future FastAPI backend speak the same event grammar. */

/* ── Runtime SSE contract (GET /api/agent/runtime/events) ── */

export interface RuntimeStatusFrame {
  type: "status";
  phase?: string;
  session?: {
    active: boolean;
    running: boolean;
    piSessionId: string | null;
    modelId: string | null;
    contextUsage?: { tokens: number; contextWindow: number; percent: number };
  };
}

export type PiEvent =
  | { type: "message_start"; messageId: string }
  | {
      type: "message_update";
      messageId: string;
      assistantMessageEvent:
        | { type: "text_delta"; delta: string }
        | { type: "thinking_delta"; delta: string }
        | { type: "toolcall_start"; toolCallId: string; toolName: string }
        | { type: "toolcall_end"; toolCallId: string };
    }
  | { type: "message_end"; messageId: string; usage?: { tokens: number } }
  | { type: "tool_execution_start"; toolCallId: string; toolName: string; args: string }
  | { type: "tool_execution_end"; toolCallId: string; status: "done" | "error"; output: string }
  | { type: "agent_end" }
  | { type: "compaction_end"; result: string | null }
  | { type: "queue_update"; followUp: string[] };

export interface RuntimePiFrame {
  type: "pi";
  seq?: number;
  event: PiEvent;
}

export type RuntimeSseFrame = RuntimeStatusFrame | RuntimePiFrame;

/* ── Timeline blocks ── */

export type BlockKind = "text" | "thinking" | "tool" | "event";

export interface TimelineBlock {
  id: string;
  kind: BlockKind;
  text: string;
  toolName?: string;
  toolStatus?: "running" | "done" | "error";
}

export interface WorkspaceMessage {
  id: string;
  role: "user" | "assistant";
  blocks: TimelineBlock[];
}

/* ── Workspace layout tree (workspace/layout.ts) ── */

export type PaneLayout =
  | { type: "leaf"; paneId: string; sessionId: string }
  | {
      type: "split";
      direction: "vertical" | "horizontal";
      ratio: number;
      a: PaneLayout;
      b: PaneLayout;
    };

/* ── Computer panel (tools/types.ts) ── */

export const COMPUTER_TAB_IDS = [
  "status",
  "tools",
  "canvas",
  "side-chat",
  "browser",
  "files",
  "diff",
  "terminal",
  "plan",
] as const;

export type ComputerTab = (typeof COMPUTER_TAB_IDS)[number];

/* ── Sessions / projects ── */

export interface AgentProject {
  id: string;
  name: string;
  path: string;
}

export interface AgentSession {
  id: string;
  title: string;
  projectId: string;
  modelId: string;
  turns: number;
  updatedAt: number;
  running: boolean;
  cwd: string;
  gitBranch: string;
  gitSummary: string;
  tokens: number;
  contextWindow: number;
}

/* ── Computer tab payloads ── */

export interface PlanTask {
  id: string;
  label: string;
  done: boolean;
}

export interface GitDiffFile {
  path: string;
  additions: number;
  deletions: number;
  hunks: string[];
}

export interface FsNode {
  name: string;
  path: string;
  kind: "dir" | "file";
  children?: FsNode[];
}

export interface ModelOption {
  id: string;
  label: string;
  provider: string;
  reasoning: boolean;
  vision: boolean;
  running: boolean;
}

export interface ContextChip {
  id: string;
  prefix: "@" | "$" | "/";
  label: string;
}

export interface QueueItem {
  id: string;
  mode: "steer" | "queue";
  text: string;
}

export type WorkspaceView = "workspace" | "sessions";
