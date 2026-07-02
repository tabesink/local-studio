---
id: F-007-PLAN
title: Prompt Templates and Safe Response Metadata implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004]
supersedes: []
---
# Plan

## Goal

Users can insert approved reusable prompt templates and inspect non-sensitive response metadata.

## Implementation steps

1. Decide template ownership: user-owned first is recommended; global templates require admin contract.
2. Use a dialog/drawer built on existing shadcn primitives.
3. Expand template text locally into draft but do not send until user submits.
4. Render metadata only from server completion event.

## Exact target areas expected to change

### Frontend

- `webui/src/features/templates/*`
- `webui/src/features/chat/turn-metadata.tsx`
- Composer and completed-answer UI.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Remove template routes/components; completed chat remains functional.

## Risks and decisions

Template ownership and global sharing must be explicit before backend migration.

## Coding-agent work packet

### Objective

Users can insert approved reusable prompt templates and inspect non-sensitive response metadata.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Decide template ownership: user-owned first is recommended; global templates require admin contract.
2. Use a dialog/drawer built on existing shadcn primitives.
3. Expand template text locally into draft but do not send until user submits.
4. Render metadata only from server completion event.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Templates do not create a second prompt source of truth.
- Metadata never leaks sensitive provider/runtime details.
- No token pricing or API-key UI is copied from source.

### Validation commands

```bash
cd webui && npm run test
```
```bash
cd backend && pytest -q tests/api
```
