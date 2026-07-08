# Agent Workspace — Complete Wiring Map (Junior Dev / Agent Guide)

**Evidence note:** `.references/code/local-studio` is empty in this repo. Use:
- **Template parity slice:** `.reference-LS-frontend/templates/nextjs-feature-demos/features/agent-workspace/`
- **Upstream source:** `sybil-solutions/local-studio` on GitHub (fetched below)
- **CE rebuild target:** `frontend/src/features/chat-shell/` + FastAPI `context_engine/`

---

## 1. What Agent Workspace Is

Local Studio `/agent` = **coding-agent workstation**, not RAG chat.

```txt
┌─────────────────────────────────────────────────────────────────────────┐
│ BROWSER  /agent                                                         │
│  ┌─ pane grid (1..N chat panes) ─────────────┐ ┌─ computer panel ─────┐ │
│  │ header · timeline · composer · status bar  │ │ 9 tool tabs        │ │
│  └────────────────────────────────────────────┘ └────────────────────┘ │
│  /agent/sessions table + ⌘K command palette                           │
└─────────────────────────────────────────────────────────────────────────┘
         │ fetch/EventSource                    │ REST (logs, models, etc.)
         ▼                                      ▼
┌──────────────────────┐              ┌──────────────────────┐
│ Next.js /api/agent/* │──proxy──────▶│ Bun/Hono controller │
│ (BFF + auth guard)   │   optional   │ models, proxy, logs │
└──────────────────────┘              └──────────────────────┘
         │
         ▼
┌──────────────────────┐
│ agent-runtime (Pi)   │  ← tool loop, session JSONL, SSE pi events
└──────────────────────┘
```

**CE rebuild rule:** adopt **UI + interaction patterns**. Replace **controller + Pi runtime** with **FastAPI + governed RAG turn path** (F-007/F-012).

---

## 2. Layer Ownership (who owns what)

| Layer | Owns | Must NOT own |
|-------|------|--------------|
| **React components** | render, layout, composer text, chips, pane focus | secrets, cwd paths, tool execution |
| **Hook / engine** | optimistic UI, stream token, localStorage layout | canonical session truth |
| **api/index.ts seam** | fetch/SSE transport | business rules |
| **Next /api/agent/*** | auth guard, proxy pass-through | Pi logic (delegates) |
| **agent-runtime** | turn loop, tools, pi events, compaction | browser state |
| **controller** | GPU/models/recipes/proxy/logs/metrics | chat transcript |
| **FastAPI (CE target)** | auth, turns, prompt assembly, retrieval, audit, trace | DOM, pane layout |

---

## 3. Frontend Module Map (original LS)

```txt
app/agent/page.tsx
 └─ AgentWorkspaceShell
     ├─ PaneGrid ─────────── workspace/layout.ts (binary split tree)
     ├─ ChatPane ─────────── chat-pane.tsx
     │    ├─ Timeline ────── pi-event-applier output
     │    ├─ ComposerFrame ─ chat-pane-send-flow.ts (prompt build + submit)
     │    └─ StatusBar ──── cwd · git · tokens
     ├─ ComputerPanel ────── 9 tabs (status/tools/plan/fs/git/term/browser/canvas/side-chat)
     └─ SessionsCommand ──── ⌘K palette

features/agent/runtime/
 ├─ api.ts ───────────────── HTTP + EventSource client
 ├─ engine.ts ────────────── useSessionEngine (submit/abort/replay/compact)
 ├─ session-runtime-controller.ts ─ THE ONLY SSE owner
 ├─ pi-event-applier.ts ──── PiEvent → TimelineBlock reducer
 ├─ prompt-stream.ts ─────── optimistic turn + guards
 └─ runtime-schema.ts ────── status|pi frame decode

features/agent/ui/
 └─ chat-pane-send-flow.ts ─ prompt = browserCtx + skills + attachments + user text

app/api/agent/
 ├─ turn/route.ts ───────── proxy OR in-process handleAgentTurn
 ├─ runtime/events ──────── SSE
 ├─ abort, compact, sessions/*
 └─ proxy-to-runtime.ts ─── LOCAL_STUDIO_AGENT_RUNTIME_URL switch
```

**Template mirror (swap point for FastAPI):**

```txt
.reference-LS-frontend/.../agent-workspace/
  components/   ← never fetch
  hooks/use-agent-workspace.ts
  api/index.ts  ← EDIT HERE ONLY for backend swap
  types/index.ts ← contract = Pydantic models
```

---

## 4. End-to-End Turn Pipeline (context + stream)

```txt
USER types + @plugins $skills /templates + attachments
        │
        ▼
chat-pane-send-flow.buildPromptArgs()
  prompt = browserContext + selectedContextPrompt(skills) + attachmentPrompt
  displayText kept separate from compiled prompt
        │
        ▼
guards: no empty · model selected · no duplicate in-flight submit
        │
        ▼
engine.submitPrompt() / sendControl(steer|follow_up)
        │
        ▼
POST /api/agent/turn
  { sessionId, modelId, message, cwd, piSessionId, mode?,
    browserToolEnabled, skills[], promptTemplates[], images[] }
        │
        ▼
Next route: requireApiAccess → proxyToAgentRuntime OR handleAgentTurn
        │
        ▼
agent-runtime accepts → returns { outcome, piSessionId, status, runtimeEventSeq }
        │
        ├─ sessionRuntimeController.noteTurnAccepted()
        │
        ▼
EventSource GET /api/agent/runtime/events?sessionId&after=seq&piSessionId
        │
        ▼
session-runtime-controller (SINGLE OWNER)
  · seq gate (dedup/reconnect)
  · text-delta coalescer (rAF batching)
  · pi-event-applier → session.messages
  · poll /runtime/sessions every 5s (running/idle arbitration)
  · agent_end → drain queue, idle session
        │
        ▼
Timeline renders blocks: thinking · tool · text · event
```

### Steer / Queue / Stop semantics

```txt
WHILE running:
  Enter (composer)  → steer  (mode:"steer")     immediate control message
  Tab               → queue  (mode:"follow_up") after current turn
  Stop              → POST /api/agent/abort
  Esc               → close palette / abort UI

agent_end → queue_update reconciliation → auto-send next queued item
```

---

## 5. SSE Contract (the wire grammar — keep exact for parity)

Every `data:` line = JSON frame with `type`:

```jsonc
// lifecycle
{"type":"status","phase":"running|idle|done",
 "session":{"active":true,"running":true,"piSessionId":"…",
            "modelId":"…","contextUsage":{"tokens":41230,"contextWindow":131072,"percent":31}}}

// agent events
{"type":"pi","seq":1,"event":{"type":"message_start","messageId":"a-1"}}
{"type":"pi","seq":2,"event":{"type":"message_update","messageId":"a-1",
  "assistantMessageEvent":{"type":"thinking_delta","delta":"…"}}}
{"type":"pi","seq":N,"event":{"type":"tool_execution_start",…}}
{"type":"pi","seq":N,"event":{"type":"tool_execution_end",…}}
{"type":"pi","seq":N,"event":{"type":"message_update",
  "assistantMessageEvent":{"type":"text_delta","delta":"…"}}}
{"type":"pi","seq":N,"event":{"type":"message_end","messageId":"a-1"}}
{"type":"pi","seq":N,"event":{"type":"agent_end"}}
{"type":"pi","seq":N,"event":{"type":"compaction_end","result":"…"}}
{"type":"pi","seq":N,"event":{"type":"queue_update","followUp":[…]}}
```

**Applier location:** `use-agent-workspace.ts` `applyPiEvent()` (simplified) ↔ upstream `pi-event-applier.ts` (full).

---

## 6. API Surface (Agent slice)

| Endpoint | Method | Caller | Purpose |
|----------|--------|--------|---------|
| `/api/agent/turn` | POST | `runtime/api.ts` | submit / steer / follow_up |
| `/api/agent/abort` | POST | engine | stop turn |
| `/api/agent/compact` | POST | Status tab | context compaction |
| `/api/agent/runtime/events` | SSE GET | session-runtime-controller | live pi stream |
| `/api/agent/runtime/status` | GET | controller poll / reconnect | liveness + backlog |
| `/api/agent/runtime/sessions` | GET | poll (5s) | active runtime list |
| `/api/agent/sessions/all?since=90d` | GET | sessions page | index rows |
| `/api/agent/sessions/{piSessionId}?cwd&tail&before` | GET | loadAndReplay | canonical JSONL replay |

**Proxy pattern (critical for SSE):**

```txt
LOCAL_STUDIO_AGENT_RUNTIME_URL set?
  YES → Next proxies body stream pass-through (SSE not buffered)
  NO  → in-process handler (dev default)
```

---

## 7. State Model

### Server-owned (agent-runtime + JSONL)

```txt
piSessionId, canonical event log, tool runs, compaction, queue server-side
```

### Browser-owned (React + localStorage)

```txt
PaneLayout tree        → local-studio.agent.paneState
Computer width/tab     → local-studio.agent.computer.*
Composer input/chips   → ephemeral
messagesBySession      → hydrated from SSE + replay (UI cache, not authority)
runningSessionId       → derived from stream
streamToken            → abort stale async iterators
```

### Singleton controller (app lifetime)

```txt
sessionRuntimeController
  cursors, attachments, coalescer, poll timer, connectionKeyOverrides
  ONLY module allowed to open runtime EventSource
```

---

## 8. Telemetry & Logging Wiring

### Local Studio (original)

```txt
┌─ /logs ─────────────────────────────────────────────────────────┐
│ useLogs hook                                                    │
│  GET /logs → session list                                       │
│  GET /logs/{id}?limit=2000 → lines                              │
│  SSE /api/proxy/logs/{id}/stream?tail=0 → event:"log"          │
│       payload: { data: { session_id, line } }                   │
│  cap 20_000 rendered lines                                      │
└─────────────────────────────────────────────────────────────────┘

┌─ /server ───────────────────────────────────────────────────────┐
│ ServerConsole + realtime status                                 │
│  controller URL pill, connection/runtime/backends/sessions      │
│  tabs: Server Logs | API Docs (OpenAPI iframe/srcdoc)           │
│  GET /api/proxy/api/spec                                        │
└─────────────────────────────────────────────────────────────────┘

┌─ controller (Bun/Hono) ───────────────────────────────────────┐
│ modules/system: metrics (prom-client), logs, usage, events      │
│ SQLite stores under data/                                       │
│ NOT chat audit truth — runtime/operator diagnostics             │
└─────────────────────────────────────────────────────────────────┘
```

**No Langfuse in Local Studio agent path.** Metrics/logs are controller-local.

### Context Engine rebuild (FastAPI target — QA-003)

```txt
┌─ audit_events (Postgres) ─── security/admin truth ONLY ─────────┐
│ protected mutations + audit in same DB txn                      │
└─────────────────────────────────────────────────────────────────┘

┌─ JSON stdout logs ────────── diagnostic evidence ───────────────┐
│ every request: request_id (server-generated)                  │
│ chat turns: milestone events only (claimed, retrieval_*,     │
│   provider_*, persisted, replayed, failed, cancelled)           │
│ NEVER: prompt, answer, source text, paths, secrets            │
└─────────────────────────────────────────────────────────────────┘

┌─ optional Langfuse ───────── behind tracing wrapper only ───────┐
│ trace_id on conversation_turns; safe metadata only              │
│ disabled by default; outage = no-op                           │
└─────────────────────────────────────────────────────────────────┘

Browser: NO log tail SSE, NO controller URL, NO api_key in query
Admin diagnostics: bounded redacted tail via approved FastAPI routes
```

**Mapping:**

| LS surface | CE equivalent |
|------------|---------------|
| `/logs` session browser | Admin audit/operations views (F-008) |
| `/server` controller console | Admin diagnostics (backend-only targets) |
| Runtime SSE `status` frames | `turn.status` SSE events |
| Pi `tool_execution_*` | Defer (no agent tools in CE v1) |
| `contextUsage` in status | Domain context caps / assembly stats (server-private) |

---

## 9. Frontend ↔ FastAPI ↔ Backend App Model (reimplementation)

Use this 4-box model everywhere:

```txt
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  VIEW       │────▶│  HOOK       │────▶│  API SEAM   │────▶│  FASTAPI    │
│ components/ │     │ hooks/      │     │ api/index   │     │ routers +   │
│ (dumb UI)   │◀────│ state machine│◀────│ types/      │◀────│ services    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                           │                    │                  │
                     localStorage          fixtures→fetch      Postgres
                     AbortController       SSE parser           Redis/worker
                     stream applier                             LightRAG/provider
```

### Box responsibilities

**VIEW** — `agent-workspace-demo`, `pane-grid`, `chat-pane`, `computer-panel`
- Props in, events out. Zero `fetch`.

**HOOK** — `useAgentWorkspace` (demo) / `useSessionEngine`+`sessionRuntimeController` (prod LS)
- Orchestrates turns, layout, queue, abort.
- Calls `api/*` only.

**API SEAM** — single edit point
- Today: `mockStream(buildTurnEvents())`
- Tomorrow: `fetch` + `ReadableStream` SSE reader
- Signatures frozen; types in `types/index.ts` = OpenAPI/Pydantic mirror.

**FASTAPI** — replace controller + Pi

```python
# Agent-parity shape (demo/template)
POST /api/agent/turn          → 202, enqueue turn
GET  /api/agent/runtime/events?sessionId → SSE status|pi frames
POST /api/agent/abort
POST /api/agent/compact
GET  /api/agent/sessions/all
GET  /api/agent/sessions/{id}

# CE production shape (F-007/F-012) — different envelope, same UX job
POST /api/v1/conversations/{id}/turns:stream  → SSE turn.* events
POST /api/v1/composer-refs:discover
GET  /api/v1/conversations/{id}
```

---

## 10. Context Pipeline: LS vs CE

```txt
LOCAL STUDIO (client-heavy prompt build)
────────────────────────────────────────
user text
 + @plugin refs (composer-context)
 + $skill refs
 + /template refs
 + attachment text/images
 + browser URL context
        → selectedContextPrompt() in browser
        → POST /turn with compiled `message`
        → Pi runtime adds tools/fs/terminal

CONTEXT ENGINE (server-heavy governed assembly) — F-012
────────────────────────────────────────────────────────
user text (stored verbatim)
 + composerRefTokens[] (opaque backend tokens only)
        → POST turns:stream
        → PromptAssemblyService (server-private)
        → TurnOrchestrator → retrieval/provider
        → SSE: turn.started | turn.status | turn.evidence | turn.delta | turn.completed
        → browser shows acceptedRefs metadata only
```

**Parity preserved:** chips, composer chrome, streaming timeline, stop, three-region workbench.  
**Parity dropped:** Pi frames, computer panel tools, cwd/git, steer/queue (F-012 explicit out-of-scope).

---

## 11. File-by-File Rebuild Checklist

| Step | What | Reference | CE action |
|------|------|-----------|-----------|
| 1 | SSE frame types | `types/index.ts` | Map to EVT-001 or keep pi envelope for agent demo |
| 2 | API seam | `api/index.ts` | Wire FastAPI SSE generator |
| 3 | Event applier | `applyPiEvent` / `pi-event-applier` | Map `turn.delta` → text blocks |
| 4 | Layout tree | `pane-grid` + constants | Optional; F-012 = single center pane |
| 5 | Composer | `chat-pane` + tokens | Port visual; governed refs not @plugins |
| 6 | Stream owner | `session-runtime-controller` | `use-chat-stream` + AbortController |
| 7 | Sessions index | `sessions-page` | `listConversations` |
| 8 | Logging | `use-logs` | Admin audit route; no browser log SSE |
| 9 | Auth | LS api_key/local | HttpOnly cookie + CSRF |

---

## 12. Parity Matrix (don't get lost)

| LS feature | Port UI? | Port runtime? | CE note |
|------------|----------|---------------|---------|
| Pane grid / fork | yes | no | optional |
| Composer lift/shadow | yes | — | tokens in `local-studio-tokens.css` |
| Thinking/tool blocks | yes | stub | evidence blocks instead of tools |
| Steer/queue | yes (demo) | needs Pi | **out of scope** F-012 |
| Computer 9 tabs | yes (fixtures) | no | right panel = Evidence/Refs/Wiki |
| Sessions table | yes | replace store | Postgres conversations |
| ⌘K palette | yes | — | route nav + session search |
| cwd/git status bar | yes (demo) | no | domain + token usage (safe) |
| Session replay JSONL | — | yes pattern | idempotent `turns:stream` replay |
| Terminal/browser/fs | no | no | excluded |

---

## 13. Minimal FastAPI SSE skeleton (agent-parity)

```python
# Mental model only — match types/index.ts RuntimeSseFrame
async def runtime_events(session_id: str):
    yield sse({"type":"status","phase":"running","session":{...}})
    seq = 0
    async for pi_event in agent_loop(session_id):
        seq += 1
        yield sse({"type":"pi","seq":seq,"event":pi_event})
    yield sse({"type":"status","phase":"idle","session":{...}})

def sse(frame: dict) -> str:
    return f"data: {json.dumps(frame)}\n\n"
```

Hook side: `for await (const frame of streamTurn(...))` → `applyPiEvent` — no component changes.

---

## 14. Read Order for Coding Agents

1. `.reference-LS-frontend/docs/feature-parity/features/agent-workspace.md`
2. `.reference-LS-frontend/docs/feature-parity/backend-wiring.md` (§ agent-workspace + SSE)
3. `.reference-LS-frontend/templates/nextjs-feature-demos/features/agent-workspace/api/index.ts`
4. `.devnotes/features/local-studio-chat-shell.md` (§2.1 traced path)
5. `specs/04-features/F-012-governed-context-assembly/spec.md` (CE target behavior)
6. `specs/05-quality/observability.md` (logging/trace rules)
7. Upstream: `frontend/src/features/agent/runtime/session-runtime-controller.ts` (SSE owner)

---

## 15. One-Line Summary

**Agent Workspace = React shell + single SSE owner + Pi event grammar + Next BFF proxy; rebuild it by keeping the `api/` seam and frame types, swapping Bun/Pi for FastAPI governed turns, and replacing controller logs with audit-safe JSON logs + optional Langfuse — never exposing prompts, paths, or raw evidence to the browser.**