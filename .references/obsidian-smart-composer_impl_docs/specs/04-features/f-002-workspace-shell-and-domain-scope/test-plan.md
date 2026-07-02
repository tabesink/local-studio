---
id: F-002-TEST
title: Workspace Shell and Domain Scope test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001]
supersedes: []
---
# Test plan

## Required coverage

- Domain list success, empty, failure.
- Member cannot select a domain absent from response.
- Direct route with unauthorized domain returns safe state.
- Keyboard focus moves correctly through picker.

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
cd webui && npm run lint
```
```bash
cd webui && npm run test
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
