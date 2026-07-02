---
id: F-005-TEST
title: Evidence and Source Navigation test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004]
supersedes: []
---
# Test plan

## Required coverage

- Citation opens matching evidence.
- Deleted/redacted source state.
- A reference cannot open a source from another domain.
- Answer without evidence has a clear empty state.

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
cd webui && npm run test
```
```bash
cd backend && pytest -q tests/api
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
