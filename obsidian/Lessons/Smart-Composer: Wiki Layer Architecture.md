---
type: lesson
status: active
audience:
  - junior-dev
  - agent
layer:
  - rag
  - chat
  - wiki
tags:
  - type/lesson
  - layer/rag
  - layer/chat
  - status/active
  - source/smart-composer
---

# Smart-Composer: Wiki Layer Architecture

How Obsidian Smart Composer turns a markdown vault into a **self-learning wiki**: index notes, retrieve into chat, propose edits, write back, re-index.

Parent: [[Lessons Index]].

**Source pin:** `glowingjade/obsidian-smart-composer@6b38ab3c57e03c5c6cbeb79815277857df59cbd8`  
**Local package:** `.references/obsidian-smart-composer_impl_docs/` (adaptation map; not the plugin runtime)

---

## Goal

After this lesson you can:

- explain what “self-learning wiki layer” means in Smart Composer;
- draw the vault → RAG → prompt → Apply → re-index loop;
- name the real data models (embeddings, chats, templates, mentionables);
- list the prompts Smart Composer uses (there are **no Cursor-style skills**);
- rebuild the same *behavior* from the checklist;
- state what Context Engine must **not** copy from the plugin.

---

## Why this matters

Smart Composer’s product pitch: stop pasting vault context into ChatGPT — the vault *is* the context, and Apply can update notes so the next answer sees the change.

In this repo, Smart Composer is a **UX/reference** only. Context Engine keeps auth, retrieval, prompts, providers, and wiki lifecycle on the server. Juniors who confuse “how SC works” with “how CE must be built” will port PGlite, browser providers, or direct file writes — all forbidden.

| Smart Composer is | Smart Composer is not |
| --- | --- |
| Local vault RAG + chat + Apply writeback | A multi-tenant Context Engine |
| Browser-owned providers, prompts, embeddings | CE’s target architecture |
| MIT reference for composer/evidence UX | Runtime authority for CE |

---

## Mental model

**Self-learning wiki** = vault is both knowledge store and editable wiki.

```text
                    +------------------+
                    |  Obsidian Vault  |  <-- markdown wiki (source of truth)
                    |  (TFile / notes) |
                    +--------+---------+
                             |
           read/chunk/embed  |  apply write (user click)
                             v
+-------------+     +--------+--------+     +----------------+
| Chat UI     |---->| PromptGenerator |---->| LLM providers  |
| Chat.tsx    |     | + RAGEngine     |     | (in plugin)    |
+------+------+     +--------+--------+     +--------+-------+
       |                     |                       |
       | mentionables        | similarity hits       | stream
       |                     v                       v
       |            +--------+--------+     +--------+-------+
       |            | PGlite embeddings|     | ApplyView     |
       |            | + JSON chats/    |     | apply.ts      |
       |            |   templates      |     | -> rewrite md |
       |            +-----------------+     +----------------+
       |
       +-- optional MCP tools (external; not vault RAG)
```

**Learning loop:**

```text
notes exist
  -> index (chunk + embed) into PGlite
  -> user asks (+ @mentions or Vault Search)
  -> retrieve top-k chunks
  -> LLM answers with <smtcmp_block> edit proposals
  -> user Apply -> note rewritten
  -> mtime changes -> next query re-indexes that file
  -> future answers see updated wiki
```

Without Apply, the wiki does not “learn” from chat — only retrieval + chat history.

---

## Walkthrough

### 1. Plugin wiring

| Piece | File(s) | Job |
| --- | --- | --- |
| Plugin root | `src/main.ts` | Settings, ChatView/ApplyView, lazy DB + RAG + MCP, index commands |
| React host | `src/ChatView.tsx` | Providers: app, settings, db, rag, mcp, chat |
| Chat coordinator | `src/components/chat-view/Chat.tsx` | Mentions, history, compile prompt, stream, apply |
| Stream | `useChatStreamManager.ts` + `responseGenerator.ts` | Direct provider client + AbortController |
| Prompt assembly | `promptGenerator.ts` | Mentions + RAG + system/custom/RAG instructions |
| Vault RAG | `ragEngine.ts` + `VectorManager.ts` | Index + similarity search |
| Apply | `apply.ts` + `ApplyView.tsx` | Second LLM call: rewrite whole file from one block |
| Templates | `TemplatePlugin` + template store | `/` expand into composer (not system prompt) |

Lazy init:

```text
getRAGEngine()
  -> getDbManager()          // PGlite + Drizzle
  -> new RAGEngine(app, settings, db.getVectorManager())
```

Commands: `rebuild-vault-index` (`reindexAll: true`), `update-vault-index` (mtime-diff only). Every RAG query also runs incremental `updateVaultIndex({ reindexAll: false })`.

### 2. Data models

**Embeddings table** (`embeddings`) — the wiki index:

| Column | Meaning |
| --- | --- |
| `path` | Vault-relative note path |
| `mtime` | File mtime; stale detection |
| `content` | Chunk text |
| `model` / `dimension` | Embedding model id + vector size |
| `embedding` | `vector` (HNSW indexes per supported dim) |
| `metadata` | `{ startLine, endLine }` |

Index path: markdown files → glob include/exclude → `RecursiveCharacterTextSplitter` (markdown, `chunkSize`) → embed batches of 100 → insert → persist PGlite.

**Templates** — not skills:

```text
template { id, name, content: { nodes: LexicalJSON }, createdAt, updatedAt }
```

`/` inserts into the composer. Does **not** change the system prompt.

**Chat history** — JSON conversations with `mentionables` + optional `similaritySearchResults` (hits without embedding vectors).

**Mentionables:**

```text
file | folder | vault | current-file | block | url | image
```

| Trigger | Behavior |
| --- | --- |
| `@vault` | Force full-vault RAG |
| file/folder over `thresholdTokens` | Scoped RAG |
| file/folder under threshold | Paste full text into prompt |
| Vault Search (e.g. Cmd+Shift+Enter) | `useVaultSearch=true` |

**RAG settings defaults** (`ragOptions`): `chunkSize=1000`, `thresholdTokens=8192`, `minSimilarity=0.0`, `limit=10`, include/exclude globs.

### 3. Query / prompt pipeline

```text
User submit
  |
  v
compileUserMessagePrompt()
  1. plain-text query from Lexical
  2. resolve @file/@folder/@block/@url/@image/@vault
  3. if vault OR token(files) > thresholdTokens:
       RAGEngine.processQuery(query [, scope])
         a. updateVaultIndex(reindexAll=false)
         b. embed(query)
         c. similarity search -> hits
       build "## Potentially Relevant Snippets..."
       (Default promptLevel: prefix lines with "N|")
     else:
       paste full file bodies in fenced blocks
  4. append blocks, URL/YouTube text, images, then query
  |
  v
generateRequestMessages()
  [system]   getSystemMessage(shouldUseRAG)
  [user]     custom_instructions (if settings.systemPrompt)
  [user]     current file (optional)
  [history]  last 20 msgs (tool calls filtered)
  [user]     getRagInstructionMessage() if RAG + Default level
  |
  v
ResponseGenerator -> stream to UI
  parse <smtcmp_block> for Apply buttons
```

### 4. Prompts inventory (not skills)

Smart Composer has **prompt programs**, not skill files.

| ID | Where | Role |
| --- | --- | --- |
| A | `getSystemMessage(false)` | Chat system: concise, markdown, `<smtcmp_block>` edit format |
| B | `getSystemMessage(true)` | RAG system: cite via empty blocks with `startLine`/`endLine` |
| C | `getRagInstructionMessage()` | Follow-up user msg: use line-range empty blocks; no `N\|` in output |
| D | `settings.systemPrompt` | Custom instructions wrapped in `<custom_instructions>` |
| E | `apply.ts` system prompt | Rewrite **entire** target file from one selected block |
| F | `/` templates | User Lexical snippets into composer only |
| G | MCP tools | External tools; orthogonal to vault RAG; **exclude** from CE |

**`<smtcmp_block>` contract** (required for Apply UX):

```text
<smtcmp_block language="markdown">...</smtcmp_block>
<smtcmp_block filename="path/to/file.md" language="markdown">...</smtcmp_block>
<smtcmp_block filename="..." language="markdown" startLine="2" endLine="30"></smtcmp_block>
```

### 5. Apply / writeback

```text
Assistant streams <smtcmp_block filename="Note.md">
User clicks Apply
  -> applyChangesToFile()
       system: apply systemPrompt
       user: target file + history + selected block
  -> LLM returns full new file body
  -> ApplyView shows diff
  -> user confirms -> vault.modify(TFile)
  -> next RAG query sees new mtime -> re-embed
```

### 6. Rebuild checklist (behavioral parity)

1. Vault FS adapter — list/read markdown, mtime, write on apply  
2. Vector store — embeddings + cosine top-k + path/folder scope  
3. Indexer — chunk, embed, incremental by mtime, globs  
4. Mention compiler — types above + token threshold gate  
5. PromptGenerator — system A/B, custom, current file, history ≤20, RAG instruction  
6. Chat stream — provider stream + abort  
7. Block parser — `<smtcmp_block>` → Apply UI  
8. Apply LLM — whole-file rewrite prompt  
9. Templates — named snippets on `/`  
10. Settings — models, `ragOptions`, `systemPrompt`, chat options  

MCP optional for wiki-loop parity.

### 7. Context Engine mapping

Do **not** port the plugin runtime into CE.

| Smart Composer | Context Engine |
| --- | --- |
| Local `RAGEngine` / PGlite | Server LightRAG + Evidence (P5/P6) |
| `promptGenerator` in UI | Server prompt assembly / turn pipeline |
| Direct provider in browser | FastAPI trusted runtime |
| Apply → `TFile` write | F-011 wiki contributions + publish revisions (gated) |
| `/` templates | Server-owned templates |
| Mentions as vault objects | Opaque safe refs (F-012) |

```text
SC:  Browser = brain + RAG + providers + disk
CE:  Browser = UI only
     FastAPI = auth, retrieval, prompts, providers, wiki lifecycle
```

---

## Checkpoint questions

1. What makes the wiki “self-learning” — RAG alone, or RAG + Apply + re-index?
2. Where do embeddings live in Smart Composer — Postgres server or local PGlite?
3. Name three prompt programs SC uses. Are any of them Cursor-style skills?
4. When does SC use RAG vs pasting full file text?
5. Why must CE **not** run `promptGenerator` / providers in the browser?

---

## Mini exercise

In 6–10 sentences, design a **minimal** clone that only supports:

- index one folder of markdown;
- `@file` mention + Vault Search;
- chat with RAG system prompt B;
- Apply one `<smtcmp_block>` back to disk.

List the modules you would create (names only) and which SC files each mirrors. Then write one sentence on what you would **delete** if this clone had to become Context Engine–safe.

---

## Expected answer

- Self-learning requires the full loop: index → retrieve → propose `<smtcmp_block>` → Apply write → mtime → re-index. RAG alone is read-only.
- Embeddings live in **local PGlite** (`embeddings` table), not a shared CE Postgres.
- Prompt programs: chat system (A/B), RAG instruction (C), custom instructions (D), apply system (E), plus `/` templates (F). **None** are Cursor skills.
- RAG when `@vault`, Vault Search, or mentioned files exceed `thresholdTokens`; otherwise full text is inlined.
- CE forbids browser-owned prompts/providers/retrieval so secrets, raw source, and lifecycle stay server-side; browser only sends safe refs and renders safe DTOs/SSE.

**Exercise sketch:** modules like `VaultFs`, `VectorIndex`, `RagEngine`, `PromptCompiler`, `ChatStream`, `SmtcmpParser`, `ApplyRewriter`, `TemplateStore` mirroring `VectorManager` / `ragEngine` / `promptGenerator` / `responseGenerator` / `apply.ts`. For CE-safety: delete browser providers, local vector DB, direct disk Apply, and move prompt/RAG/wiki publish behind FastAPI.

---

## Common mistakes

| Mistake | Reality |
| --- | --- |
| “SC has skills like Cursor” | It has system/apply prompts + `/` templates + optional MCP |
| “Port `RAGEngine` into Next.js” | CE retrieval is server LightRAG; browser never embeds |
| “Apply is just a UI diff” | Apply is a **second LLM call** that rewrites the whole file |
| “Index only on Rebuild command” | Every `processQuery` also incremental-indexes |
| “Templates are the system prompt” | Templates expand into the composer input only |
| “CE Smart Composer writes wiki files” | CE: contributions → review → publish revisions via API |

---

## Related

- [[Lessons Index]]
- [[Backend-Owned Lifecycle]] — why CE keeps long work off the request/browser
- [[LS Harness To CE Rag Brainstorm]] — harness shape vs CE RAG (inbox; not ADR)
- [[Architecture Index]] — CE component boundaries
- [[Context Engine Index]] — vault root

## Repo sources

- `.references/obsidian-smart-composer_impl_docs/README.md` — adaptation package purpose
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md` — commit pin + anchors
- `.references/obsidian-smart-composer_impl_docs/specs/02-architecture/source-codebase-map.md` — verified SC map
- `.references/obsidian-smart-composer_impl_docs/specs/02-architecture/source-to-target-adaptation.md` — SC → CE disposition
- Upstream (pin `6b38ab3c`): `src/main.ts`, `src/core/rag/ragEngine.ts`, `src/database/modules/vector/VectorManager.ts`, `src/database/schema.ts`, `src/utils/chat/promptGenerator.ts`, `src/utils/chat/apply.ts`, `src/types/mentionable.ts`, `src/types/chat.ts`, `src/settings/schema/setting.types.ts`
- `AGENTS.md` — browser never talks to LightRAG/providers/DB; Smart Composer is reference only
- `specs/04-features/F-011-knowledge-curation-workspace/` — CE wiki contribution lifecycle (target, not SC port)
