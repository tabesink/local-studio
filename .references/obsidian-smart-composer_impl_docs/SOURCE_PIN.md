# Source Pin and Reference URLs

## Pinned source

- Repository: `https://github.com/glowingjade/obsidian-smart-composer`
- Commit: `6b38ab3c57e03c5c6cbeb79815277857df59cbd8`
- Tree: `https://github.com/glowingjade/obsidian-smart-composer/tree/6b38ab3c57e03c5c6cbeb79815277857df59cbd8`
- Reference licence: MIT (verify `LICENSE` at the pinned ref before copying code)

## Obtain a local source copy

```bash
git clone https://github.com/glowingjade/obsidian-smart-composer.git obsidian-smart-composer-reference
cd obsidian-smart-composer-reference
git checkout 6b38ab3c57e03c5c6cbeb79815277857df59cbd8
git status --short
```

Expected output after checkout: no changes and detached HEAD at `6b38ab3c57e03c5c6cbeb79815277857df59cbd8`.

## Reference policy

- Copy small, relevant MIT-licensed presentation or parsing code only after inspecting it at this pin.
- Keep original copyright and licence notices where the copied material requires them.
- Treat all provider credentials, OAuth values, direct model clients, local vault/database behaviour, MCP behaviour, and filesystem writes as **non-portable**.
- Never copy literal secret values into this package, Context Engine, fixtures, prompts, logs, or browser bundles.

## High-value source anchors

| Intent | Source path | Pinned link |
|---|---|---|
| Plugin composition root | `src/main.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/main.ts` |
| Obsidian React host | `src/ChatView.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/ChatView.tsx` |
| Main chat coordinator | `src/components/chat-view/Chat.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/Chat.tsx` |
| Client-side stream manager | `src/components/chat-view/useChatStreamManager.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/useChatStreamManager.ts` |
| Local RAG wrapper | `src/core/rag/ragEngine.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/core/rag/ragEngine.ts` |
| Local database manager | `src/database/DatabaseManager.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/database/DatabaseManager.ts` |
| Chat JSON persistence | `src/database/json/chat/` | `https://github.com/glowingjade/obsidian-smart-composer/tree/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/database/json/chat` |
| Chat persistence hook | `src/hooks/useChatHistory.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/hooks/useChatHistory.ts` |
| Prompt compilation | `src/utils/chat/promptGenerator.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/promptGenerator.ts` |
| Response generation | `src/utils/chat/responseGenerator.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/responseGenerator.ts` |
| Context / mention types | `src/types/mentionable.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/types/mentionable.ts` |
| Chat types | `src/types/chat.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/types/chat.ts` |
| Evidence UI | `src/components/chat-view/SimilaritySearchResults.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/SimilaritySearchResults.tsx` |
| Citation rendering | `src/components/chat-view/MarkdownReferenceBlock.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/MarkdownReferenceBlock.tsx` |
| Response metadata UI | `src/components/chat-view/LLMResponseInfoPopover.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/chat-view/LLMResponseInfoPopover.tsx` |
| Prompt-template UI | `src/components/modals/TemplateSectionModal.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/modals/TemplateSectionModal.tsx` |
| Apply-view host | `src/ApplyView.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/ApplyView.tsx` |
| Apply/diff UI | `src/components/apply-view/ApplyViewRoot.tsx` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/components/apply-view/ApplyViewRoot.tsx` |
| Apply helper | `src/utils/chat/apply.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/apply.ts` |
| Diff helper | `src/utils/chat/diff.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/utils/chat/diff.ts` |
| Provider/OAuth constants — reference only | `src/constants.ts` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/src/constants.ts` |
| Source styles | `styles.css` | `https://github.com/glowingjade/obsidian-smart-composer/blob/6b38ab3c57e03c5c6cbeb79815277857df59cbd8/styles.css` |
