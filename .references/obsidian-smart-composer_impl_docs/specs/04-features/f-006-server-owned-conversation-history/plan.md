---
id: F-006-PLAN
title: Server-Owned Conversation History implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-004, F-005]
supersedes: []
---
# Plan

## Goal

Users can create, resume, rename, and delete their own conversation history without expanding retrieval across domains.

## Implementation steps

1. Add API list/detail/mutation functions under `features/conversations`.
2. Render summaries separate from detailed turns to bound list payloads.
3. On switching domain for a new turn, do not alter old turn domains.
4. Use server state after mutations; optimistic deletion is optional and must restore on failure.
5. Render redacted turns per data contract.

## Exact target areas expected to change

### Frontend

- `webui/src/features/conversations/*`
- Chat page route, chat reducer input/output wiring.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Feature is server migration-coupled; roll back UI first, then use forward-only data migration/recovery plan—never destructive downgrade.

## Risks and decisions

Data deletion/redaction policy requires product/privacy approval before enabling production persistence.

## Coding-agent work packet

### Objective

Users can create, resume, rename, and delete their own conversation history without expanding retrieval across domains.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Add API list/detail/mutation functions under `features/conversations`.
2. Render summaries separate from detailed turns to bound list payloads.
3. On switching domain for a new turn, do not alter old turn domains.
4. Use server state after mutations; optimistic deletion is optional and must restore on failure.
5. Render redacted turns per data contract.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- History is durable after browser reload.
- Past turns cannot expand current retrieval domain.
- No conversation contains unredacted evidence after source/domain delete according to policy.

### Validation commands

```bash
cd backend && alembic upgrade head
```
```bash
cd backend && pytest -q tests/api tests/models
```
```bash
cd webui && npm run test
```
