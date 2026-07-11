---
id: ARCH-001
title: Verified Smart Composer codebase map
status: implemented
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Verified Smart Composer codebase map

## Classification

This document describes source at `6b38ab3c57e03c5c6cbeb79815277857df59cbd8`. It does **not** describe the Context Engine target.

## Runtime shape — Verified source

```text
Obsidian Plugin onload
  → registers ChatView and ApplyView
  → React root with providers
  → Chat coordinator
      → local prompt compilation / local vault RAG
      → direct model client / response generator
      → local chat JSON persistence
      → optional MCP tools
  → local PGlite / vector storage
```

## Key source observations

| Area | Verified source evidence | Target impact |
|---|---|---|
| Composition root | `src/main.ts` loads settings, registers chat/apply views, creates database/RAG/MCP managers. | Replace with Next.js app/root and existing FastAPI services. |
| UI host | `src/ChatView.tsx` mounts React inside Obsidian and installs provider contexts. | Preserve narrow React composition, remove Obsidian/context managers. |
| Chat coordinator | `Chat.tsx` owns input, history, prompt build, provider stream, apply flow, active-file updates. | Split into feature UI + typed API hooks; server owns business work. |
| Stream | `useChatStreamManager.ts` builds a direct client, creates `AbortController`, subscribes to `ResponseGenerator`. | Retain abort/partial rendering UX; replace execution with server SSE. |
| Retrieval | `RAGEngine` owns embedding client/vector manager over vault state. | Do not port; Context Engine retrieval remains private/server-owned. |
| History | `useChatHistory` plus JSON storage persists locally. | Replace with Postgres/API and user ownership. |
| Apply view | `ApplyView.tsx` renders original/new file content and detach action. | Gate behind editable-source product decision. |
| Provider settings | `constants.ts` and `core/llm/` define provider clients/OAuth/model defaults. | Do not port. Secrets and provider routing stay server-side. |

## Source component inventory

| Source path | Role | Adaptation disposition |
|---|---|---|
| `src/main.ts` | plugin lifecycle, commands, singleton managers | reference only |
| `src/ChatView.tsx` | host React composition | reference only; map to Next layouts/providers |
| `src/components/chat-view/Chat.tsx` | chat screen orchestration | split and reimplement |
| `src/components/chat-view/chat-input/` | rich composer UX | candidate UI reference |
| `src/components/chat-view/AssistantMessage*.tsx` | assistant rendering | candidate presentational reference |
| `src/components/chat-view/SimilaritySearchResults.tsx` | retrieval/evidence display | candidate UI reference; server data only |
| `src/components/chat-view/MarkdownReferenceBlock.tsx` | citations | candidate UI reference |
| `src/components/chat-view/LLMResponseInfoPopover.tsx` | response metadata | candidate UI reference |
| `src/components/chat-view/ChatListDropdown.tsx` | conversation selection | candidate UI reference |
| `src/components/modals/TemplateSectionModal.tsx` | prompt templates | candidate UI reference |
| `src/components/apply-view/ApplyViewRoot.tsx` | change review UI | gated reference |
| `src/utils/chat/*` | prompt/diff/apply/history helpers | inspect individually; mostly server or gated |
| `src/core/llm/*`, `src/core/mcp/*`, `src/core/rag/*` | runtime business work | excluded |
| `src/database/*` | local persistence/vector storage | excluded |

## Requires runtime validation

Keyboard shortcuts, drag/drop/paste edge cases, visual tokens in `styles.css`, exact tool-stream ordering, and mobile layout must be verified from a running source installation before parity work.
