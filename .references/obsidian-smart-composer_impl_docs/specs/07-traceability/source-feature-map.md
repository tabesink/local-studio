---
id: TRACE-003
title: Source feature reconstruction index
status: implemented
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Source feature reconstruction index

Use this table to find original reference scripts at `6b38ab3c57e03c5c6cbeb79815277857df59cbd8`. Each link is pin-stable.

| Smart Composer feature | Verified source anchor | Target slice | Treatment |
|---|---|---|---|
| Plugin lifecycle and commands | [`src/main.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/main.ts) | F-000/F-001/F-008 | inspect only; remove Obsidian lifecycle |
| React host/provider composition | [`src/ChatView.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/ChatView.tsx) | F-001 | adapt narrow composition root |
| Chat interaction coordinator | [`Chat.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/Chat.tsx) | F-002–F-007 | split and reimplement |
| Composer | [`chat-input/`](https://github.com/glowingjade/obsidian-smart-composer/tree/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/chat-input) | F-003 | UX reference only |
| Context/mentions | [`mentionable.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/types/mentionable.ts) | F-003 | map to API IDs, not vault objects |
| Streaming/cancel | [`useChatStreamManager.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/useChatStreamManager.ts) | F-004 | retain UX; replace provider runtime |
| Direct response runtime | [`responseGenerator.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/responseGenerator.ts) | F-004 | excluded |
| Prompt generation | [`promptGenerator.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/promptGenerator.ts) | F-003/F-004 | server-owned; excluded from browser |
| Evidence list | [`SimilaritySearchResults.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/SimilaritySearchResults.tsx) | F-005 | display reference |
| Citation markdown | [`MarkdownReferenceBlock.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/MarkdownReferenceBlock.tsx) | F-005 | display/sanitization reference |
| Local history | [`useChatHistory.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/hooks/useChatHistory.ts) + [`json/chat`](https://github.com/glowingjade/obsidian-smart-composer/tree/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/database/json/chat) | F-006 | replace with API/Postgres |
| Prompt templates | [`TemplateSectionModal.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/modals/TemplateSectionModal.tsx) | F-007 | UI/reference only |
| Model metadata | [`LLMResponseInfoPopover.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/LLMResponseInfoPopover.tsx) | F-007 | expose safe API metadata only |
| Vault index feedback | [`QueryProgress.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/QueryProgress.tsx) | F-008 | map to server operation status |
| Local RAG | [`ragEngine.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/core/rag/ragEngine.ts) | none | explicitly excluded |
| MCP tools | [`core/mcp/`](https://github.com/glowingjade/obsidian-smart-composer/tree/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/core/mcp) | none | explicitly excluded |
| Provider/OAuth/constants | [`constants.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/constants.ts) | none | explicitly excluded; never copy secrets |
| Local apply/diff | [`ApplyView.tsx`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/ApplyView.tsx), [`apply.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/apply.ts), [`diff.ts`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/diff.ts) | F-009 | decision gated |
| Source CSS | [`styles.css`](https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/styles.css) | F-002 onward | visual reference only; runtime capture needed |
