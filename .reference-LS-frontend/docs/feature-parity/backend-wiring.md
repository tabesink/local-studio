# Backend Wiring Guide — FastAPI behind the template slices

Every slice in `templates/nextjs-feature-demos/features/<slug>/` isolates all data
access in its `api/` module. That module is the **only** place a real backend gets
wired in: replace the fixture functions with `fetch` calls (or an SSE subscription)
that hit your FastAPI server, keep the exported function signatures and the types in
`types/` unchanged, and the UI layer needs zero edits.

Types in each slice's `types/index.ts` are aligned with the reference contracts in
`.references/local-studio/shared/contracts/`. Keep them aligned — they are the
request/response schema your FastAPI models must serialize to.

## The seam, concretely

```txt
components/  ← never fetches; renders hook state
hooks/       ← state machine; calls api/* only
api/         ← fixtures today; FastAPI calls tomorrow   ← EDIT HERE
types/       ← shared shapes (mirror of backend Pydantic models)
fixtures/    ← demo data; delete or keep for tests
```

Rules for the swap:

1. Keep function names and return shapes (`getRecipes(): Promise<{ recipes: RecipeWithStatus[] }>` stays exactly that).
2. Preserve polling cadences noted below — the hooks assume them.
3. Preserve streaming contracts: functions returning `MockStream<T>` become async generators reading SSE, yielding the same `T`.
4. Surface errors by throwing (the hooks map thrown errors to banner/inline states).

## Per-slice endpoint tables

### recipes-models

| Fixture function (`api/index.ts`) | Method + path | Request body | Response |
| --- | --- | --- | --- |
| `getRecipes()` | GET `/recipes` | — | `{ recipes: RecipeWithStatus[] }` |
| `saveRecipe(recipe)` | POST `/recipes` / PUT `/recipes/{id}` | `RecipeBase` | `{ success, id }` |
| `deleteRecipe(id)` | DELETE `/recipes/{id}` | — | `{ success }` |
| `launchRecipe(recipe)` | POST `/launch/{recipeId}` → SSE `launch_progress` | — | stages `preempting/evicting/launching/waiting/ready/error` |
| `stopActiveModel()` | POST `/evict` | — | `{ success }` |
| `getModels()` | GET `/studio/models` | — | `{ models: ModelInfo[] }` |
| `getDownloads()` | GET `/studio/downloads` | — | `{ downloads: ModelDownload[] }` — **poll every 2500ms** |
| `startDownload(modelId)` | POST `/studio/downloads` | `{ model_id, revision? }` | `{ download: ModelDownload }` |
| `pauseDownload/resumeDownload/cancelDownload(id)` | POST `/studio/downloads/{id}/pause\|resume\|cancel` | — | `{ success }` |
| `searchModels(query)` | GET `/api/huggingface/models?search=` | — | grouped HF rows |

### setup-wizard

| Fixture function | Method + path | Request body | Response |
| --- | --- | --- | --- |
| `loadSetupData()` | GET `/studio/settings` + `/studio/diagnostics` + `/studio/recommendations` + `/runtime/targets` (parallel, 8s timeouts) | — | `StudioSettings`, `StudioDiagnostics`, `{ recommendations, max_vram_gb }`, `{ targets }` |
| `saveModelsDir(dir)` | POST `/studio/settings` | `{ models_dir }` | `StudioSettings` |
| runtime install (in `installRuntime`) | POST `/runtime/jobs` then poll GET `/runtime/jobs/{id}` at 1s→3s | `{ backend, type: "install" }` | `EngineJob` |
| `startDownload(modelId, dir)` | POST `/studio/downloads`, then poll GET `/studio/downloads` — **every 2000ms** | `{ model_id }` | `{ download: SetupDownload }` |
| `configureAndLaunch(modelId)` | GET `/recipes` → POST `/recipes` (starter defaults) → POST `/launch/{id}` → GET `/wait-ready?timeout=300` | starter `RecipeBase` | `{ success, recipeId }` |
| `runBenchmark()` | POST `/benchmark?prompt_tokens=1000&max_tokens=100` | — | `BenchmarkResult` |

### agent-workspace (and chat-shell)

| Fixture function | Method + path | Request body | Response |
| --- | --- | --- | --- |
| `streamTurn(sessionId, messageId)` | POST `/api/agent/turn`, results on GET `/api/agent/runtime/events` (SSE) | `{ sessionId, text, mode?: "steer" \| "follow_up" }` | SSE frames (below) |
| `abortTurn(sessionId)` | POST `/api/agent/abort` | `{ sessionId }` | `{ success }` |
| `compactSession(sessionId)` | POST `/api/agent/compact` | `{ sessionId }` | `{ success, message }` |
| `getSessions()` | GET `/api/agent/sessions/all?since=90d` | — | session index rows |
| session replay | GET `/api/agent/sessions/{piSessionId}` | — | canonical event log |

### The other nine slices

Each existing slice documents its endpoints in its feature-parity doc under
`docs/feature-parity/features/<slug>.md` (API Contracts section) and isolates them
in the same `api/` seam. Notable cadences: dashboard GPU strip ~2s, logs tail
streaming, usage stats on demand.

## SSE frame envelope (the chat pipeline contract)

The runtime stream is one long-lived SSE response. Every `data:` line is a JSON
frame with a `type` discriminator:

```jsonc
// lifecycle / context frames
{"type":"status","phase":"running","session":{"active":true,"running":true,
 "piSessionId":"sess-1","modelId":"qwen3-32b-awq",
 "contextUsage":{"tokens":41230,"contextWindow":131072,"percent":31}}}

// agent events — the "pi" envelope
{"type":"pi","seq":1,"event":{"type":"message_start","messageId":"a-1"}}
{"type":"pi","seq":2,"event":{"type":"message_update","messageId":"a-1",
 "assistantMessageEvent":{"type":"thinking_delta","delta":"Checking scheduler logs..."}}}
{"type":"pi","seq":3,"event":{"type":"message_update","messageId":"a-1",
 "assistantMessageEvent":{"type":"toolcall_start","toolCallId":"tc1","toolName":"run_terminal_cmd"}}}
{"type":"pi","seq":4,"event":{"type":"tool_execution_start","toolCallId":"tc1",
 "toolName":"run_terminal_cmd","args":"grep -n 'preempt' logs/…"}}
{"type":"pi","seq":5,"event":{"type":"tool_execution_end","toolCallId":"tc1",
 "status":"done","output":"12:19:41 scheduler: preempted …"}}
{"type":"pi","seq":6,"event":{"type":"message_update","messageId":"a-1",
 "assistantMessageEvent":{"type":"text_delta","delta":"The scheduler is preempting…"}}}
{"type":"pi","seq":7,"event":{"type":"message_end","messageId":"a-1","usage":{"tokens":412}}}
{"type":"pi","seq":8,"event":{"type":"agent_end"}}
```

Full event list the UI understands (see
`features/agent-workspace/types/index.ts` → `PiEvent`):
`message_start`, `message_update` (`text_delta`, `thinking_delta`,
`toolcall_start`, `toolcall_end`), `message_end`, `tool_execution_start`,
`tool_execution_end`, `agent_end`, `compaction_end`, `queue_update`.

## Worked example — wiring the chat pipeline to FastAPI

### 1. FastAPI SSE endpoint

```python
import asyncio, json
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI()

class TurnRequest(BaseModel):
    sessionId: str
    text: str
    mode: str | None = None  # "steer" | "follow_up"

turn_queues: dict[str, asyncio.Queue] = {}

@app.post("/api/agent/turn", status_code=202)
async def submit_turn(body: TurnRequest):
    await turn_queues.setdefault(body.sessionId, asyncio.Queue()).put(body)
    return {"accepted": True}

@app.get("/api/agent/runtime/events")
async def runtime_events(sessionId: str):
    async def frames():
        # status frame first, then pi frames as the agent produces them
        yield sse({"type": "status", "phase": "idle",
                   "session": {"active": True, "running": False,
                               "piSessionId": sessionId, "modelId": "qwen3-32b-awq"}})
        seq = 0
        async for event in run_agent(sessionId):   # your agent loop
            seq += 1
            yield sse({"type": "pi", "seq": seq, "event": event})

    return StreamingResponse(frames(), media_type="text/event-stream")

def sse(frame: dict) -> str:
    return f"data: {json.dumps(frame)}\n\n"
```

`run_agent` must yield dicts matching `PiEvent` — e.g.
`{"type": "message_update", "messageId": mid, "assistantMessageEvent": {"type": "text_delta", "delta": chunk}}`
for each model token chunk.

### 2. Replace the fixture stream in the slice

In `templates/nextjs-feature-demos/features/agent-workspace/api/index.ts`, replace
`streamTurn` with a real SSE reader — same signature, same yielded type:

```ts
export async function* streamTurn(
  sessionId: string,
  messageId: string,
): AsyncGenerator<RuntimeSseFrame> {
  await fetch("/api/agent/turn", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, text: pendingText }),
  });

  const response = await fetch(`/api/agent/runtime/events?sessionId=${sessionId}`);
  const reader = response.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    for (const line of buffer.split("\n\n")) {
      if (!line.startsWith("data: ")) continue;
      yield JSON.parse(line.slice(6)) as RuntimeSseFrame;
    }
    buffer = buffer.endsWith("\n\n") ? "" : buffer.split("\n\n").at(-1)!;
  }
}
```

Nothing else changes: `use-agent-workspace.ts` already consumes the generator and
applies `pi` events through the same applier the fixture path uses, so thinking
blocks, tool cards, text deltas, queue draining, and the Stop control all work
against the real server.

### 3. Same recipe for REST slices

For non-streaming slices the swap is one line per function:

```ts
export async function getRecipes(): Promise<{ recipes: RecipeWithStatus[] }> {
  const response = await fetch("/recipes");
  if (!response.ok) throw new ApiError("Failed to load recipes", response.status);
  return response.json();
}
```

Keep the polling loops in the hooks (downloads 2000–2500ms, dashboard ~2s) — only
the fetch target changes.
