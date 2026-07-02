---
id: F-009-TEST
title: Gated Change-Proposal Review test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-005, F-006]
supersedes: []
---
# Test plan

## Required coverage

- Static guard: no target code imports Node filesystem, Obsidian, or source apply helpers.
- Security scan: no write endpoint exists.

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
git grep -nE "(node:fs|obsidian|applyChangesToFile|TFile)" -- webui backend || true
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
