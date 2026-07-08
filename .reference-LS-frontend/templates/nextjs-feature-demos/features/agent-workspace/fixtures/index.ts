import type {
  AgentProject,
  AgentSession,
  ContextChip,
  FsNode,
  GitDiffFile,
  ModelOption,
  PiEvent,
  PlanTask,
  WorkspaceMessage,
} from "../types";

const now = Date.now();
const minutes = (n: number) => now - n * 60_000;

export const projectFixtures: AgentProject[] = [
  { id: "chats", name: "Chats", path: "~" },
  { id: "proj-local-studio", name: "local-studio", path: "~/code/local-studio" },
  { id: "proj-inference-lab", name: "inference-lab", path: "~/code/inference-lab" },
];

export const sessionFixtures: AgentSession[] = [
  {
    id: "sess-usage-panel",
    title: "Wire usage panel to live telemetry",
    projectId: "proj-local-studio",
    modelId: "qwen3-32b-awq",
    turns: 14,
    updatedAt: minutes(2),
    running: true,
    cwd: "~/code/local-studio",
    gitBranch: "feat/usage-telemetry",
    gitSummary: "+214 -38 · 6 files",
    tokens: 41_230,
    contextWindow: 131_072,
  },
  {
    id: "sess-kv-cache",
    title: "Debug KV cache eviction on tp=2",
    projectId: "proj-inference-lab",
    modelId: "deepseek-r1-distill-14b",
    turns: 31,
    updatedAt: minutes(48),
    running: false,
    cwd: "~/code/inference-lab",
    gitBranch: "main",
    gitSummary: "+12 -4 · 2 files",
    tokens: 88_410,
    contextWindow: 131_072,
  },
  {
    id: "sess-benchmark-sweep",
    title: "Benchmark sweep across quant levels",
    projectId: "proj-inference-lab",
    modelId: "qwen3-32b-awq",
    turns: 9,
    updatedAt: minutes(190),
    running: false,
    cwd: "~/code/inference-lab",
    gitBranch: "bench/quant-sweep",
    gitSummary: "clean",
    tokens: 22_050,
    contextWindow: 131_072,
  },
  {
    id: "sess-release-notes",
    title: "Draft 0.9.2 release notes",
    projectId: "chats",
    modelId: "phi-4-mini",
    turns: 4,
    updatedAt: minutes(1500),
    running: false,
    cwd: "~",
    gitBranch: "-",
    gitSummary: "-",
    tokens: 6_180,
    contextWindow: 131_072,
  },
];

export const initialMessagesBySession: Record<string, WorkspaceMessage[]> = {
  "sess-usage-panel": [
    {
      id: "m1",
      role: "user",
      blocks: [
        {
          id: "m1-t",
          kind: "text",
          text: "Wire the usage panel to the live telemetry endpoint and keep the daily chart in sync.",
        },
      ],
    },
    {
      id: "m2",
      role: "assistant",
      blocks: [
        {
          id: "m2-think",
          kind: "thinking",
          text: "The usage page polls /stats today. Switching to the SSE telemetry stream means subscribing in the hook and reducing frames into the same UsageStats shape.",
        },
        {
          id: "m2-tool",
          kind: "tool",
          text: "frontend/src/features/usage/use-usage.ts",
          toolName: "read_file",
          toolStatus: "done",
        },
        {
          id: "m2-text",
          kind: "text",
          text: "The hook already isolates fetching in `loadStats()`. I'll add an EventSource subscription behind the same reducer so the chart re-renders per frame without layout shift.",
        },
      ],
    },
  ],
  "sess-kv-cache": [
    {
      id: "k1",
      role: "user",
      blocks: [
        {
          id: "k1-t",
          kind: "text",
          text: "vLLM keeps evicting KV blocks at tp=2 even with gpu_memory_utilization at 0.92. Find out why.",
        },
      ],
    },
  ],
  "sess-benchmark-sweep": [],
  "sess-release-notes": [],
};

/* Fixture Pi event stream — same event grammar the FastAPI backend must emit
   inside `{"type":"pi","event":...}` SSE frames. */
export function buildTurnEvents(messageId: string): PiEvent[] {
  return [
    { type: "message_start", messageId },
    {
      type: "message_update",
      messageId,
      assistantMessageEvent: {
        type: "thinking_delta",
        delta: "Checking scheduler logs for preemption causes before touching config...",
      },
    },
    {
      type: "message_update",
      messageId,
      assistantMessageEvent: {
        type: "toolcall_start",
        toolCallId: `${messageId}-tc1`,
        toolName: "run_terminal_cmd",
      },
    },
    {
      type: "tool_execution_start",
      toolCallId: `${messageId}-tc1`,
      toolName: "run_terminal_cmd",
      args: "grep -n 'preempt' logs/vllm-controller.log | tail -5",
    },
    {
      type: "tool_execution_end",
      toolCallId: `${messageId}-tc1`,
      status: "done",
      output: "12:19:41 scheduler: preempted seq_group 41 (blocks=118) reason=kv_pressure",
    },
    {
      type: "message_update",
      messageId,
      assistantMessageEvent: {
        type: "text_delta",
        delta: "The scheduler is preempting under KV pressure. ",
      },
    },
    {
      type: "message_update",
      messageId,
      assistantMessageEvent: {
        type: "text_delta",
        delta: "With tp=2 each rank only holds half the cache, so the effective per-rank budget drops below the burst working set. Raising `max_num_seqs` down to 128 or enabling prefix caching keeps the hot set resident.",
      },
    },
    { type: "message_end", messageId, usage: { tokens: 412 } },
    { type: "agent_end" },
  ];
}

export const planMarkdownFixture = `# Usage telemetry plan

- [x] Map current /stats polling path
- [x] Define SSE frame reducer
- [ ] Subscribe EventSource in use-usage.ts
- [ ] Reconcile daily chart buckets on frame
- [ ] Delete polling fallback after soak
`;

export const planTasksFixture: PlanTask[] = [
  { id: "p1", label: "Map current /stats polling path", done: true },
  { id: "p2", label: "Define SSE frame reducer", done: true },
  { id: "p3", label: "Subscribe EventSource in use-usage.ts", done: false },
  { id: "p4", label: "Reconcile daily chart buckets on frame", done: false },
  { id: "p5", label: "Delete polling fallback after soak", done: false },
];

export const gitDiffFixture: GitDiffFile[] = [
  {
    path: "frontend/src/features/usage/use-usage.ts",
    additions: 64,
    deletions: 18,
    hunks: [
      "@@ -41,9 +41,21 @@ export function useUsage() {",
      "-  const stats = await api.getStats(source);",
      "-  setStats(stats);",
      "+  const eventSource = new EventSource(`/api/usage/stream?source=${source}`);",
      "+  eventSource.onmessage = (frame) => {",
      "+    dispatch({ type: \"frame\", payload: JSON.parse(frame.data) });",
      "+  };",
    ],
  },
  {
    path: "frontend/src/features/usage/usage-page.tsx",
    additions: 22,
    deletions: 9,
    hunks: [
      "@@ -128,7 +128,10 @@ export function UsagePage() {",
      "-  <DailyUsageChart data={stats.daily} />",
      "+  <DailyUsageChart data={stats.daily} live={stream.connected} />",
    ],
  },
];

export const fsTreeFixture: FsNode[] = [
  {
    name: "frontend",
    path: "frontend",
    kind: "dir",
    children: [
      {
        name: "src/features/usage",
        path: "frontend/src/features/usage",
        kind: "dir",
        children: [
          { name: "use-usage.ts", path: "frontend/src/features/usage/use-usage.ts", kind: "file" },
          {
            name: "usage-page.tsx",
            path: "frontend/src/features/usage/usage-page.tsx",
            kind: "file",
          },
          {
            name: "daily-usage-chart.tsx",
            path: "frontend/src/features/usage/daily-usage-chart.tsx",
            kind: "file",
          },
        ],
      },
    ],
  },
  {
    name: "controller",
    path: "controller",
    kind: "dir",
    children: [
      { name: "src/main.ts", path: "controller/src/main.ts", kind: "file" },
      { name: "src/usage-stream.ts", path: "controller/src/usage-stream.ts", kind: "file" },
    ],
  },
];

export const fileContentsFixture: Record<string, string> = {
  "frontend/src/features/usage/use-usage.ts": `export function useUsage(source: UsageSource) {
  const [stats, dispatch] = useReducer(usageReducer, EMPTY_STATS);

  useEffect(() => {
    const eventSource = new EventSource(\`/api/usage/stream?source=\${source}\`);
    eventSource.onmessage = (frame) => {
      dispatch({ type: "frame", payload: JSON.parse(frame.data) });
    };
    return () => eventSource.close();
  }, [source]);

  return stats;
}`,
  "controller/src/usage-stream.ts": `export function usageStream(req: Request): Response {
  const stream = new ReadableStream({
    start(controller) {
      const timer = setInterval(() => {
        controller.enqueue(encodeFrame(collectUsage()));
      }, 2000);
      req.signal.addEventListener("abort", () => clearInterval(timer));
    },
  });
  return sseResponse(stream);
}`,
};

export const terminalScrollbackFixture: string[] = [
  "$ npm run typecheck",
  "",
  "> local-studio@0.9.2 typecheck",
  "> tsc --noEmit",
  "",
  "$ grep -n 'preempt' logs/vllm-controller.log | tail -3",
  "12:19:41 scheduler: preempted seq_group 41 (blocks=118) reason=kv_pressure",
  "12:19:44 scheduler: resumed seq_group 41 after 2 iterations",
  "12:20:02 scheduler: preempted seq_group 47 (blocks=96) reason=kv_pressure",
  "$ █",
];

export const browserFixture = {
  url: "http://127.0.0.1:3000/usage",
  title: "Local Studio — Usage",
};

export const modelOptionsFixture: ModelOption[] = [
  {
    id: "qwen3-32b-awq",
    label: "qwen3-32b-awq",
    provider: "Local",
    reasoning: true,
    vision: false,
    running: true,
  },
  {
    id: "deepseek-r1-distill-14b",
    label: "deepseek-r1-distill-14b",
    provider: "Local",
    reasoning: true,
    vision: false,
    running: false,
  },
  {
    id: "phi-4-mini",
    label: "phi-4-mini",
    provider: "Local",
    reasoning: false,
    vision: false,
    running: false,
  },
];

export const contextChipsFixture: ContextChip[] = [
  { id: "chip-fs", prefix: "@", label: "filesystem" },
  { id: "chip-review", prefix: "$", label: "code-review" },
  { id: "chip-plan", prefix: "/", label: "plan" },
];

export const canvasDefaultText = `# Scratchboard

Frames arrive every 2s; chart buckets keyed by day.
Preemption threshold: blocks < 128 → evict cold sequences first.
`;
