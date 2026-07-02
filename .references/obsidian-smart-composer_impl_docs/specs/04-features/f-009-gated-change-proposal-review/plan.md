---
id: F-009-PLAN
title: Gated Change-Proposal Review implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-005, F-006]
supersedes: []
---
# Plan

## Goal

None until ADR-005 and `DATA-CHG-001` are approved. This folder exists to prevent accidental porting of Smart Composer direct-file apply.

## Implementation steps

1. Read ADR-005 and change-proposal contract.
2. Stop and request decisions listed in the contract.
3. Do not create an implementation branch before approval.

## Exact target areas expected to change

### Frontend

- None until approval; optional explanatory empty-state component.
- None.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Not applicable; no production capability exists.

## Risks and decisions

Direct apply would create data-loss, audit, provenance, and re-index integrity risks.

## Coding-agent work packet

### Objective

None until ADR-005 and `DATA-CHG-001` are approved. This folder exists to prevent accidental porting of Smart Composer direct-file apply.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Read ADR-005 and change-proposal contract.
2. Stop and request decisions listed in the contract.
3. Do not create an implementation branch before approval.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- No direct edit capability is inadvertently shipped.
- A future proposal contains source-versioning, approval, audit, and re-index plan.

### Validation commands

```bash
git grep -nE "(node:fs|obsidian|applyChangesToFile|TFile)" -- webui backend || true
```
