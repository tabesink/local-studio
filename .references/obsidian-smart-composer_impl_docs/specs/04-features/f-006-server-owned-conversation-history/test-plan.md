---
id: F-006-TEST
title: Server-Owned Conversation History test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004, F-005]
supersedes: []
---
# Test plan

## Required coverage

- Owner can read own history.
- Other user cannot access direct conversation URL.
- One running turn per conversation produces 409.
- Domain switch per new turn does not mutate prior turn.
- Delete/redaction display behaviour.

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
cd backend && alembic upgrade head
```
```bash
cd backend && pytest -q tests/api tests/models
```
```bash
cd webui && npm run test
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
