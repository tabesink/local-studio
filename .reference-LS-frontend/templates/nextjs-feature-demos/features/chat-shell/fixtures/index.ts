import type { ChatMessage, RuntimeEventPayload } from "../types";

export const initialMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    text: "Summarize the feature parity plan and check the template folder layout.",
    timestamp: "15:20",
  },
  {
    id: "m2",
    role: "assistant",
    text: "The plan creates modular Next.js demos backed by typed fixtures.",
    blocks: [
      {
        kind: "thinking",
        id: "b1",
        text: "The user wants a summary plus a folder check. I should list the template structure first, then summarize.",
      },
      {
        kind: "tool",
        id: "b2",
        name: "list_dir",
        status: "done",
        text: "templates/nextjs-feature-demos — 9 feature slices, _shared, demo-app",
      },
      {
        kind: "text",
        id: "b3",
        text: "The plan creates modular Next.js demos backed by typed fixtures. Each of the nine slices keeps the components/hooks/api/types/fixtures contract, and the shared package carries the Local Studio tokens and primitives.",
      },
    ],
    timestamp: "15:21",
  },
];

export const streamEvents: RuntimeEventPayload[] = [
  { type: "status", text: "starting" },
  { type: "delta", text: "I will keep the demo slice focused " },
  { type: "delta", text: "on the chat shell: timeline, composer, queue, and stream states." },
  { type: "done" },
];

export const chatSessionMeta = {
  title: "Feature parity planning",
  model: "Qwen2.5 Coder 14B",
  models: ["Qwen2.5 Coder 14B", "Llama 3.3 70B AWQ", "GPT-OSS 20B"],
  branch: "main",
  cwd: "~/work/templates_local_studio",
  gitStatus: "main · 2 modified",
  tokens: "12.4k tokens",
};
