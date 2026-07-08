export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  mode: "text" | "data-url" | "metadata";
  content: string;
}

export type AssistantBlock =
  | { kind: "text"; id: string; text: string }
  | { kind: "thinking"; id: string; text: string }
  | { kind: "event"; id: string; text: string }
  | { kind: "tool"; id: string; name: string; status: "running" | "done" | "error"; text: string };

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  attachments?: ChatMessageAttachment[];
  blocks?: AssistantBlock[];
  timestamp?: string;
}

export interface QueuedMessage {
  id: string;
  mode: "steer" | "follow_up";
  text: string;
}

export interface SubmitTurnArgs {
  sessionId: string;
  modelId: string;
  message: string;
  cwd?: string;
  piSessionId?: string | null;
  browserToolEnabled: boolean;
  canvasEnabled?: boolean;
  mode?: "steer" | "follow_up";
}

export interface RuntimeEventPayload {
  type: "status" | "delta" | "done" | "error";
  text?: string;
  error?: string;
}
