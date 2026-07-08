# Local Studio: Context Pipeline + Agent Harness → FastAPI Guide

**Important first:** Local Studio does **not** implement classic vector RAG (no embeddings, no vector DB). It uses a **context assembly pipeline** (skills/plugins/attachments injected into prompts) plus an **agent harness** (Pi SDK loop, tools, compaction, SSE). Below is how that works and how to rebuild the same ideas in FastAPI/Python.

---

## 1. System overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOCAL STUDIO (reference)                        │
├─────────────────────────────────────────────────────────────────────────┤
│  Browser UI                                                             │
│    │  POST /api/agent/turn          (start/steer/follow-up)             │
│    │  GET  /api/agent/runtime/events?after=N  (SSE)                     │
│    │  POST /api/agent/compact       (summarize history)                 │
│    ▼                                                                    │
│  Next.js API routes  ──►  PiRuntimeManager  ──►  @earendil-works/pi-coding-agent
│       │                         │                      │                │
│       │                         │                      ├── tools (fs, bash, browser, MCP)
│       │                         │                      └── LLM via OpenAI API
│       │                         ▼                                       │
│       │                   JSONL session logs on disk                    │
│       ▼                                                                 │
│  Controller (Bun/Hono)  ──►  /v1/chat/completions  (proxy + tool XML) │
└─────────────────────────────────────────────────────────────────────────┘
```

**Three layers to copy in Python:**

| Layer | Local Studio | Your FastAPI equivalent |
|-------|--------------|-------------------------|
| Context assembly | Skills, plugins, attachments | Prompt builder + optional vector RAG |
| Agent harness | Pi SDK + runtime manager | Agent loop + session store + SSE |
| LLM gateway | Controller proxy | OpenAI client or vLLM endpoint |

---

## 2. “RAG” in Local Studio = Context Assembly (not vectors)

There is no `embed()`, `chromadb`, or semantic search in the reference app. Retrieval is **explicit and filesystem-based**.

### 2.1 Context sources

```
User types:  "fix the auth bug @$pytest @my-plugin"
                    │              │         │
                    │              │         └── plugin mention (@)
                    │              └── skill mention ($)
                    └── plain prompt

                         ┌──────────────────┐
                         │ ComposerContext  │
                         │  assemble()      │
                         └────────┬─────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
  Skill discovery          Plugin metadata           File attachments
  (SKILL.md on disk)       (instructions, MCP)       (inline text in prompt)
        │                         │                         │
        └─────────────────────────┴─────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────────┐
                    │ Final prompt sent to agent: │
                    │                             │
                    │ Composer context:           │
                    │ Loaded skills:              │
                    │ $pytest                     │
                    │ <SKILL.md contents>         │
                    │ Plugin @my-plugin: ...      │
                    │                             │
                    │ User prompt:                │
                    │ fix the auth bug            │
                    └─────────────────────────────┘
```

**Reference files:**
- Skill discovery: `frontend/src/features/agent/skill-discovery.ts`
- Prompt assembly: `frontend/src/features/agent/composer-context.ts` (`selectedContextPrompt`)
- Skill API: `frontend/src/app/api/agent/skills/route.ts`, `skills/load/route.ts`

### 2.2 Skill discovery algorithm (simple)

```
SKILL SOURCES (default):
  ~/.pi/skills/
  ~/.claude/skills/
  ~/.codex/skills/
  ... (see defaultSkillSources())

For each source dir:
  walk tree (max depth 9)
  if dir contains SKILL.md → register skill
  dedupe by name (first wins)

loadSkillInstructions(path):
  verify path is inside allowed source roots  ← security boundary
  read SKILL.md (cap at 6000 chars)
  return { id, name, source, path, instructions }
```

### 2.3 Runtime context at agent start

When a turn starts, the harness also wires **extensions + skill paths** into the Pi SDK:

```
buildAgentSessionOptions()
  ├── extensionPaths   (browser.ts, plan.ts, mcp-plugin.ts, ...)
  ├── skills[]         (selected + bundled skill dirs)
  ├── promptTemplatePaths
  └── envInjections    (session ids, MCP configs, frontend base URL)
```

Reference: `frontend/src/features/agent/pi-runtime-helpers.ts`

### 2.4 Compaction = context window management (not RAG)

When the context window fills, the agent **summarizes** old messages instead of retrieving new docs:

```
Context usage monitor
  tokens / contextWindow → shouldCompact?

POST /api/agent/compact
  └── session.compact(instructions)
        └── Pi SDK replaces old turns with summary
        └── new compaction boundary in JSONL log
```

Compaction preserves selected skills/plugins via `selectedContextInstructions()`.

Reference: `frontend/src/app/api/agent/compact/route.ts`, `pi-runtime.ts` (`computeContextUsage`)

---

## 3. Agent harness architecture

### 3.1 Core components

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT HARNESS (reference)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PiRuntimeManager                                               │
│    sessions: Map<runtimeSessionId, PiSdkSession>                │
│                                                                 │
│  PiSdkSession (per runtime tab)                                 │
│    ├── ensureStarted(model, cwd, piSessionId, options)        │
│    ├── prompt(message) / steer() / followUp() / abort()       │
│    ├── compact(customInstructions)                            │
│    ├── eventLog[] + eventSeq                                  │
│    └── subscribe → SSE consumers                              │
│                                                                 │
│  SessionRuntimeController (frontend only)                       │
│    ├── owns SSE subscriptions + seq cursors                     │
│    ├── reduces events → UI session state                        │
│    └── polls runtime for background activity                    │
│                                                                 │
│  sessions-store                                                 │
│    └── reads Pi JSONL logs from ~/.pi/agent/sessions/...      │
└─────────────────────────────────────────────────────────────────┘
```

Reference: `pi-runtime.ts`, `session-runtime-controller.ts`, `sessions-store.ts`

### 3.2 Turn lifecycle

```
Client                          API /api/agent/turn              PiSdkSession
  │                                    │                              │
  │── POST { message, modelId,         │                              │
  │         plugins, skills, cwd } ───►│                              │
  │                                    │── ensureStarted() ──────────►│
  │                                    │   (load extensions/skills)   │
  │                                    │── prompt(msg) [fire-and-forget]►│
  │◄── { outcome:"accepted",           │                              │
  │      piSessionId, eventSeq } ──────│                              │
  │                                    │                              │──► LLM
  │── GET /runtime/events?after=0 ────►│                              │◄── events
  │◄── SSE: {type:"pi", seq, event} ───│◄── onLoggedEvent ────────────│
  │◄── SSE: {type:"status", phase} ────│                              │
  │                                    │                              │──► tool calls
  │                                    │                              │◄── tool results
  │◄── SSE: agent_end → close ─────────│                              │
```

**Turn modes:**
- `prompt` — new user message (may auto-steer if agent already running)
- `steer` — interrupt mid-turn with new instruction
- `follow_up` — queue message for after current turn

Reference: `frontend/src/app/api/agent/turn/route.ts`

### 3.3 SSE event stream

```
GET /api/agent/runtime/events?sessionId=X&piSessionId=Y&after=42

Response: text/event-stream

data: {"type":"status","phase":"running","session":{...}}

data: {"type":"pi","seq":43,"event":{"type":"message_update",...}}

data: {"type":"pi","seq":44,"event":{"type":"tool_execution_start",...}}

data: {"type":"status","phase":"done","session":{...}}
```

**Cursor rules (critical for reconnect):**
- Client tracks `lastEventSeq`
- Reconnect with `after=lastEventSeq`
- Server dedupes by seq; never replay already-seen events
- On turn accept, only rewind cursor if runtime genuinely restarted

Reference: `runtime/events/route.ts`, `session-runtime-controller.ts`

### 3.4 Event → UI reducer

Each Pi event is folded into chat state by a **pure reducer**:

```
reduceSessionEvent(session, event):
  queue_update        → update message queue
  user_message        → append user bubble
  message_start/update/end → rebuild assistant blocks (snapshot-based)
  tool_execution_*    → tool badge states
  compaction_end      → reset contextUsage
  agent_end           → finalize tools, clear pending
```

Reference: `frontend/src/features/agent/runtime/pi-event-applier.ts`

### 3.5 Session persistence

```
Disk layout (Pi convention):
  ~/.pi/agent/sessions/--Users-alice-project--/<session-id>.jsonl

Each line = one JSON event (append-only log)
API reads this for replay/hydration on page reload
```

Reference: `frontend/src/features/agent/sessions-store.ts`

### 3.6 LLM proxy (controller, separate process)

The controller sits between agent and inference engine:

```
Agent ──► POST /v1/chat/completions (stream=true)
              │
              ▼
         ToolCallStream transformer
              ├── strip/inject tool XML from content deltas
              ├── normalize cumulative vs delta text
              ├── extract reasoning fields
              └── track token usage
              │
              ▼
         vLLM / llama.cpp / SGLang / MLX
```

Reference: `controller/src/modules/proxy/tool-call-stream.ts`

---

## 4. FastAPI rebuild blueprint

### 4.1 Recommended Python project layout

```
app/
├── main.py                 # FastAPI app
├── api/
│   ├── agent_turn.py       # POST /agent/turn
│   ├── agent_events.py     # GET  /agent/runtime/events (SSE)
│   ├── agent_compact.py    # POST /agent/compact
│   ├── agent_skills.py     # GET  /agent/skills
│   └── agent_status.py     # GET  /agent/runtime/status
├── context/
│   ├── skill_discovery.py  # mirror skill-discovery.ts
│   └── prompt_builder.py   # mirror composer-context.ts
├── harness/
│   ├── runtime_manager.py  # Map[session_id → AgentSession]
│   ├── agent_session.py    # prompt/steer/compact/abort + event log
│   └── event_reducer.py    # fold events → chat state
├── tools/
│   ├── registry.py         # register callable tools
│   ├── filesystem.py
│   └── shell.py
├── llm/
│   └── openai_client.py    # streaming chat completions
└── store/
    └── session_store.py    # JSONL append/read
```

### 4.2 Context pipeline (Python sketch)

```python
# context/skill_discovery.py
from pathlib import Path

SKILL_SOURCES = [
    Path.home() / ".pi" / "skills",
    Path.home() / ".claude" / "skills",
]

def discover_skills() -> list[dict]:
    skills = {}
    for root in SKILL_SOURCES:
        if not root.exists():
            continue
        for skill_md in root.rglob("SKILL.md"):
            name = skill_md.parent.name.replace("-", " ")
            skills.setdefault(name.lower(), {
                "name": name,
                "path": str(skill_md.parent),
            })
    return sorted(skills.values(), key=lambda s: s["name"])

def load_skill(path: str, max_chars: int = 6000) -> str | None:
    p = Path(path).resolve()
    if not any(p.is_relative_to(s.resolve()) for s in SKILL_SOURCES):
        return None  # security: reject paths outside allowed roots
    skill_md = p / "SKILL.md"
    return skill_md.read_text()[:max_chars] if skill_md.exists() else None


# context/prompt_builder.py
def build_prompt(user_text: str, skills: list[dict], plugins: list[dict]) -> str:
    lines = []
    if skills:
        lines.append("Loaded skills:")
        for s in skills:
            if s.get("instructions"):
                lines.append(f"${s['name']}\n{s['instructions']}")
    for p in plugins:
        if p.get("instructions"):
            lines.append(f"Plugin @{p['name']} instructions:\n{p['instructions']}")
    if not lines:
        return user_text
    return f"Composer context:\n" + "\n".join(lines) + f"\n\nUser prompt:\n{user_text}"
```

### 4.3 Agent harness (Python sketch)

```python
# harness/agent_session.py
import asyncio, json, time
from dataclasses import dataclass, field

@dataclass
class AgentSession:
    session_id: str
    event_log: list[dict] = field(default_factory=list)
    event_seq: int = 0
    active: bool = False
    subscribers: list[asyncio.Queue] = field(default_factory=list)

    def emit(self, event: dict):
        self.event_seq += 1
        logged = {"seq": self.event_seq, "event": event, "ts": time.time()}
        self.event_log.append(logged)
        for q in self.subscribers:
            q.put_nowait(logged)

    async def prompt(self, message: str, llm, tools):
        self.active = True
        self.emit({"type": "turn_start"})
        messages = [{"role": "user", "content": message}]

        while True:
            async for delta in llm.stream(messages, tools=tools):
                self.emit({"type": "message_update", "delta": delta})

            if not delta.tool_calls:
                break

            for call in delta.tool_calls:
                self.emit({"type": "tool_execution_start", "call": call.name})
                result = await tools.run(call)
                self.emit({"type": "tool_execution_end", "result": result})
                messages.append(tool_result_message(call, result))

        self.emit({"type": "agent_end"})
        self.active = False


# harness/runtime_manager.py
class RuntimeManager:
    def __init__(self):
        self._sessions: dict[str, AgentSession] = {}

    def get(self, session_id: str = "default") -> AgentSession:
        return self._sessions.setdefault(session_id, AgentSession(session_id))
```

### 4.4 FastAPI routes (Python sketch)

```python
# api/agent_turn.py
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel

router = APIRouter()

class TurnRequest(BaseModel):
    session_id: str = "default"
    model_id: str
    message: str
    cwd: str | None = None
    skills: list[dict] = []
    plugins: list[dict] = []
    mode: str = "prompt"  # prompt | steer | follow_up

@router.post("/agent/turn")
async def agent_turn(req: TurnRequest, bg: BackgroundTasks):
    session = runtime_manager.get(req.session_id)
    prompt = build_prompt(req.message, req.skills, req.plugins)

    if req.mode == "prompt":
        bg.add_task(session.prompt, prompt, llm_client, tool_registry)
        return {"outcome": "accepted", "event_seq": session.event_seq}

    if req.mode == "steer" and session.active:
        await session.steer(prompt)  # implement queue/interrupt
        return {"outcome": "queued"}

    return {"outcome": "rejected", "error": "Runtime session is no longer active"}


# api/agent_events.py
from fastapi.responses import StreamingResponse

@router.get("/agent/runtime/events")
async def agent_events(session_id: str, after: int = 0):
    session = runtime_manager.get(session_id)

    async def stream():
        # 1. replay backlog
        for logged in session.event_log:
            if logged["seq"] > after:
                yield f"data: {json.dumps({'type':'pi', **logged})}\n\n"
        # 2. live events
        q = asyncio.Queue()
        session.subscribers.append(q)
        try:
            while True:
                logged = await q.get()
                yield f"data: {json.dumps({'type':'pi', **logged})}\n\n"
                if logged["event"].get("type") == "agent_end":
                    yield f"data: {json.dumps({'type':'status','phase':'done'})}\n\n"
                    break
        finally:
            session.subscribers.remove(q)

    return StreamingResponse(stream(), media_type="text/event-stream")
```

### 4.5 Optional: add real vector RAG (Local Studio doesn't have this)

If you want **document RAG** on top of the same harness:

```
Ingestion (offline):
  docs → chunk (512-1024 tok) → embed → vector store (pgvector / Qdrant / Chroma)

At query time:
  user message → embed query → top-k chunks → inject into build_prompt()

  ┌──────────┐     ┌────────────┐     ┌─────────────┐
  │ User Q   │────►│ Vector DB  │────►│ Top-k chunks│
  └──────────┘     └────────────┘     └──────┬──────┘
                                             │
  build_prompt(user_text, skills, plugins, retrieved_chunks)
                                             │
                                             ▼
                                      Agent harness (same as above)
```

Use skills for **procedural knowledge** (how to use tools) and vector RAG for **document knowledge** (your PDFs, wiki, codebase embeddings).

---

## 5. Build order for junior devs

```
Phase 1 — Context (1-2 days)
  [ ] Skill discovery from SKILL.md dirs
  [ ] GET /agent/skills, GET /agent/skills/load?path=
  [ ] build_prompt() with skills + attachments

Phase 2 — Minimal harness (2-3 days)
  [ ] AgentSession with event log + seq
  [ ] POST /agent/turn (blocking OK first)
  [ ] JSONL session persistence
  [ ] Basic tool: read_file, grep (or use LangChain tools)

Phase 3 — Streaming (2-3 days)
  [ ] LLM streaming client (OpenAI / vLLM)
  [ ] GET /agent/runtime/events SSE with after=cursor
  [ ] Event reducer for message + tool blocks

Phase 4 — Production behaviors (3-5 days)
  [ ] steer / follow_up / abort
  [ ] Compaction when context > threshold
  [ ] Runtime status poll + reconnect logic
  [ ] Path sandboxing for skills/tools (mirror isInside checks)

Phase 5 — Optional RAG (if needed)
  [ ] Ingest pipeline + vector store
  [ ] Retrieve step in build_prompt()
```

---

## 6. Key design rules from the reference

1. **Fire-and-forget turns** — `POST /turn` returns immediately; client watches SSE for progress.
2. **Seq cursors everywhere** — never duplicate events on reconnect.
3. **Snapshot-based assistant rendering** — rebuild blocks from full message snapshots, not raw token deltas.
4. **Security on skill paths** — only load files under known source roots.
5. **Compaction preserves composer context** — re-inject selected skills/plugins in compaction instructions.
6. **Separate LLM proxy concerns** — tool-call parsing/stream normalization belongs in the gateway, not the UI.

---

## 7. Reference file map

| Concern | Path |
|---------|------|
| Skill discovery | `.references/local-studio/frontend/src/features/agent/skill-discovery.ts` |
| Prompt assembly | `.references/local-studio/frontend/src/features/agent/composer-context.ts` |
| Pi SDK wrapper | `.references/local-studio/frontend/src/features/agent/pi-runtime.ts` |
| Runtime options | `.references/local-studio/frontend/src/features/agent/pi-runtime-helpers.ts` |
| Turn API | `.references/local-studio/frontend/src/app/api/agent/turn/route.ts` |
| Compact API | `.references/local-studio/frontend/src/app/api/agent/compact/route.ts` |
| SSE events | `.references/local-studio/frontend/src/app/api/agent/runtime/events/route.ts` |
| Event reducer | `.references/local-studio/frontend/src/features/agent/runtime/pi-event-applier.ts` |
| SSE controller | `.references/local-studio/frontend/src/features/agent/runtime/session-runtime-controller.ts` |
| Session JSONL | `.references/local-studio/frontend/src/features/agent/sessions-store.ts` |
| LLM proxy | `.references/local-studio/controller/src/modules/proxy/tool-call-stream.ts` |
| Turn contract | `.references/local-studio/frontend/src/features/agent/contracts.ts` |

---

I'm in **Ask mode**, so this is documentation only — no files were created. If you want this saved as `docs/agent-harness-fastapi.md` in the repo, switch to Agent mode and ask. I can also produce a minimal working FastAPI skeleton or add a vector-RAG ingestion module on top of this design.