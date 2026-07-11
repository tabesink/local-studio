"use client";

import { useState } from "react";
import { DEFAULT_MODEL_ID, DEFAULT_SESSION_ID } from "../constants";
import { abortTurn, submitTurn, subscribeMockRuntimeEvents } from "../api";
import { initialMessages } from "../fixtures";
import type { ChatMessage, QueuedMessage } from "../types";

const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

export function useChatShell() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const [attachments, setAttachments] = useState<string[]>([]);

  async function sendMessage(text = input) {
    const trimmed = text.trim();
    if (!trimmed || running) return;
    setError("");
    setRunning(true);
    setInput("");
    const assistantId = newId("assistant");
    setMessages((current) => [
      ...current,
      { id: newId("user"), role: "user", text: trimmed, timestamp: "now" },
      { id: assistantId, role: "assistant", text: "", blocks: [], timestamp: "now" },
    ]);
    const result = await submitTurn({
      sessionId: DEFAULT_SESSION_ID,
      modelId: DEFAULT_MODEL_ID,
      message: trimmed,
      browserToolEnabled: false,
    });
    if (result.outcome === "rejected") {
      setError(result.error ?? "Agent request was rejected");
      setRunning(false);
      return;
    }
    for await (const event of subscribeMockRuntimeEvents()) {
      if (event.type === "delta" && event.text) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  text: message.text + event.text,
                  blocks: [{ kind: "text", id: "stream", text: message.text + event.text }],
                }
              : message,
          ),
        );
      }
      if (event.type === "error") setError(event.error ?? "Runtime error");
    }
    setRunning(false);
  }

  async function abort() {
    await abortTurn();
    setRunning(false);
    setError("Turn aborted");
  }

  return {
    attachments,
    error,
    input,
    messages,
    queue,
    running,
    abort,
    clearError: () => setError(""),
    queueMessage: () => {
      if (!input.trim()) return;
      setQueue((current) => [...current, { id: newId("queue"), mode: "follow_up", text: input.trim() }]);
      setInput("");
    },
    removeAttachment: (name: string) => setAttachments((current) => current.filter((item) => item !== name)),
    removeQueued: (id: string) => setQueue((current) => current.filter((item) => item.id !== id)),
    sendMessage,
    setAttachments,
    setInput,
  };
}
