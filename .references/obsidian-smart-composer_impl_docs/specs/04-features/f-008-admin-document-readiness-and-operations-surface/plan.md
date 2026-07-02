---
id: F-008-PLAN
title: Admin Document Readiness and Operations Surface implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002]
supersedes: []
---
# Plan

## Goal

Admins can see document readiness and act through existing Context Engine ingestion/lifecycle contracts while members continue querying.

## Implementation steps

1. Build admin feature module under `features/sources`.
2. Consume existing status endpoints; do not invent a second job model.
3. Use polling only when an existing operation is nonterminal; stop on terminal/unmount.
4. Keep upload progress/status and querying independent.

## Exact target areas expected to change

### Frontend

- `webui/src/features/sources/*`, `webui/src/app/(authenticated)/settings/sources/page.tsx`
- Role-aware navigation only.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Remove admin UI routes; backend operations remain unchanged.

## Risks and decisions

Use exact current Context Engine operation/source statuses rather than Smart Composer’s progress shape.

## Coding-agent work packet

### Objective

Admins can see document readiness and act through existing Context Engine ingestion/lifecycle contracts while members continue querying.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Build admin feature module under `features/sources`.
2. Consume existing status endpoints; do not invent a second job model.
3. Use polling only when an existing operation is nonterminal; stop on terminal/unmount.
4. Keep upload progress/status and querying independent.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- Member querying stays responsive while admin sees independent ingestion state.
- No raw parser/provider/runtime errors are displayed.
- No new worker, queue, or orchestration service is added by UI work.

### Validation commands

```bash
cd webui && npm run test
```
```bash
cd backend && pytest -q tests/api tests/workers
```
