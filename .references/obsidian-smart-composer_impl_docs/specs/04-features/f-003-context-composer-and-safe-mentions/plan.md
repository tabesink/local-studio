---
id: F-003-PLAN
title: Context Composer and Safe Mentions implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-002]
supersedes: []
---
# Plan

## Goal

A user composes a question and adds allowed source/evidence tokens without exposing raw vault or document data.

## Implementation steps

1. Define target `ContextReference` separately from source `Mentionable` types.
2. Implement debounced source search with cancellation.
3. Render opaque IDs only in client state; fetch bounded labels/excerpts through API.
4. Serialize references in request body; never concatenate retrieved text into the prompt in Next.js.
5. Support keyboard token removal and clear aria labels.

## Exact target areas expected to change

### Frontend

- `webui/src/features/chat/composer/*`
- `webui/src/features/evidence/source-search.ts`
- `features/workspace` active-domain integration.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Remove token feature and submit IDs; plain question composer remains possible.

## Risks and decisions

Do not copy Obsidian file/block mention serialization; target IDs have different security semantics.

## Coding-agent work packet

### Objective

A user composes a question and adds allowed source/evidence tokens without exposing raw vault or document data.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Define target `ContextReference` separately from source `Mentionable` types.
2. Implement debounced source search with cancellation.
3. Render opaque IDs only in client state; fetch bounded labels/excerpts through API.
4. Serialize references in request body; never concatenate retrieved text into the prompt in Next.js.
5. Support keyboard token removal and clear aria labels.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Composer can send a question with zero or more valid context references.
- Changing domain clears incompatible references.
- No source body is read from local filesystem/browser storage.

### Validation commands

```bash
cd webui && npm run lint
```
```bash
cd webui && npm run test
```
