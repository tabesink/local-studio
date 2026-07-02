---
id: F-005-PLAN
title: Evidence and Source Navigation implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004]
supersedes: []
---
# Plan

## Goal

A user can inspect the server-returned evidence behind an answer and navigate to an authorized source locator.

## Implementation steps

1. Store references returned by SSE—not speculative client hits.
2. Use a source/evidence view component with no direct raw fetch outside feature API file.
3. Open a panel/modal that calls the canonical source endpoint only when needed.
4. Make citation focus/keyboard navigation accessible.

## Exact target areas expected to change

### Frontend

- `webui/src/features/evidence/*`
- Assistant message renderer and stream-completion mapper.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Hide evidence panel while retaining completed answer text only if policy permits; otherwise revert slice.

## Risks and decisions

Citation markdown parsing needs a target-safe syntax decision; do not copy source renderer without sanitization review.

## Coding-agent work packet

### Objective

A user can inspect the server-returned evidence behind an answer and navigate to an authorized source locator.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Store references returned by SSE—not speculative client hits.
2. Use a source/evidence view component with no direct raw fetch outside feature API file.
3. Open a panel/modal that calls the canonical source endpoint only when needed.
4. Make citation focus/keyboard navigation accessible.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Every displayed citation maps to a server-issued reference ID.
- No full document body appears by default.
- Evidence unavailable after deletion does not leak past content.

### Validation commands

```bash
cd webui && npm run test
```
```bash
cd backend && pytest -q tests/api
```
