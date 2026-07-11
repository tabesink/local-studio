---
id: F-004-TEST
title: Grounded Streamed Chat Turn test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---
# Test plan

## Required coverage

- SSE parser unit tests for all declared events.
- Component test for partial delta accumulation.
- Abort test.
- 409 conversation busy.
- Network break after started event.
- Backend integration proves idempotency prevents duplicate turn creation.

## Minimum test layers

| Layer | Evidence |
|---|---|
| Unit | Feature reducers, mapping, validation helpers, and error/SSE parser branches. |
| Component | Loading, empty, error, unauthorized/forbidden, success, keyboard/focus behaviour. |
| API/integration | FastAPI authorization, request validation, state conflict, persistence, and typed errors. |
| Security | No browser secret/provider access; direct endpoint authorization; redaction-safe logs. |
| End-to-end | Add only when the slice has a completed browser-to-API user path. |

## Commands

```bash
cd backend && pytest -q tests/api tests/chat
```
```bash
cd webui && npm run test
```
```bash
cd webui && npm run lint
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
