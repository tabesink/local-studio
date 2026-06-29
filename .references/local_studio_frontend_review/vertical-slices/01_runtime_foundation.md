# 01 — Runtime Foundation

> **Status:** Target vertical slice. Build after prerequisite slices.
> **Style:** Smart caveman. Local Studio visual parity. Context Engine backend truth.

## Purpose

Start Context Engine safely. One known composition root. One runtime map. One health truth.

## Entry points

`docker compose up --build`. API health check. Client boot. Worker boot. Status poller boot.

## Evidence and target

Context Engine README documents PostgreSQL, Redis, API, worker, and LightRAG status poller. `INDEX_JOBS_INLINE=false` uses worker + poller. Local Studio separates frontend, controller, and CLI behind controller API.

**TARGET:** Context Engine remains FastAPI + worker + LightRAG. Copy Local Studio operational visibility style only: quiet state rows, compact status, logs detail panel.

## User flow

1. Compose starts infrastructure.
2. API validates config.
3. FastAPI mounts routes.
4. Seed admin exists.
5. Client calls health/session bootstrap.
6. Worker handles queued indexing.
7. Poller syncs remote LightRAG state.
8. UI reads API state. Never Docker directly.


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
| Runtime config | `.env` + FastAPI config | Single backend config source. |
| API process | FastAPI app factory | Composition root. |
| Queue work | Worker | Parse/index only. |
| Remote state sync | Status poller | Updates backend truth. |
| Display state | Client | Reads API. No guessed lifecycle. |

## Target API boundary

```http
GET /api/v1/health
GET /api/v1/session/me
```

`HealthResponse`: API version, dependency state, request ID. Keep public health minimal. Do not expose secrets, paths, Docker IDs, provider credentials, or stack traces.

## State model

```text
booting -> ready
booting -> failed
ready -> degraded
degraded -> ready
```

Use dependency checks only where required. UI shows `ready`, `degraded`, or `unavailable`. Do not add a generic runtime orchestrator.


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

No Local Studio controller port.
No Electron.
No CLI mirror.
No generic process manager.
No client Docker polling.
No new queue beyond current ingestion queue.

## Acceptance criteria

- `docker compose up` starts API, worker, poller.
- Seed admin exists.
- `/health` returns typed result.
- Client shows bounded unavailable state when API down.
- API startup fails clearly on invalid required config.

## Related docs

- [Read first](../00_read_first.md)
- [Visual parity + ownership](../00_visual_parity_and_ownership.md)
- [Current API contract](../contracts/01_current_context_engine_api.md)
- [Current SSE contract](../contracts/02_current_sse_contract.md)


## Source evidence

`README.md`; `docker-compose.yml`; `app/main.py`; `app/workers/`; Local Studio `README.md`; `controller/README.md`.

**VERIFY:** Confirm symbols and runtime behavior on checked-out SHA before implementation.
