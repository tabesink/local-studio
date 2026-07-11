---
id: F-004-PLAN
title: Grounded Streamed Chat Turn implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---
# Plan

## Goal

A domain-scoped answer streams from FastAPI into the workspace with reliable cancellation and typed terminal states.

## Implementation steps

1. Create `lib/api/stream.ts` with strict event parsing and unknown-event ignore/log policy.
2. Create a per-conversation reducer; do not store server state in a broad global store.
3. Generate one client idempotency UUID per submit attempt.
4. Use `AbortController` for browser cancellation; show stopped state only after typed outcome or local disconnected state.
5. Ensure a network failure keeps a retryable user draft without creating duplicate visible assistant turns.

## Exact target areas expected to change

### Frontend

- `webui/src/lib/api/stream.ts`
- `webui/src/features/chat/use-chat-turn.ts`
- `webui/src/features/chat/chat-reducer.ts`
- Chat workspace page and composer submit handler.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Disable submit UI behind an existing feature release gate only if one already exists; otherwise revert the slice as one change.

## Risks and decisions

SSE event contract must be implemented and contract-tested by FastAPI before UI release.

## Coding-agent work packet

### Objective

A domain-scoped answer streams from FastAPI into the workspace with reliable cancellation and typed terminal states.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Create `lib/api/stream.ts` with strict event parsing and unknown-event ignore/log policy.
2. Create a per-conversation reducer; do not store server state in a broad global store.
3. Generate one client idempotency UUID per submit attempt.
4. Use `AbortController` for browser cancellation; show stopped state only after typed outcome or local disconnected state.
5. Ensure a network failure keeps a retryable user draft without creating duplicate visible assistant turns.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Only the API produces answer content/evidence.
- Stop works without a leaked pending UI state.
- A member cannot send to a forbidden domain through edited browser requests.
- No provider key or direct LLM library enters `webui`.

### Validation commands

```bash
cd backend && pytest -q tests/api tests/chat
```
```bash
cd webui && npm run test
```
```bash
cd webui && npm run lint
```
