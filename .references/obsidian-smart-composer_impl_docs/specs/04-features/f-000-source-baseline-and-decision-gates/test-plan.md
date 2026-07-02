---
id: F-000-TEST
title: Source Baseline and Decision Gates test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Test plan

## Required coverage

- `git rev-parse HEAD` equals the pinned SHA.
- A reviewer confirms no literal source credential value is copied into target files.
- All target features link to source references through the traceability map.

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
git clone https://github.com/glowingjade/obsidian-smart-composer.git obsidian-smart-composer-reference
```
```bash
git -C obsidian-smart-composer-reference checkout 6b38ab3c57e03c5c6cbeb79815277857df59cbd8
```
```bash
git -C obsidian-smart-composer-reference rev-parse HEAD
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
