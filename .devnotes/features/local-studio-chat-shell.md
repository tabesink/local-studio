# Local Studio → Next.js Contextual Chat Shell

## Evidence-based workflow map, Smart Composer UX parity plan, THDB persistence model, and first vertical slice

**Audience:** junior developers and coding agents
**Goal:** build a lean, modular, multi-user contextual chat shell in Next.js with interaction parity to Obsidian Smart Composer, using selected reliability patterns from Local Studio.
**Scope:** 5–10 concurrent internal users; one active generation per chat session; workspace-scoped data; attachment/context references; SSE streaming; no terminal, browser automation, filesystem editing, or Obsidian runtime in the first slice.

---

## 0. Evidence and terminology

### Repositories reviewed

* **Functional reference:** `sybil-solutions/local-studio`, mainly:

  * `README.md`
  * `frontend/README.md`
  * `frontend/src/app/agent/page.tsx`
  * `frontend/src/features/agent/ui/agent-workspace-shell.tsx`
  * `frontend/src/features/agent/ui/chat-pane-send-flow.ts`
  * `frontend/src/features/agent/workspace/replay-queue.ts`
  * `frontend/src/features/agent/workspace/persistence.ts`
  * `frontend/src/features/agent/session-metadata-store.ts`
  * `frontend/src/app/api/agent/*`
  * `controller/src/*`

* **UI/UX reference:** `glowingjade/obsidian-smart-composer`, mainly:

  * `src/ChatView.tsx`
  * `src/components/chat-view/Chat.tsx`
  * `src/components/chat-view/useChatStreamManager.ts`
  * `src/hooks/useChatHistory.ts`
  * `src/utils/chat/promptGenerator.ts`
  * `src/database/json/chat/ChatManager.ts`
  * `src/database/DatabaseManager.ts`
  * `src/components/chat-view/*`

### Evidence labels

* **TRACED** — behavior followed through relevant source code.
* **MAPPED** — route/module presence verified, but not every internal function traced.
* **PROPOSED** — target architecture decision; not claimed to exist in either reference repository.

### Important limitation: “THDB”

`THDB` was not found in either scanned repository. This document therefore treats it as the target application’s **transactional storage port**. Replace the adapter implementation when the actual THDB product/API is confirmed. Do not let an unverified database name determine application boundaries.

---

# 1. Executive conclusion

## What to retain

1. **Smart Composer contextual-turn model**

   * A user turn is more than text: it can contain references, selected content, files, images, URLs, and retrieval results.
   * Compile these into a provider-ready prompt before generation.
   * Persist the original user intent plus the resolved context/citations needed to explain the response.

2. **Local Studio stream reliability model**

   * Prevent duplicate submits per session.
   * Append user intent to the UI immediately.
   * Support abort, retry, and stream replay/reconciliation.
   * Keep layout/view state separate from durable chat records.

3. **Next.js target boundary**

   * Next.js owns the application shell, authenticated routes, server-rendered initial data, and client interaction state.
   * A chat service owns generation orchestration and SSE. In the Context Engine direction, this should be FastAPI rather than a browser-held provider call.
   * THDB owns durable multi-user records. Object storage owns original file bytes. Retrieval is an adapter, not embedded inside the chat component.

## What not to carry forward

* Local Studio’s Pi agent runtime, terminal, browser automation, local filesystem mutation, Electron shell, multi-pane coding-workspace reducer, and JSON session metadata store.
* Smart Composer’s Obsidian `App`, `Vault`, `ItemView`, PGlite-in-plugin persistence, direct vault file writes, and plugin-specific apply-edit flow.
* Direct client-side provider credentials.

---

# 2. Reference architecture maps

## 2.1 Local Studio: traced agent-chat path

```text
User
  |
  v
Next.js /agent route
  └─ AgentWorkspace
      └─ chat-pane-send-flow
          ├─ validates model / input / attachment-read state
          ├─ builds prompt from text + selected context + attachments + browser context
          ├─ prevents duplicate per-session submit
          ├─ invokes SessionEngine
          ├─ supports abort / queue / steer / retry
          v
Next.js /api/agent/* proxy routes
          v
Bun + Hono controller
  ├─ local model/runtime lifecycle
  ├─ agent/Pi runtime
  ├─ local filesystem and tool capability
  └─ stream/event delivery
          v
Transcript state is reconciled in the workspace UI

Separate persistence:
  browser localStorage -> pane/layout restoration only
  local JSON metadata -> single-machine session archive/title metadata
```

**Why it matters:** Local Studio separates immediate workspace UX state from runtime state. Keep this separation, but replace its local-only persistence with THDB-backed chat records and workspace authorization.

## 2.2 Smart Composer: traced contextual-chat path

```text
Obsidian ChatView / provider tree
  |
  v
Chat.tsx
  ├─ creates/loads/deletes/renames conversations
  ├─ appends the user message locally before generation
  ├─ calls PromptGenerator for the last user turn
  └─ starts useChatStreamManager
          |
          +--> PromptGenerator
          |     ├─ resolves mentionables: current file, file, folder, block, vault, URL, image
          |     ├─ reads source content
          |     ├─ decides direct-context versus RAG path
          |     └─ returns compiled prompt + retrieval results
          |
          +--> ResponseGenerator / provider / optional MCP tools
          |     ├─ emits assistant and tool messages incrementally
          |     ├─ aborts stale streams
          |     └─ updates transcript
          |
          +--> useChatHistory
                └─ serializes messages and debounces persistence
                    └─ ChatManager JSON records in the Obsidian data area
```

**Why it matters:** This is the right functional shape for a contextual chat shell. Replace all Obsidian readers and JSON managers with explicit web services and repositories.

---

# 3. Local Studio feature inventory

| Feature family                  | User goal                                             | Verified entry / source                                                     | End-to-end flow                                                                                                   | Status                | Target decision                                           |
| ------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| Agent workspace                 | Work inside a local AI-agent workspace                | `frontend/src/app/agent/page.tsx` → `AgentWorkspace`                        | Route mounts a dense workspace shell with projects, panes, tools, and active session state                        | TRACED                | **Reference only**; use a simpler three-region chat shell |
| Chat turn submit                | Send a prompt with context                            | `ui/chat-pane-send-flow.ts`                                                 | Validate → compose text/attachment/browser/selected context → one-submit guard → engine submit                    | TRACED                | **Adapt behavior**                                        |
| Attachments                     | Add files/images to a turn                            | `ui/chat-attachments.ts`, used by send flow                                 | Attachment text enters prompt; vision-capable models receive image inputs; durable previews avoid stale blob URLs | TRACED at integration | **Adapt contract; rewrite UI/storage**                    |
| Turn control                    | Steer, queue, abort, retry                            | `ui/chat-pane-send-flow.ts`                                                 | Immediate pending steer UI → engine control; retry resends last user turn after failure                           | TRACED                | **Adapt only abort/retry first**                          |
| Stream replay                   | Restore a mounted pane to a canonical runtime session | `workspace/replay-queue.ts`                                                 | Last-wins queue per pane; replay only after mount; guard prevents old transcript replacing a fresh tab            | TRACED                | **Adapt as stream reattach logic**, not panes             |
| Browser workspace state         | Restore pane layout and active sessions               | `workspace/persistence.ts`                                                  | Post-dispatch writer persists layout/session snapshots in `localStorage`                                          | TRACED                | **Keep only cosmetic UI preferences locally**             |
| Session metadata                | Archive and title local sessions                      | `session-metadata-store.ts`                                                 | JSON file + lock file + stale-lock recovery + atomic temp-file rename                                             | TRACED                | **Do not carry forward**; use THDB rows                   |
| Session history                 | Browse/load durable sessions                          | `session-json-store.ts`, `sessions-store.ts`, `app/api/agent/sessions/*`    | Session list/replay/archive behavior exposed through agent layer                                                  | MAPPED                | **Replace with THDB session repository**                  |
| Projects/directories            | Work under a selected local project                   | `projects*`, `directories`, `app/api/agent/projects/*`                      | Project selection scopes local agent working directory                                                            | MAPPED                | **Out of scope**; use workspace/domain selector instead   |
| Filesystem/browser/terminal     | Let agent inspect or act on local computer resources  | `fs*`, `browser*`, `terminal*`, matching `/api/agent/*` folders             | UI sends actions through controller/desktop/runtime boundary                                                      | MAPPED                | **Out of scope**                                          |
| Git / diff                      | Inspect code changes                                  | `git.ts`, `git-diff`, API folders                                           | Agent workspace exposes repository and diff operations                                                            | MAPPED                | **Out of scope**                                          |
| Plans/canvas/comments           | Plan and annotate coding work                         | `plan*`, `canvas-store.ts`, `comments-store.ts`, API folders                | Client state and controller-assisted workspace tools                                                              | MAPPED                | **Out of scope**                                          |
| Skills/templates                | Apply reusable agent capabilities or prompt templates | `skill-discovery.ts`, `prompt-templates-store.ts`, API folders              | Selected skills/templates contribute to runtime prompt/tool state                                                 | MAPPED                | **Later extension**                                       |
| Models/runtime                  | Select/start/manage local model runtimes              | `runtime`, `models`, controller `modules/engines`, `modules/models`         | Settings/API/controller coordinate runtime targets and model capability                                           | MAPPED                | **Provider profile selector only**                        |
| Inference proxy                 | Expose model-compatible serving                       | frontend `/api/proxy/*`, controller `modules/proxy`                         | Controller routes/proxies inference                                                                               | MAPPED                | **Use provider adapter / Context Engine backend**         |
| System setup/logs/usage/recipes | Operate Local Studio                                  | `setup`, `logs`, `usage`, `recipes`, `settings`, `discover` features/routes | UI routes use controller APIs for local runtime diagnostics and guidance                                          | MAPPED                | **No direct port**; retain only app-level settings later  |
| Desktop/Electron                | Run local workstation shell                           | frontend Electron integration                                               | Desktop host adds local-machine capabilities                                                                      | MAPPED                | **Do not port**                                           |
| Audio                           | Local audio capability                                | controller `modules/audio`, frontend `voice` APIs                           | Controller-backed audio action path                                                                               | MAPPED                | **Out of scope**                                          |

## 3.1 Local Studio’s core chat-send workflow

```text
1. User enters text and/or adds attachment(s).
2. Send handler rejects empty input, missing model, reading attachment state, and duplicate in-flight submit.
3. Prompt builder combines:
   - user text
   - attachment-derived text
   - selected skills/context
   - optional browser context
   - model-compatible image inputs
4. UI clears attachment tray and resets composer height.
5. SessionEngine submits to runtime.
6. Runtime events update transcript state.
7. User can abort; a failed mid-stream turn can retry the most recent user prompt.
```

### Port exactly as behavior, not code

* **One active submit per chat session.**
* **Do not lose original user text during compilation.**
* **Do not rely on blob URLs after persistence.** Store an object key or durable URL.
* **Keep retry idempotent.** A retry must not create a second user message.
* **Do not carry “steer” and queue controls into slice one.** They solve a coding-agent runtime problem, not basic contextual chat.

## 3.2 Local Studio’s important anti-pattern for this target

`session-metadata-store.ts` uses a local JSON file with a lock file and atomic write to protect a single workstation’s metadata. That is sensible for a local desktop app; it is not a multi-user app database design. In a shared web application it lacks workspace authorization, transaction isolation, queryability, backup policy, and clean concurrent writes across multiple app instances.

---

# 4. Smart Composer feature inventory

| Feature family                  | User goal                                                        | Main source                                                    | End-to-end flow                                                                                                           | Status        | Target decision                                                            |
| ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------- |
| Chat view lifecycle             | Open contextual chat inside host UI                              | `src/ChatView.tsx`                                             | Builds provider tree, mounts `Chat`, supports new chat/selection focus actions                                            | TRACED        | **Adapt provider composition, not Obsidian host**                          |
| Conversation history            | Create/load/delete/rename chats                                  | `hooks/useChatHistory.ts`, `database/json/chat/ChatManager.ts` | Lists metadata, reads full chat on selection, serializes messages, debounces writes, generates title from first user text | TRACED        | **Adapt behavior; THDB instead of JSON**                                   |
| Chat transcript                 | Render user, assistant, tool groups, and response metadata       | `components/chat-view/Chat.tsx` + adjacent components          | Groups assistant/tool responses, retains focused message and transcript state                                             | TRACED/MAPPED | **Adapt visual and interaction structure**                                 |
| Context mentions                | Attach current file, files, folders, blocks, vault, URLs, images | `utils/chat/promptGenerator.ts`                                | Resolve mentionables → read content → compile provider-ready text/image parts                                             | TRACED        | **Core feature; replace Obsidian resolvers**                               |
| Retrieval/RAG                   | Query vault when requested or content is oversized               | `promptGenerator.ts`, `core/rag/*`                             | Choose direct source context or RAG; retrieve snippets; attach snippets and retrieval results                             | TRACED/MAPPED | **Use Context Engine retrieval adapter later or behind interface**         |
| URL and video context           | Add URL content or YouTube transcript                            | `promptGenerator.ts`                                           | Fetch page / transcript and add content into compiled prompt                                                              | TRACED        | **Later extension; URL only after SSRF controls**                          |
| Image context                   | Send image content to vision models                              | `promptGenerator.ts`                                           | Converts image mentionables into image URL provider content parts                                                         | TRACED        | **Include as attachment type, provider capability gated**                  |
| Streaming and cancellation      | Generate incrementally and stop stale streams                    | `useChatStreamManager.ts`                                      | Own abort controllers; replace response tail as updates arrive; abort if source message vanished                          | TRACED        | **Core feature; server-SSE equivalent**                                    |
| Tool/MCP flow                   | Let model call configured tools                                  | `useChatStreamManager.ts`, `core/mcp/*`                        | Response generator processes tool messages and supports continuation when tool calls complete                             | MAPPED        | **Later extension**                                                        |
| Apply edits                     | Apply a generated change into current note                       | `Chat.tsx`, `ApplyView.tsx`                                    | Requires active file, opens apply view, calls file-write utility                                                          | TRACED        | **Do not port**; replace later with explicit document-edit permission flow |
| Settings/model profiles         | Select providers/models/prompts                                  | `settings/*`, `core/llm/*`                                     | Model client selected from settings; invalid configuration opens host modal                                               | MAPPED        | **Provider profile UI later**                                              |
| Local database / vector storage | Persist plugin state and RAG data                                | `database/DatabaseManager.ts`, `database/schema.ts`            | PGlite initializes/migrates/saves under Obsidian; vector manager supports RAG                                             | TRACED/MAPPED | **Do not port PGlite browser persistence**                                 |
| Chat input                      | Rich composer and mention interaction                            | `components/chat-view/chat-input/*`                            | Rich input populates user message + mentionables                                                                          | MAPPED        | **Rebuild using web-native controlled composer**                           |

## 4.1 Smart Composer’s contextual-turn workflow

```text
1. User creates a message containing text plus mentionables.
2. UI commits the user message into in-memory transcript first.
3. PromptGenerator resolves context:
   - direct content when small enough
   - RAG snippets when vault search is requested or content exceeds threshold
   - URL/image content when attached
4. UI retains compiled prompt and similarity results on the user message.
5. Stream manager starts provider generation with AbortController.
6. Incremental assistant/tool updates replace the response tail after the user turn.
7. History hook serializes all messages and debounces persistence.
8. Switching conversations aborts active streams before loading another chat.
```

## 4.2 What “UX parity” means in a browser app

Parity means **matching the user mental model**, not transplanting Obsidian code:

* left-side conversation history;
* an obvious new-chat action;
* a focused central transcript;
* visible context chips before send;
* source/citation inspection beside or below a response;
* stop-generation control while streaming;
* recoverable loading/empty/error states;
* conversation rename/delete actions;
* concise model/context status in the composer.

It does **not** mean importing `obsidian`, using `ItemView`, using vault file paths as trusted IDs, or saving chats as JSON files in a shared deployment.

---

# 5. Target Next.js modular chat-shell architecture

## 5.1 Lean system boundary

```text
Browser
  |
  v
Next.js App Router
  ├─ Server pages: authenticate, authorize, load first session/history
  ├─ Client ChatShell: transcript, composer, local interaction state
  └─ Route handlers/BFF: short CRUD requests only
                  |
                  v
Chat Service (recommended: Context Engine FastAPI)
  ├─ validates workspace membership
  ├─ stores turn state in THDB
  ├─ resolves context references through adapters
  ├─ selects provider profile
  ├─ streams provider output
  └─ exposes replayable SSE
        |                 |
        v                 v
      THDB            Object storage
  users/workspaces    original attachment bytes
  sessions/messages   derived text/extraction artifacts
  references/events
        |
        v
Retrieval adapter / parser adapter / provider adapter
```

## 5.2 Ownership rules

| Layer              | Owns                                                                              | Must not own                                 |
| ------------------ | --------------------------------------------------------------------------------- | -------------------------------------------- |
| Server page        | initial authorization and initial data                                            | stream buffering, provider secret, DOM state |
| `ChatShell` client | selected session, optimistic transcript, stream connection, composer state        | durable authority or authorization decisions |
| Chat service       | turn state machine, context compilation, SSE events, cancellation, provider calls | rendering decisions                          |
| THDB repository    | transactionally correct records and scoped queries                                | provider SDK or HTTP details                 |
| Object storage     | file bytes                                                                        | chat/session relationships                   |
| Retrieval adapter  | source lookup/snippets                                                            | conversation persistence                     |

## 5.3 Recommended route structure

```text
src/app/
├─ (app)/workspaces/[workspaceId]/chat/page.tsx
├─ (app)/workspaces/[workspaceId]/chat/[sessionId]/page.tsx
└─ api/
   ├─ chat-sessions/route.ts
   ├─ chat-sessions/[sessionId]/route.ts
   ├─ chat-sessions/[sessionId]/turns/route.ts
   ├─ chat-sessions/[sessionId]/streams/[streamId]/route.ts
   ├─ chat-sessions/[sessionId]/cancel/route.ts
   └─ attachments/
      ├─ initiate/route.ts
      └─ complete/route.ts
```

**Deployment rule:** do not assume a generic `next start` deployment is safe for long-lived SSE. Local Studio explicitly needs a standalone startup path to preserve its SSE behavior. For the target system, prefer an explicit FastAPI streaming endpoint and keep Next.js as the authenticated UI/BFF.

---

# 6. Proposed UI/UX parity map

## 6.1 Shell layout

```text
+------------------------+--------------------------------------------+--------------------------+
| Session sidebar        | Main chat pane                             | Context inspector        |
|                        |                                            | optional / collapsible   |
| + New chat             | Session title + model badge                | Turn references          |
| Search history         | ----------------------------------------   | Source preview           |
| Session rows           | Transcript                                 | Attachment metadata      |
| - title                | user message                               | Retrieval snippets       |
| - updated time         | assistant message + citations/actions      |                          |
| - active indicator     | tool events later (not slice 1)            |                          |
|                        |                                            |                          |
|                        | Context chips                              |                          |
|                        | Composer + attach + send / stop            |                          |
+------------------------+--------------------------------------------+--------------------------+
```

**Responsive rule:** at narrow width, close the context panel first, then collapse the sidebar into a sheet. Do not stack three panes vertically by default.

## 6.2 Component mapping

| Smart Composer behavior             | Target Next.js component                            | State owner                    | Data dependency             | Decision                                |
| ----------------------------------- | --------------------------------------------------- | ------------------------------ | --------------------------- | --------------------------------------- |
| New/load/delete/rename conversation | `SessionSidebar` + `SessionMenu`                    | server cache + shell selection | session list CRUD           | Adapt                                   |
| Transcript grouped by message role  | `ChatTranscript`, `MessageList`, `AssistantMessage` | `ChatShell`                    | messages + stream events    | Adapt                                   |
| Context-rich input                  | `Composer`, `ContextChipTray`, `AttachmentPicker`   | `ComposerState`                | attachment/context refs     | Adapt                                   |
| Current file / block mentionables   | `ReferencePicker`                                   | feature-local UI state         | domain/document API         | Replace with browser-safe reference IDs |
| Vault retrieval progress            | `ContextProgress`                                   | `ChatShell`                    | context compilation events  | Adapt as optional status                |
| Stop generation                     | `StopButton`                                        | stream controller              | cancel endpoint             | Adapt                                   |
| Source/reference display            | `ContextInspector`, `CitationList`                  | selected message state         | `message_references`        | Replace Obsidian rendering              |
| Rich markdown/annotation view       | `MarkdownMessage`                                   | presentational                 | rendered markdown/citations | Rebuild                                 |
| Apply to open note                  | none in slice 1                                     | n/a                            | n/a                         | Omit                                    |
| MCP/tool event grouping             | `ToolRunGroup` later                                | stream state                   | tool event records          | Defer                                   |

## 6.3 Target component hierarchy

```text
src/
├─ app/(app)/workspaces/[workspaceId]/chat/[sessionId]/page.tsx
├─ features/chat/
│  ├─ components/
│  │  ├─ chat-shell.tsx
│  │  ├─ session-sidebar.tsx
│  │  ├─ session-list.tsx
│  │  ├─ chat-transcript.tsx
│  │  ├─ message-list.tsx
│  │  ├─ user-message.tsx
│  │  ├─ assistant-message.tsx
│  │  ├─ composer.tsx
│  │  ├─ context-chip-tray.tsx
│  │  ├─ attachment-picker.tsx
│  │  ├─ context-inspector.tsx
│  │  └─ stream-status.tsx
│  ├─ hooks/
│  │  ├─ use-chat-session.ts
│  │  ├─ use-chat-stream.ts
│  │  └─ use-composer-context.ts
│  ├─ server/
│  │  ├─ chat-service-client.ts
│  │  └─ session-actions.ts
│  └─ types.ts
└─ features/context/
   ├─ reference-picker.tsx
   ├─ reference-contracts.ts
   └─ source-preview.tsx
```

---

# 7. THDB persistence model

## 7.1 Storage split

| Data                                                           | Store                                                | Why                                         |
| -------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| Users, workspaces, memberships                                 | THDB                                                 | authorization and queryable ownership       |
| Chat sessions, messages, turn status, citations, event cursors | THDB                                                 | transactional and multi-user durable state  |
| Attachment bytes                                               | object/file storage                                  | database should not be the byte warehouse   |
| Extracted text / parser output                                 | object storage or THDB text field based on size      | preserves immutable source-derived artifact |
| Retrieval index                                                | external retrieval service or THDB only if supported | do not assume THDB has vector capability    |
| Browser-only layout preference                                 | localStorage                                         | cosmetic and non-authoritative              |
| Provider secrets                                               | server secret manager/env                            | never client state or THDB plaintext        |

## 7.2 Minimal logical schema

```text
users
- id
- display_name
- created_at

workspaces
- id
- name
- created_by_user_id
- created_at

workspace_memberships
- workspace_id
- user_id
- role                 -- admin | member
- created_at

chat_sessions
- id
- workspace_id
- title
- created_by_user_id
- status               -- active | archived
- last_message_at
- created_at
- updated_at

chat_messages
- id
- session_id
- client_turn_id       -- nullable for assistant/system, unique where present
- role                 -- user | assistant | tool (tool deferred)
- content_markdown
- compiled_context_json
- generation_status    -- none | queued | streaming | complete | cancelled | failed
- provider_profile_id  -- nullable
- model_id             -- nullable
- error_code           -- nullable
- error_message        -- nullable
- created_at
- completed_at         -- nullable

attachments
- id
- workspace_id
- uploaded_by_user_id
- object_key
- original_name
- mime_type
- byte_size
- extraction_status    -- uploaded | extracting | ready | failed
- extracted_text_key   -- nullable
- created_at

message_attachments
- message_id
- attachment_id
- ordinal

context_references
- id
- workspace_id
- kind                 -- attachment | document | snippet | url (url deferred)
- target_id
- label
- metadata_json
- created_at

message_references
- message_id
- context_reference_id
- purpose              -- user_selected | retrieved | citation
- ordinal
- excerpt              -- optional bounded snapshot

chat_streams
- id
- session_id
- user_message_id
- assistant_message_id
- requested_by_user_id
- status               -- queued | running | completed | cancelled | failed
- last_event_sequence
- created_at
- started_at
- ended_at

chat_stream_events
- stream_id
- sequence
- event_type           -- message.delta | reference.added | status | error | done
- payload_json
- created_at
```

## 7.3 Required constraints and indexes

```text
UNIQUE (chat_messages.session_id, chat_messages.client_turn_id)
  WHERE client_turn_id IS NOT NULL

UNIQUE (chat_stream_events.stream_id, chat_stream_events.sequence)

INDEX chat_sessions_workspace_last_message
  (workspace_id, status, last_message_at DESC)

INDEX chat_messages_session_created
  (session_id, created_at)

INDEX attachments_workspace_status
  (workspace_id, extraction_status, created_at DESC)

INDEX message_references_message
  (message_id, ordinal)
```

## 7.4 Authorization boundary

Every session, message, attachment, reference, and stream query must begin with a workspace-membership check. Never accept `workspace_id`, `session_id`, or object key from the browser as proof of ownership.

```text
Request user
  -> session lookup
  -> session.workspace_id
  -> membership check
  -> perform read/write
```

## 7.5 Turn lifecycle in THDB

```text
POST turn (client_turn_id)
  |
  +-- transaction
      1. authorize workspace member
      2. find existing user message by (session_id, client_turn_id)
         - found: return its existing stream
         - absent: create user message + assistant placeholder + stream row
      3. update chat_sessions.last_message_at
  |
  +-- start generation task
  |
  +-- return stream_id

SSE generation
  |
  +-- resolve references
  +-- emit and persist ordered stream events
  +-- append assistant content to durable message state
  +-- persist citations/references
  +-- mark assistant and stream complete/failed/cancelled
```

### Idempotency rule

The browser generates one `client_turn_id` before calling `POST /turns`. A retry of the HTTP request returns the same user message and `stream_id`; it does not create a duplicate turn. A **generation retry** is a new explicit action with a new client turn ID and a `retry_of_message_id` extension if needed.

### Stale stream rule

On stream attach, the service checks for `streaming` rows whose heartbeat/updated timestamp is older than the configured grace period. Mark them `failed` with a recoverable reason rather than pretending they are still live after a server restart.

---

# 8. API contracts for the first slice

## 8.1 Sessions

```http
POST /api/workspaces/{workspaceId}/chat-sessions
Content-Type: application/json

{ "title": "New chat" }

201
{ "session": { "id": "...", "title": "New chat", "lastMessageAt": null } }
```

```http
GET /api/workspaces/{workspaceId}/chat-sessions?cursor=...&limit=30

200
{ "items": [ ... ], "nextCursor": null }
```

```http
GET /api/chat-sessions/{sessionId}

200
{
  "session": { ... },
  "messages": [ ... ],
  "attachments": [ ... ]
}
```

## 8.2 Attachments

```http
POST /api/attachments/initiate

{
  "workspaceId": "...",
  "fileName": "manual.pdf",
  "mimeType": "application/pdf",
  "byteSize": 348102
}

201
{
  "attachmentId": "...",
  "uploadUrl": "authorized upload location",
  "expiresAt": "..."
}
```

```http
POST /api/attachments/{attachmentId}/complete

202
{ "attachment": { "id": "...", "extractionStatus": "uploaded" } }
```

The UI can attach a file only when the attachment belongs to the selected workspace. Slice one may allow text/markdown/image files only; unsupported types remain visible but cannot be sent.

## 8.3 Start a turn

```http
POST /api/chat-sessions/{sessionId}/turns
Idempotency-Key: client-generated UUID
Content-Type: application/json

{
  "content": "Compare the two policies.",
  "attachmentIds": ["att_1"],
  "referenceIds": ["ref_1"],
  "providerProfileId": "default"
}

202
{
  "userMessageId": "msg_user_1",
  "assistantMessageId": "msg_assistant_1",
  "streamId": "stream_1"
}
```

## 8.4 Replayable SSE

```http
GET /api/chat-sessions/{sessionId}/streams/{streamId}
Last-Event-ID: 12
Accept: text/event-stream
```

```text
id: 13
event: message.delta
data: {"messageId":"msg_assistant_1","delta":"The comparison is..."}

id: 14
event: reference.added
data: {"referenceId":"ref_9","label":"manual.pdf · p. 4"}

id: 15
event: done
data: {"messageId":"msg_assistant_1","status":"complete"}
```

## 8.5 Cancel

```http
POST /api/chat-sessions/{sessionId}/streams/{streamId}/cancel

202
{ "status": "cancel_requested" }
```

The provider task receives an abort signal. The assistant message remains durable with `generation_status = cancelled` and any partial content that was already emitted.

---

# 9. First vertical slice

## 9.1 Slice definition

> A workspace member can create/select a chat session, attach one contextual file or reference, submit a prompt, see an assistant response stream, inspect the stored source/reference, cancel/retry a failed generation, and reload the completed conversation without data loss.

## 9.2 Acceptance criteria

1. The sidebar lists only sessions inside the active workspace.
2. Creating a session selects it immediately.
3. Composer accepts text plus at least one ready attachment/reference.
4. The user message appears once immediately after submit.
5. A single assistant placeholder appears once and streams deltas into that same message.
6. Refreshing after completion restores both messages and source references.
7. Repeating the same start-turn request does not duplicate the user turn.
8. Stop changes the assistant message to `cancelled` and leaves partial content visible.
9. An attachment from another workspace is rejected server-side.
10. No provider key is exposed to browser JavaScript.

## 9.3 Explicitly out of scope

* Multi-pane workspace.
* Local terminal/browser/filesystem tools.
* MCP/tool calling.
* Active editing of source documents.
* Full RAG indexing pipeline.
* URL fetching, YouTube transcription, and web search.
* Shared live editing inside a chat.
* Queue workers, Redis, WebSockets, event sourcing, multi-region hosting.
* Per-message provider switching during an active stream.

## 9.4 Vertical-slice implementation order

### Step 1 — entities and repositories

Create `ChatSessionRepository`, `ChatMessageRepository`, `AttachmentRepository`, `ContextReferenceRepository`, and `ChatStreamRepository` behind interfaces. Implement them with THDB only. Do not let React call SQL/ORM code.

### Step 2 — authorization guard

Create one reusable `requireWorkspaceMembership(userId, workspaceId, minimumRole)` function. Call it from every session/attachment/stream action.

### Step 3 — session sidebar CRUD

Implement list/create/select/archive. Use optimistic selection after creation, but revalidate list data after mutation.

### Step 4 — attachment contract

Implement initiate → upload → complete. Do not begin parsing/indexing automatically in the browser. Return immutable attachment metadata to the composer.

### Step 5 — context compiler interface

```ts
export interface ContextCompiler {
  compile(input: {
    workspaceId: string;
    userMessageId: string;
    attachmentIds: string[];
    referenceIds: string[];
    text: string;
  }): Promise<{
    providerInput: ProviderMessage[];
    persistedReferences: PersistedReference[];
  }>;
}
```

Slice-one implementation can read extracted text for one ready attachment and append it behind a size limit. The compiler owns truncation and citation labels; the UI does not.

### Step 6 — turn state machine and SSE

Implement the `POST /turns`, stream attach, cancel, and replay contracts. Keep a per-session active stream guard at the service boundary.

### Step 7 — UI shell

Build `ChatShell`, `SessionSidebar`, `ChatTranscript`, `Composer`, `ContextChipTray`, `ContextInspector`, and `StreamStatus`. Use server-loaded initial session data and a client-side stream hook.

### Step 8 — tests and manual verification

Run the test matrix below before adding retrieval, tools, or document editing.

---

# 10. Source-code copy/adapt map

No file below should be copied blindly. Preserve upstream license notices when reusing code. The recommended action is intentionally conservative because both references are tightly coupled to their host runtimes.

| Repository     | Source path                                                | Existing responsibility                                | Target path                                                    | Action                   | Required modification                                                                                                    |
| -------------- | ---------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Local Studio   | `frontend/src/features/agent/ui/chat-pane-send-flow.ts`    | Compose prompt, prevent duplicate submits, abort/retry | `features/chat/hooks/use-chat-turn.ts`                         | **ADAPT**                | Remove `SessionEngine`, Pi, browser tools, skills; retain input guards, attachment normalization, cancel/retry semantics |
| Local Studio   | `frontend/src/features/agent/workspace/replay-queue.ts`    | Last-wins delayed replay after pane mount              | `features/chat/lib/stream-reattach.ts`                         | **ADAPT**                | Replace pane/session engine concepts with session/stream IDs and `Last-Event-ID` reconnect                               |
| Local Studio   | `frontend/src/features/agent/workspace/persistence.ts`     | Browser layout/session snapshots                       | `features/chat/lib/ui-preferences.ts`                          | **REFERENCE ONLY**       | Persist only panel/collapse preference; never chat records                                                               |
| Local Studio   | `frontend/src/features/agent/session-metadata-store.ts`    | Locked local JSON session metadata                     | none                                                           | **DO NOT CARRY FORWARD** | THDB repositories replace it                                                                                             |
| Local Studio   | `frontend/src/features/agent/ui/agent-workspace-shell.tsx` | Dense coding-agent shell                               | `features/chat/components/chat-shell.tsx`                      | **REFERENCE ONLY**       | Rebuild three-region shell without panes, desktop coupling, or agent tools                                               |
| Local Studio   | `frontend/src/app/api/agent/turn/*`                        | Agent turn proxy boundary                              | `api/chat-sessions/[sessionId]/turns/route.ts`                 | **REFERENCE ONLY**       | New contracts, auth, THDB state machine, provider adapter                                                                |
| Smart Composer | `src/components/chat-view/Chat.tsx`                        | Main chat interaction/state orchestration              | `features/chat/components/chat-shell.tsx`                      | **REFERENCE ONLY**       | Replace Obsidian, React Query host assumptions, file apply, tool flow; retain UX sequence                                |
| Smart Composer | `src/components/chat-view/useChatStreamManager.ts`         | Abort controllers and incremental response updates     | `features/chat/hooks/use-chat-stream.ts`                       | **ADAPT**                | Use SSE consumer; validate event sequence; server owns provider execution                                                |
| Smart Composer | `src/hooks/useChatHistory.ts`                              | Conversation list/load/debounced persistence           | `features/chat/server/session-actions.ts` + query hooks        | **ADAPT**                | Replace JSON manager/App with THDB API; server persists authoritative records                                            |
| Smart Composer | `src/database/json/chat/ChatManager.ts`                    | JSON conversation files and metadata ordering          | `features/chat/server/repositories/chat-session-repository.ts` | **REFERENCE ONLY**       | Use normalized tables/indexes; preserve title and updated-time behavior                                                  |
| Smart Composer | `src/utils/chat/promptGenerator.ts`                        | Resolve references and choose direct/RAG context       | `features/context/services/context-compiler.ts`                | **REFERENCE ONLY**       | Replace vault/file APIs with approved context resolver; remove injected Obsidian prompts                                 |
| Smart Composer | `src/components/chat-view/ChatListDropdown.tsx`            | History menu UI                                        | `features/chat/components/session-menu.tsx`                    | **ADAPT**                | Browser menu, server mutations, accessible keyboard behavior                                                             |
| Smart Composer | `src/components/chat-view/MarkdownReferenceBlock.tsx`      | Render source-aware markdown references                | `features/context/components/source-reference.tsx`             | **ADAPT**                | Use target application citation model and content policy                                                                 |
| Smart Composer | `src/database/DatabaseManager.ts`                          | Plugin-local PGlite/migration/storage                  | none                                                           | **DO NOT CARRY FORWARD** | THDB implementation owns migrations and backups                                                                          |

---

# 11. Suggested folder structure

```text
src/
├─ app/
│  ├─ (app)/
│  │  └─ workspaces/[workspaceId]/chat/
│  │     ├─ page.tsx
│  │     └─ [sessionId]/page.tsx
│  └─ api/
│     ├─ attachments/
│     ├─ chat-sessions/
│     └─ workspaces/
├─ features/
│  ├─ chat/
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ server/
│  │  │  ├─ repositories/
│  │  │  ├─ services/
│  │  │  └─ validators/
│  │  └─ types.ts
│  ├─ context/
│  │  ├─ components/
│  │  ├─ services/
│  │  └─ types.ts
│  ├─ attachments/
│  │  ├─ components/
│  │  └─ server/
│  └─ workspaces/
│     └─ server/
├─ lib/
│  ├─ auth/
│  ├─ db/
│  │  └─ thdb/
│  ├─ storage/
│  ├─ streaming/
│  ├─ providers/
│  └─ validation/
└─ types/
```

### Module rule

A feature may import from `lib/*`; a feature must not reach into another feature’s repository internals. Cross-feature communication occurs through contracts/interfaces, not direct database table access.

---

# 12. Test strategy

## Unit tests

* Context compiler rejects foreign-workspace references.
* Context compiler truncates oversized source text predictably.
* `client_turn_id` retry returns existing stream/message.
* Session title generation has a deterministic fallback.
* Stream event reducer ignores duplicate/out-of-order event IDs.
* Cancel preserves partial assistant content and closes local stream controller.

## Integration tests

* Member can create/list/read own-workspace sessions.
* Member cannot read/write a foreign workspace session or attachment.
* Upload complete transitions attachment state correctly.
* Start-turn persists exactly one user message and one assistant placeholder.
* SSE replay after reconnect resumes from `Last-Event-ID`.
* Failed provider generation writes a recoverable failed state.

## Browser tests

* Create new chat → attach file → send → observe streamed answer → inspect source.
* Switch session while streaming → current stream is cancelled or detached according to UX policy; no response appears in the new session.
* Refresh completed session → transcript and citation list reload.
* Sidebar collapses appropriately at narrow viewport.

---

# 13. Failure, loading, and empty states

| State                  | UI behavior                                                                              | Durable state                                |
| ---------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- |
| No sessions            | Centered “Start a new conversation” empty state                                          | none                                         |
| Attachment uploading   | Chip progress; send disabled for that attachment                                         | `uploaded`/pending upload                    |
| Attachment extracting  | Chip says “Preparing context”; user can remove it                                        | `extracting`                                 |
| Stream starting        | Assistant placeholder and Stop button                                                    | assistant `queued`/`streaming`               |
| Stream disconnected    | Reconnect automatically using last event ID; show unobtrusive reconnect status           | stream still `running`                       |
| Provider failure       | Preserve user turn; assistant shows retry; technical details hidden from ordinary member | assistant `failed`                           |
| Cancelled              | Preserve partial response and show “Stopped”                                             | assistant `cancelled`                        |
| Context cannot resolve | Keep user text; show failed chip/remove option; do not silently omit source              | reference failure record or validation error |

---

# 14. Decisions and risks

## Verified facts

* Local Studio has a separate controller responsible for local runtime lifecycle, proxying, system state, and SSE, while its frontend is a Next.js-based UI with an agent workspace.
* Local Studio’s send flow composes selected context and attachments, protects against repeated submits, and exposes abort/retry behavior.
* Smart Composer compiles user context before provider generation, aborts active streams before switching/starting conversations, and debounces chat persistence.
* Smart Composer stores plugin-local chat state and database assets through Obsidian-specific storage mechanisms.

## Reasonable target inferences

* Context Engine’s FastAPI backend is a cleaner streaming owner than a Next.js client or browser-held provider connection.
* A normalized THDB store plus object storage is sufficient for 5–10 users without Redis, a job queue, event sourcing, or WebSockets.
* Server-Sent Events are simpler than WebSockets for a one-way assistant stream with reconnect/replay.

## Risks

1. **Copying host-bound code.** Obsidian and Local Studio code has hidden host/runtime dependencies. Prefer semantic reuse and narrow rewrites.
2. **Misplacing persistence.** Chat content must not live only in localStorage or local JSON if users share workspaces.
3. **Duplicate turns.** The first slice must enforce idempotency before UX polish.
4. **Attachment privilege leakage.** A reference ID is never sufficient authorization by itself.
5. **Unbounded prompt size.** Context compilation must enforce a byte/token budget and preserve an explanatory source trail.
6. **SSE deployment mismatch.** Test disconnect/reconnect under the actual reverse proxy and process model early.

## Recommended next slice

Add **retrieval-backed reference picker and citation inspector**:

```text
Pick a workspace document
  -> show extraction readiness
  -> retrieve bounded relevant snippets
  -> persist source/chunk IDs on assistant answer
  -> show source preview in right panel
```

Do this before MCP, document editing, agent tools, browser browsing, or multi-pane layouts.

---

# 15. Build checklist for a junior developer

```text
[ ] Create THDB schema and migration.
[ ] Implement workspace membership guard.
[ ] Implement session list/create/read endpoints.
[ ] Build sidebar and empty state.
[ ] Implement authorized attachment upload flow.
[ ] Implement context compiler for one ready attachment/reference.
[ ] Implement idempotent start-turn endpoint.
[ ] Implement provider adapter interface.
[ ] Implement SSE stream event store and client hook.
[ ] Build transcript, composer, Stop, retry, and context panel.
[ ] Add authorization, idempotency, and reconnection tests.
[ ] Deploy behind the real proxy and test SSE reconnection.
```

---

## Final implementation stance

Build **a focused contextual-chat product**, not a browser clone of a desktop coding agent and not an Obsidian plugin moved into React. Use Smart Composer for the contextual conversation UX, use Local Studio for streaming/session robustness, and use THDB plus object storage for reliable multi-user persistence.
