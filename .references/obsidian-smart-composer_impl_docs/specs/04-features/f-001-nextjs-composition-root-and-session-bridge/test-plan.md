---
id: F-001-TEST
title: Next.js Composition Root and Safe Session Bridge test plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-000]
supersedes: []
---
# Test plan

## Required coverage

- Unit: error normalization.
- Component: loading/unauthenticated/forbidden/signed-in states.
- Integration: direct protected-route request without session is rejected by API.
- Security: grep/build assertion that no credential store or provider SDK is added.

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
```bash
cd backend && pytest -q
```

Commands are expected baseline names. Use the target repository’s existing commands where they differ and record the resolved command in `implementation-log.md`.
