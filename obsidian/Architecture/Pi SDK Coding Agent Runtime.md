---
type: architecture
status: active
audience:
  - agent
  - junior-dev
layer:
  - agent
  - frontend
  - api
lifecycle: reference
tags:
  - type/architecture
  - layer/agent
  - status/active
  - source/local-studio
---

# Pi SDK Coding Agent Runtime

Local Studio’s **coding-agent runtime**: a tool-loop harness (Pi SDK), not vector RAG.

Parent: [[Architecture Index]].

---

## One-liner

**Pi SDK / coding-agent runtime** = LLM loop that **calls tools** (fs, shell, browser, MCP) against a **local workspace**, streams progress over SSE, and persists the session as JSONL.

It is **not** embeddings / LightRAG / Evidence chat.

---

## Mental model

```text
User: "fix the auth bug"
        │
        ▼
Composer assembles context
  ($skills + @plugins + attachments)
        │
        ▼
Pi harness starts a turn
        │
        ▼
LLM → tool call → result → LLM → … → answer
  (read_file, bash, grep, browser, MCP, …)
        │
        ▼
SSE events → UI timeline
JSONL log → replay later
```

---

## Layers (Local Studio)

| Layer | What it does |
| --- | --- |
| **Composer / context assembly** | Injects skills, plugins, attachments into the prompt (filesystem-based, not vector search) |
| **Harness (`PiRuntimeManager` / `PiSdkSession`)** | Owns sessions: prompt, steer, follow-up, abort, compact, event log |
| **Pi SDK (`pi-coding-agent`)** | The agent library: tool loop + session events |
| **Tools** | Real side effects on a machine/workspace |
| **Controller (Bun/Hono)** | Optional LLM proxy: stream normalize, tool XML, models |
| **JSONL sessions** | Append-only event log for replay |

```text
Browser UI
  POST /api/agent/turn
  GET  /api/agent/runtime/events?after=N   (SSE + seq cursor)
  POST /api/agent/compact
        │
        ▼
Next.js API  →  PiRuntimeManager  →  Pi SDK
                                      ├── tools (fs, bash, browser, MCP)
                                      └── LLM
                                      ▼
                               JSONL on disk
        │
        ▼
Controller  →  /v1/chat/completions  (proxy)
```

---

## Turn lifecycle (terse)

1. Client `POST /api/agent/turn` with message, model, skills, cwd, mode (`prompt` | `steer` | `follow_up`).
2. Runtime accepts immediately (`outcome: accepted`) — fire-and-forget.
3. Client opens SSE with `after=lastEventSeq`.
4. Pi emits `message_*`, `tool_execution_*`, `agent_end`.
5. UI reducer folds events into timeline blocks.
6. Optional: compact when context window fills (summarize old turns; re-inject selected skills).

**Reconnect rule:** client tracks `lastEventSeq`; server never replays already-seen seqs.

---

## vs Context Engine RAG

| | Local Studio (Pi) | Context Engine (today) |
| --- | --- | --- |
| Job | Change/run code in a workspace | Grounded answers from Knowledge Domains |
| “Memory” | Files + tools + chat log | Domains + Evidence + citations |
| Loop | Open tool loop | Closed ops: retrieve → synthesize |
| Context inject | `$skills` `@plugins` attachments | F-012 composer refs + `PromptAssemblyService` |
| Risk | High (shell, fs, network) | Controlled (retrieve + cite) |
| Browser power | Model / skills / cwd | Message + domain + refs only |

**Architecture decision (reference review):** adopt Local Studio **UI**; do **not** adopt Pi product runtime for CE v1.

---

## CE later-release boundary

If Context Engine adds a coding agent later, keep a **hard product split**:

```text
Context Engine
├── Mode A: Grounded chat (today)
│     TurnOrchestrator + RetrievalPort + Evidence
│
└── Mode B: Coding agent (later)
      Harness + sandboxed tools + workspace
      (optional: call Mode A as a closed "search docs" tool)
```

**Do:**
- Reuse CE chat shell + typed SSE patterns
- Treat RAG as a **closed server-owned tool** (`basic_rag` / `advanced_rag`), not browser-picked Pi tools
- Sandbox, authz, and audit any shell/fs capability

**Don’t:**
- Merge Pi’s open tool loop into `domain_rag` turns
- Let browser choose tools, cwd, or middleware on grounded chat
- Import Pi as the F-007 orchestrator (CE-native `TurnOrchestrator` owns RAG)

---

## Transferable ideas (without Pi)

Steal the **shape**, not the coding runtime:

1. Modular harness + static middleware slots
2. Context assembly before the loop (CE already has F-012)
3. Fire-and-forget turn + seq-cursor SSE (CE uses DB replay instead today)
4. Closed tool registry — in CE, tools = retrieve intents / RAG modes, not bash

---

## Related

- [[Architecture Index]]
- [[Context Engine Index]]
- [[Backend-Owned Lifecycle]] — CE workers vs agent side effects
- [[Job Platform vs Backend-Owned Lifecycle]]

## Repo sources

- `.devnotes/local-studio-templates/local-studio-context-pipline.md`
- `.devnotes/01-agent-workspace-LS-wiring-map.md`
- `.references/review/local-studio/01-architecture-review.md`
- `specs/03-contracts/ai/grounded-answering.md` — CE RAG / middleware rules
- `specs/02-architecture/component-boundaries.md` — chat orchestration boundary
