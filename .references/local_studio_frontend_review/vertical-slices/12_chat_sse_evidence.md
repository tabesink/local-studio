# 12 — Chat SSE + Evidence

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Replace JSON pseudo-stream with typed server-to-browser SSE. Render answer deltas. Preserve evidence IDs.

## Entry points

Chat composer submit. Stop control. Citation click. Stream failure/retry state.

## Evidence and target

**OBSERVED:** Current retrieval path is authenticated JSON. Local Studio has controller/agent event streams and frontend streaming behavior.

**TARGET:** One FastAPI `POST` returns `text/event-stream`. Use `fetch` + `ReadableStream`; native `EventSource` cannot send required request body.

## User flow

1. Client sends question via POST.
2. FastAPI authorizes domain.
3. FastAPI emits `turn.started`.
4. FastAPI emits retrieval status.
5. FastAPI maps evidence.
6. FastAPI emits `turn.evidence`.
7. Synthesis emits `turn.delta` chunks.
8. FastAPI emits completed citations.
9. Client marks turn complete.
10. User click opens evidence inspector.


## Local Studio visual transfer

| Element | Use |
|---|---|
| Shell | Left rail. Center canvas. Optional right detail panel. |
| Density | `24px` small rows. `28px` controls/standard rows where primitive supports it. |
| Type | Geist for UI/body. Geist Mono for IDs, paths, model names, durations, payloads. |
| Surfaces | Dark-first close charcoal layers. 1px quiet borders. No card grid. |
| Actions | White/black high-contrast primary. Quiet danger. Compact icon/ghost secondary. |
| State | `StatusDot`/`StatusPill`; thin progress; compact error box. |
| Detail | Inspector stays in context. Do not route away for a small inspection. |


## Ownership

| Concern | Owner | Rule |
|---|---|---|
| Turn ID | FastAPI | Server generated. |
| Retrieval/evidence | FastAPI retrieval service | Client never invents citations. |
| Stream parse | `lib/stream/parse-sse.ts` | One parser. |
| Partial text | Current ChatTurn component | Feature local. |
| Stop | Browser `AbortController` | Server observes disconnect. |

## Target API boundary

```http
POST /api/v1/domains/{domain_id}/chat/turns
Accept: text/event-stream
Content-Type: application/json

{ "question": "...", "mode": "hybrid", "top_k": 12 }
```

Events:

```text
turn.started
turn.status
turn.evidence
turn.delta
turn.completed
turn.failed
```

Full catalog: `../contracts/02_current_sse_contract.md`.

## State model

```text
created -> retrieving -> synthesizing -> completed
created/retrieving/synthesizing -> failed
retrieving/synthesizing -> aborted
```

`aborted` is UI state. Persist server record only if future audit requirement exists.


## Required UI states

| State | Required UI |
|---|---|
| Loading | Preserve layout. Local skeleton/quiet progress. No page flash. |
| Empty | Short sentence + one next action. No illustration by default. |
| Error | Compact `ErrorBox`. Clear recovery action. |
| Forbidden | Explain role boundary. Do not fake disabled success. |
| Pending mutation | Disable duplicate action. Keep server truth visible. |
| Background refresh | Small status. Do not block current read-only work. |


## Do not build

No EventSource POST workaround.
No WebSocket.
No generic event bus.
No `tool.*` event now.
No agent/session event now.
No retry that changes frozen active profile for same turn.
No client citation parsing from answer text.

## Acceptance criteria

- SSE emits expected order.
- Delta appends in sequence.
- Evidence arrives/renderable before completion.
- Abort stops UI safely.
- Unknown event ignored + structured debug log.
- Failure gives typed retry/new-question state.
- Proxy buffering disabled in deployment test.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`app/api/routes/retrieve.py`; `app/retrieval/`; `app/schemas/retrieval.py`; `tests/test_evidence_mapper.py`; `tests/test_retrieval_asset_enrichment.py`; `client/src/lib/lightrag-client.ts`; Local Studio `shared/contracts/controller-events.ts`, `controller/src/modules/system/`, `frontend/src/features/agent/`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
