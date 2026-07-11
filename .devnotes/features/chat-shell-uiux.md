Local Studio’s chat shell is a **local coding-agent workspace**, not just a normal chat UI: it combines project folders, concurrent session panes, model selection, streaming Pi-agent turns, attachments, local files, browser/canvas tools, terminal/git panels, and persisted local session replay. ([GitHub][1])

# Chat Shell — UI/UX Feature Notes and Context Engine Adaptation

## Purpose

```text
Local Studio chat shell
= local coding-agent workspace

Context Engine chat shell
= evidence-grounded domain chat workspace
```

The visual shell is highly reusable. The local-machine agent behavior is not.

```text
Keep:
- conversation timeline
- streaming state
- composer
- attachments
- history
- model/status presentation
- right-side contextual panel
- error / retry / stop UX

Replace:
- Pi runtime
- local filesystem paths
- terminal
- Git
- browser automation
- host-level skills
- arbitrary model-controller selection
```

---

## Feature decision

```text
features/agent/*
Status: Adapt selectively
Complexity: High in Local Studio
Complexity: Medium for Context Engine evidence chat

Retain:
Chat UX patterns and state transitions.

Do not copy directly:
Local project, terminal, filesystem, browser-agent, canvas, and Pi runtime layers.
```

---

# 1. Current Local Studio Chat Shell

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Projects / Chats        │ Damper fault review                       [•••] │
│                         │ Qwen3-32B · Context 18K / 32K        [Panel ▸] │
│ Pinned                  ├─────────────────────────────────────────────────┤
│ • Bearing failure       │ You                                              │
│ • Supplier RFQ          │ Compare the NVH patterns from these files.       │
│                         │ [ test_01.csv ] [ test_02.csv ]                 │
│ Projects                │                                                 │
│ ▾ Context Engine        │ Assistant                                       │
│   • RAG shell plan      │ I found three relevant harmonic changes…         │
│   • Dashboard notes     │                                                 │
│                         │ ▾ Retrieval                                     │
│ Chats                   │   1. NVH_Test_01 · chunk 42                     │
│   • Damper review       │   2. NVH_Test_02 · chunk 18                     │
│   • Untitled chat       │                                                 │
│                         │ ▾ Tool activity                                 │
│                         │   read_file · complete                          │
│                         ├─────────────────────────────────────────────────┤
│                         │ [$ Fault-analysis] [/ Summarize]                │
│                         │ [Attach]  Ask anything…                    [↑] │
│                         │ ~/projects/context-engine · main · 18K / 32K    │
└────────────────────────────────────────────────────────────────────────────┘
```

The current shell supports project navigation, session panes, a focused chat pane, a context-sensitive right panel, and a compact quick-composer mode. It can split the workspace into independent panes, each tied to its own runtime/session identity. ([GitHub][1])

---

# 2. Current Feature Boundary

```text
frontend/src/features/agent/
├─ ui/
│  ├─ agent-workspace-shell.tsx      # Full workspace shell
│  ├─ chat-pane.tsx                  # One active chat/session pane
│  ├─ timeline/                      # Message and tool-event timeline
│  ├─ agent-composer-*               # Composer UI components
│  ├─ projects-nav/                  # Projects, chats, pinned sessions
│  ├─ filesystem-panel.tsx           # Local file explorer/editor
│  ├─ terminal-panel.tsx             # Host terminal
│  ├─ git-diff-panel.tsx             # Git changes
│  ├─ plan-panel.tsx                 # Agent plan
│  └─ agent-browser-panel.tsx        # Browser tool
│
├─ runtime/
│  ├─ engine.ts                      # Turn/session orchestration
│  ├─ prompt-stream.ts               # Optimistic submit + stream handling
│  └─ session-runtime-controller.ts  # SSE ownership and reconciliation
│
├─ messages/
│  ├─ types.ts                       # Chat message/block contracts
│  ├─ replay.ts                      # Session event → chat transcript
│  └─ export-markdown.ts             # Export conversation
│
└─ projects/
   ├─ context.tsx
   ├─ store.ts
   └─ types.ts
```

---

# 3. Shell Layout

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ App sidebar                                                                │
│                                                                             │
│  Projects                                                                   │
│  Chats                                                                      │
│  Pinned sessions                                                            │
├──────────────────────┬───────────────────────────────────┬─────────────────┤
│ Project/session nav  │ Chat pane                         │ Context panel   │
│                      │                                   │                 │
│ • Sessions           │ Header                            │ Browser         │
│ • History            │ Timeline                          │ Files           │
│ • Pinned             │ Composer                          │ Git             │
│ • Add project        │                                   │ Terminal        │
│                      │                                   │ Status          │
└──────────────────────┴───────────────────────────────────┴─────────────────┘
```

### Current Local Studio responsibility

| Area            | What it does                                                         |
| --------------- | -------------------------------------------------------------------- |
| Left navigation | Lists projects, chats, pinned sessions, and background activity.     |
| Main pane       | Renders a single chat session, model state, timeline, and composer.  |
| Pane grid       | Lets users split into independent parallel chat sessions.            |
| Right panel     | Shows browser, local files, Git, terminal, plan, and machine status. |
| Quick panel     | Provides a compact, chrome-free chat composer opened separately.     |

The focused chat pane controls which project and session the right-hand tools follow; this prevents side panels from staying attached to a previously active project after a split or tab switch. ([GitHub][1])

---

# 4. Chat Header

```text
┌───────────────────────────────────────────────────────────────────┐
│ Damper fault review                                      [•••] [▸] │
│ Qwen3-32B · active · Context 18K / 32K                             │
├───────────────────────────────────────────────────────────────────┤
│ • Rename session                                                    │
│ • Pin / Unpin                                                       │
│ • Fork                                                              │
│ • Export as Markdown                                                │
│ • Show / hide reasoning                                             │
│ • Close pane                                                        │
└───────────────────────────────────────────────────────────────────┘
```

### Header actions

| Action             | Current purpose                            | Context Engine decision                                            |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| Rename             | Changes conversation title                 | Keep                                                               |
| Pin                | Surfaces important sessions                | Keep                                                               |
| Fork               | Creates alternate branch of a conversation | Keep later; not first slice                                        |
| Export Markdown    | Downloads session transcript               | Keep                                                               |
| Show reasoning     | Reveals model reasoning blocks             | Do not expose by default; retain only for approved diagnostic mode |
| Close pane         | Closes local workspace pane                | Replace with normal tab/session navigation                         |
| Right panel toggle | Opens tool/context side panel              | Keep; turn into Evidence panel                                     |

The current header supports rename, pin, fork, Markdown export, reasoning visibility, close, and right-panel control. ([GitHub][2])

---

# 5. Conversation Timeline

```text
┌──────────────────────────────────────────────────────────────────────┐
│ You                                                                  │
│ Compare the failure signatures in the attached test results.         │
│ [ run_01.csv ] [ run_02.csv ]                                        │
│                                                                      │
│ Assistant                                                            │
│ The strongest difference is a repeated 2× rotational harmonic...    │
│                                                                      │
│ ▾ Retrieval evidence                                                 │
│   Source: damper_test_report.md · chunk 42                           │
│   Source: nvh_summary.pdf · page 18                                  │
│                                                                      │
│ ▾ Processing                                                         │
│   Searching domain: Damper Fault Knowledge Base                      │
│   Reranking 24 candidate chunks                                      │
│                                                                      │
│ Assistant                                                            │
│ Recommended next check: compare residual energy around 120 Hz.       │
└──────────────────────────────────────────────────────────────────────┘
```

### Current message block types

```text
User message
Assistant text
Assistant thinking
Tool call
Tool result
Runtime event
Attachment
```

```ts
type AssistantBlock =
  | { kind: "text"; text: string }
  | { kind: "thinking"; text: string }
  | { kind: "tool"; status: "running" | "done" | "error" }
  | { kind: "event"; text: string };
```

The timeline merges adjacent assistant events, supports live rendering, hides empty assistant bubbles, keeps users pinned to the latest output while streaming, and shows a “New messages” control once the user intentionally scrolls away. ([GitHub][3])

---

## Timeline UX rules to retain

```text
1. Auto-scroll while the user is already at the bottom.
2. Do not fight the user when they scroll upward.
3. Show “New messages” during a live turn.
4. Keep tool/retrieval work collapsible.
5. Render a visible streaming/Thinking state before final output exists.
6. Preserve user attachments in the transcript.
7. Keep long technical responses readable with Markdown.
```

---

# 6. Composer

```text
┌─────────────────────────────────────────────────────────────────────┐
│ [$ Fault-analysis]  [/ Summarize evidence]                           │
│ [ @ bearing_test.csv ]                                                │
├─────────────────────────────────────────────────────────────────────┤
│ [+] Ask a question about this domain…                         [Send] │
├─────────────────────────────────────────────────────────────────────┤
│ Domain: Damper Faults · 18K / 32K context · Source-aware chat        │
└─────────────────────────────────────────────────────────────────────┘
```

### Current Local Studio composer capabilities

| Capability      | Local Studio behavior                  | Context Engine adaptation                            |
| --------------- | -------------------------------------- | ---------------------------------------------------- |
| Text prompt     | Sends normal agent turn                | Keep                                                 |
| Enter           | Submit                                 | Keep                                                 |
| Shift+Enter     | New line                               | Keep                                                 |
| Escape / Ctrl+. | Stop active turn                       | Keep                                                 |
| Tab             | Queue follow-up prompt                 | Defer unless backend supports queued turns           |
| File attachment | File picker, paste, drag/drop          | Keep, but upload to managed attachment storage       |
| `@` mention     | Adds local project file as context     | Replace with domain/source/document mention          |
| `$` mention     | Adds local skill instructions          | Replace with approved query mode or workspace prompt |
| `/` mention     | Adds prompt template                   | Keep as approved command templates                   |
| Browser tool    | Enables host/browser agent             | Remove from Context Engine v1                        |
| Canvas          | Enables local canvas behavior          | Defer                                                |
| Model picker    | Selects model across local controllers | Replace with domain + approved model profile display |

The composer currently supports pasted files/images, drag-and-drop attachments, file mentions, skill mentions, prompt templates, browser/canvas toggles, queue/steer/stop states, and model selection. ([GitHub][4])

---

## Mention system

```text
@file-name
= attach a file as prompt context

$skill-name
= add reusable operating instructions

/template-name
= load a reusable prompt template
```

```text
┌──────────────────────────────────────────────────────────────────┐
│ Ask about @damper...                                              │
├──────────────────────────────────────────────────────────────────┤
│ Files                                                            │
│ Type to filter · Enter to attach                                 │
│                                                                  │
│ damper_test_report.md                                            │
│ tests/nvh/damper_test_report.md                                  │
│                                                                  │
│ damper_run_01.csv                                                │
│ tests/nvh/damper_run_01.csv                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Context Engine mention replacement

```text
@source
= attach an approved source document or file

#domain
= constrain the query to a Knowledge Domain

$mode
= choose an approved query/retrieval mode

/template
= insert an approved prompt template
```

```text
Example

#fatigue @damper_test_report.md
Compare failure signatures and cite the supporting sections.

$strict-evidence
Only answer when evidence directly supports the claim.
```

---

# 7. Attachments

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Attachments                                                         │
│ [ test_01.csv · 1.2 MB × ] [ test_02.csv · 840 KB × ]              │
│                                                                     │
│ Drop files to attach to the next message.                           │
└─────────────────────────────────────────────────────────────────────┘
```

Current attachment modes include text, data URL, and metadata-only references. Images can be supplied to vision-capable models; durable data URLs are preferred over temporary browser blob URLs when session replay is needed. ([GitHub][5])

### Context Engine attachment policy

```text
Temporary chat attachment
  → virus/type/size validation
  → object storage or managed document storage
  → canonical document record
  → optional parser/index job
  → attachment reference in conversation message
```

Do not put large file content or browser data URLs directly into persistent conversation rows.

---

# 8. Turn, Queue, Steer, Retry, and Stop

## Standard submit

```text
User enters prompt
   │
   ▼
Optimistically append:
- user message
- empty assistant bubble
   │
   ▼
POST turn request
   │
   ▼
Receive accepted runtime/session identity
   │
   ▼
Open or resume SSE stream
   │
   ▼
Append text/tool/event blocks
   │
   ▼
Terminal event
   │
   ├─ completed → status idle
   ├─ cancelled → status idle
   └─ failed → retry affordance
```

The Local Studio shell uses an optimistic user message and assistant placeholder, submits a turn, then hydrates the transcript through event replay and live runtime events. ([GitHub][6])

## While a turn is running

```text
┌─────────────────────────────────────────────────────────────────────┐
│ Assistant is working…                                               │
│                                                                     │
│ [ Follow-up question ]                              [Queue] [Steer] │
│                                                                     │
│                                            [ Stop ]                  │
└─────────────────────────────────────────────────────────────────────┘
```

| Action  | Local Studio meaning                           | Context Engine recommendation                     |
| ------- | ---------------------------------------------- | ------------------------------------------------- |
| Queue   | Ask after current agent turn completes         | Defer in v1                                       |
| Steer   | Inject next instruction into active agent turn | Defer unless agentic retrieval supports it        |
| Stop    | Abort model response                           | Keep                                              |
| Retry   | Resend last failed user prompt                 | Keep                                              |
| Compact | Summarize/reduce session context               | Keep later when conversation windows become large |

The current runtime distinguishes an immediate `steer` control message from a queued `follow_up`; it prevents duplicate concurrent submits per session and restores failed prompts for retry. ([GitHub][7])

---

# 9. Streaming and Session Recovery

```text
POST /api/agent/turn
        │
        ▼
Runtime starts / resumes Pi session
        │
        ▼
GET /api/agent/runtime/events?sessionId=...&after=...
        │
        ▼
SSE events
├─ status
├─ message update
├─ tool call
├─ tool result
├─ thinking/event block
└─ agent end
        │
        ▼
Reducer updates session state
```

Local Studio intentionally centralizes runtime SSE subscription ownership in one session runtime controller. It tracks event cursors, reconnects streams, avoids replaying already-rendered content, reconciles running/idle state through polling, and preserves background-session activity indicators. ([GitHub][8])

### Context Engine streaming model

```text
POST /chat/conversations/:conversationId/messages
        │
        ▼
Create user message + query run
        │
        ▼
SSE /chat/runs/:runId/events
        │
        ├─ retrieval_started
        ├─ retrieval_complete
        ├─ evidence_selected
        ├─ generation_delta
        ├─ citation_added
        ├─ completed
        ├─ failed
        └─ cancelled
        │
        ▼
Persist final assistant message + evidence references
```

Use SSE. It matches the existing UX and is sufficient for one-way retrieval/generation progress.

---

# 10. Session History

```text
┌──────────────────────────────────────────────────────────────────┐
│ Chats                                                            │
│                                                                  │
│ ● Damper fault review                         active              │
│ ○ Supplier product comparison                 2h ago              │
│ ○ LightRAG architecture notes                 yesterday            │
│                                                                  │
│ Pinned                                                           │
│ ★ Production failure investigation                              │
└──────────────────────────────────────────────────────────────────┘
```

Current Local Studio sessions are linked to a local absolute project directory (`cwd`), loaded from local session files, replayed into message blocks, and archived through sidecar metadata rather than permanently deleted through the normal UI. ([GitHub][9])

### Context Engine replacement

```text
Conversation
├─ conversationId
├─ domainId
├─ workspaceId
├─ createdBy
├─ title
├─ pinned
├─ archivedAt
├─ createdAt
└─ updatedAt

Message
├─ messageId
├─ conversationId
├─ role
├─ text
├─ status
├─ attachments[]
├─ evidenceRefs[]
├─ model/profile metadata
└─ timestamps
```

```text
Do not use:
cwd
host filesystem paths
Pi JSONL path lookup
browser-provided project roots

Use:
conversationId
workspaceId
domainId
actorId
attachmentId
evidenceRefId
```

---

# 11. Model Picker

```text
┌──────────────────────────────────────────────────────────────┐
│ [ Qwen3-32B ▾ ]                                               │
├──────────────────────────────────────────────────────────────┤
│ Search models…                                                │
│                                                              │
│ Local GPU                                                     │
│ ● Qwen3-32B       running · R · 32K context                  │
│   Llama-3.3-70B   128K context                               │
│                                                              │
│ Cloud provider                                                │
│   GPT-compatible model · V · 128K context                    │
└──────────────────────────────────────────────────────────────┘
```

The current picker groups models by saved controller, supports keyboard search/navigation, exposes reasoning/vision capability, and warns when the selected model is not currently running. ([GitHub][10])

### Context Engine replacement

```text
┌──────────────────────────────────────────────────────────────┐
│ Domain [ Damper Fault Knowledge Base ▾ ]                      │
│ Model profile [ Default research model ▾ ]                    │
│ Mode [ Evidence-grounded ▾ ]                                 │
└──────────────────────────────────────────────────────────────┘
```

| Local Studio control       | Context Engine control               |
| -------------------------- | ------------------------------------ |
| Saved controller picker    | Authorized domain/workspace selector |
| Raw model picker           | Admin-approved model profile         |
| Local runtime availability | Provider/profile availability        |
| Browser-held API key       | Server-side provider credential      |
| Model active warning       | Provider/runtime health badge        |

Normal users may select an approved profile only when policy allows it. The backend decides the provider/model/embedding route.

---

# 12. Right Panel: Replace Tools With Evidence

## Do not copy the Local Studio computer panel

```text
Local Studio right panel
- Browser
- Files
- Git
- Terminal
- Plan
- Status
```

Those are valid for a trusted local coding-agent workstation. They are unsafe or unnecessary for Context Engine v1.

## Context Engine right panel

```text
┌──────────────────────────────────────────────────────────────┐
│ Evidence                                                      │
│ [ Context ] [ Sources ] [ Attachments ]                       │
├──────────────────────────────────────────────────────────────┤
│ Retrieved evidence                                            │
│                                                              │
│ 1. Damper Test Report                                         │
│    Section 4.2 · force velocity residual                     │
│    Relevance: high                             [ Open ]       │
│                                                              │
│ 2. NVH Analysis                                               │
│    Page 18 · rotational harmonic signature                   │
│    Relevance: medium                           [ Open ]       │
│                                                              │
│ Attached to this conversation                                 │
│ • damper_run_01.csv                                           │
│ • test_observations.md                                        │
└──────────────────────────────────────────────────────────────┘
```

### Right-panel tabs

| Tab         | Purpose                                                           |
| ----------- | ----------------------------------------------------------------- |
| Context     | Query mode, selected domain, model profile, token/context summary |
| Evidence    | Retrieved chunks, citations, relevance, source navigation         |
| Sources     | Current domain document tree and linked source metadata           |
| Attachments | Files attached to this conversation or current message            |
| Activity    | Retrieval, rerank, generation, parse/index events                 |
| Details     | Conversation metadata, cost, duration, model/provider route       |

---

# 13. Context Engine Target Chat Shell

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Knowledge Domains             │ Damper fault review                [•••] │
│                               │ Domain: Damper Faults · Evidence mode     │
│ ▾ My conversations            ├───────────────────────────────────────────┤
│ • Damper fault review         │ You                                       │
│ • Gear vibration comparison   │ Compare these two failure signals.        │
│                               │ [ damper_run_01.csv ]                     │
│ ▾ Domains                     │                                           │
│ • Damper Faults               │ Assistant                                 │
│ • Engineering Standards       │ The 2× harmonic increases after…          │
│ • Supplier Documents          │                                           │
│                               │ [1] Test report · section 4.2             │
│                               │ [2] NVH analysis · page 18                │
│                               │                                           │
│                               ├───────────────────────────┬───────────────┤
│                               │ #Damper Faults             │ Evidence      │
│                               │ @source $strict-evidence   │ [1] Report    │
│                               │ Ask a question…      [↑]   │ [2] NVH       │
│                               └───────────────────────────┴───────────────┘
└────────────────────────────────────────────────────────────────────────────┘
```

---

# 14. Context Engine Chat State Model

```text
draft
  │
  ▼
submitted
  │
  ├─ validating attachment/domain access
  │
  ▼
retrieving
  │
  ├─ evidence selected
  │
  ▼
synthesizing
  │
  ├─ streaming response
  │
  ▼
completed
  │
  ├─ citations persisted
  ├─ usage/cost recorded
  └─ conversation updated

Failure branches:
submitted     → rejected
retrieving    → failed
synthesizing  → cancelled
synthesizing  → failed → retry available
```

---

# 15. Keep, Adapt, Defer, Remove

| Local Studio feature                | Decision for Context Engine                         |
| ----------------------------------- | --------------------------------------------------- |
| Conversation timeline               | Keep                                                |
| Streaming assistant bubble          | Keep                                                |
| Markdown rendering                  | Keep                                                |
| Auto-scroll / “New messages”        | Keep                                                |
| Retry / stop turn                   | Keep                                                |
| Session title, pin, archive, export | Keep                                                |
| Attachments                         | Keep; move to managed storage                       |
| Prompt templates                    | Keep; workspace/domain scoped                       |
| Skills                              | Adapt into approved query modes/system instructions |
| `@` local file mention              | Replace with source/domain/document mention         |
| Model picker                        | Replace with policy-governed model profile          |
| Multi-pane split workspace          | Defer                                               |
| Fork conversation                   | Defer                                               |
| Queue / steer                       | Defer                                               |
| Pi session runtime                  | Remove                                              |
| Absolute `cwd` path                 | Remove                                              |
| Local project navigation            | Replace with domains/conversations                  |
| Filesystem editor                   | Remove                                              |
| Terminal                            | Remove                                              |
| Git panel                           | Remove                                              |
| Browser automation                  | Remove from v1                                      |
| Canvas                              | Defer                                               |
| Local host skill discovery          | Replace with workspace skill registry               |
| Local JSONL session persistence     | Replace with database persistence                   |

---

# 16. Lean Context Engine API Surface

```text
POST /chat/conversations
GET  /chat/conversations
GET  /chat/conversations/:conversationId
PATCH /chat/conversations/:conversationId
POST /chat/conversations/:conversationId/archive

POST /chat/conversations/:conversationId/messages
POST /chat/runs/:runId/cancel
GET  /chat/runs/:runId/events

POST /chat/attachments
GET  /chat/attachments/:attachmentId

GET  /domains
GET  /domains/:domainId/sources
GET  /evidence/:evidenceRefId
```

### Minimal request

```ts
interface SendChatMessageRequest {
  domainId: string;
  text: string;
  attachmentIds?: string[];
  sourceIds?: string[];
  queryMode?: "evidence" | "balanced";
  modelProfileId?: string;
}
```

### Minimal response event

```ts
type ChatRunEvent =
  | { type: "retrieval_started"; runId: string }
  | { type: "evidence_selected"; evidenceRefs: EvidenceRef[] }
  | { type: "generation_delta"; text: string }
  | { type: "citation_added"; evidenceRef: EvidenceRef }
  | { type: "completed"; messageId: string; usage: UsageSummary }
  | { type: "failed"; message: string }
  | { type: "cancelled" };
```

---

# 17. Junior Developer Rules

```text
1. Build one chat pane first.
   Do not begin with split panes, terminals, browser tools, or agent plans.

2. Make conversation history server-authoritative.
   The browser may hold a draft, but messages and evidence belong in the database.

3. Persist citations with the assistant message.
   Do not reconstruct evidence only from rendered Markdown later.

4. Stream generation and retrieval progress over SSE.
   One stream owner should manage reconnect, cursor, and event ordering.

5. Do not accept a browser-supplied filesystem path.
   Attachments and sources must resolve from authorized IDs.

6. Keep attachments separate from the prompt body.
   Store attachment IDs in the message; build prompt context server-side.

7. Separate user-visible evidence from internal agent/tool traces.
   Normal users should see retrieval progress and citations, not raw host/tool output.

8. Use a domain selector, not a controller URL picker.
   Node/provider/model resolution is backend policy.

9. Keep the composer simple.
   Text, upload, source/domain mention, query mode, stop, retry.

10. Defer advanced agent behavior.
    Queue, steer, fork, split panes, browser, terminal, and canvas are not
    needed for the first Context Engine evidence-chat vertical slice.
```

---

# 18. First Context Engine Vertical Slice

```text
Conversation list
  → select domain
  → create conversation
  → attach one file or choose one source
  → send message
  → SSE retrieval/generation events
  → render evidence citations
  → persist history
  → reopen conversation
```

```text
Acceptance criteria

[ ] User can create and rename a conversation.
[ ] User can select one authorized Knowledge Domain.
[ ] User can attach an approved file.
[ ] User sees retrieval progress before response generation.
[ ] Assistant answer contains clickable evidence references.
[ ] Refresh restores conversation and citations.
[ ] Stop cancels active generation.
[ ] Retry reuses the last user message.
[ ] User cannot query an unauthorized domain.
[ ] Browser never passes raw provider credentials or host file paths.
```

---

## Evidence

* Workspace shell, focused-session behavior, right-side panel, pane grid, compact quick panel, and local project empty state: `agent-workspace-shell.tsx`, `app/agent/page.tsx`, `app/quick/page.tsx`. ([GitHub][1])
* Chat pane composition, session export, retry, attachments, model capability, tool options, and composer wiring: `chat-pane.tsx`. ([GitHub][11])
* Composer mentions, file attachments, drag/drop, paste handling, keyboard actions, selected skills/templates, and queue behavior: `chat-pane-composer.ts`, `chat-pane-composer-attachments.ts`, `chat-pane-composer-mention-selection.ts`, `agent-composer-frame.tsx`. ([GitHub][4])
* Message blocks, session data shape, event replay, and timeline scroll behavior: `messages/types.ts`, `messages/replay.ts`, `timeline/timeline.tsx`. ([GitHub][3])
* Optimistic turns, runtime control messages, aborts, compaction, SSE cursor ordering, reconnects, and runtime status arbitration: `runtime/engine.ts`, `runtime/prompt-stream.ts`, `runtime/session-runtime-controller.ts`, `runtime/api.ts`. ([GitHub][12])
* Local Pi turn runtime, SSE event route, local filesystem access, and local session-history dependency on absolute working directories: `app/api/agent/turn`, `runtime/events`, `fs/file`, and `sessions` routes. ([GitHub][13])

**Recommended Context Engine implementation order:** build the single evidence-chat pane and right-side Evidence panel first; defer all local coding-agent workspace tools.

[1]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/agent-workspace-shell.tsx "raw.githubusercontent.com"
[2]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/agent-chat-pane-header.tsx "raw.githubusercontent.com"
[3]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/timeline/timeline.tsx "raw.githubusercontent.com"
[4]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/chat-pane-composer.ts "raw.githubusercontent.com"
[5]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/agent-attachment-tray.tsx "raw.githubusercontent.com"
[6]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/runtime/prompt-stream.ts "raw.githubusercontent.com"
[7]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/chat-pane-send-flow.ts "raw.githubusercontent.com"
[8]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/runtime/session-runtime-controller.ts "raw.githubusercontent.com"
[9]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/app/api/agent/sessions/route.ts "raw.githubusercontent.com"
[10]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/agent-model-picker.tsx "raw.githubusercontent.com"
[11]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/ui/chat-pane.tsx "raw.githubusercontent.com"
[12]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/features/agent/runtime/engine.ts "raw.githubusercontent.com"
[13]: https://raw.githubusercontent.com/sybil-solutions/local-studio/main/frontend/src/app/api/agent/turn/route.ts "raw.githubusercontent.com"
