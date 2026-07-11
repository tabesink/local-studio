---
id: F-002-PLAN
title: Workspace Shell and Domain Scope implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001]
supersedes: []
---
# Plan

## Goal

A user can select an authorized domain and work inside a stable Local Studio-style chat workspace.

## Implementation steps

1. Create `features/workspace` with `DomainPicker`, `WorkspaceHeader`, and route-state helper.
2. Load domains through the canonical API client.
3. Persist only non-sensitive UI preference if required; selected domain remains URL/server-derived.
4. Render a clear domain scope label above the composer.

## Exact target areas expected to change

### Frontend

- `webui/src/features/workspace/*`
- `webui/src/app/(authenticated)/chat/page.tsx`
- Authenticated layout/navigation.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Remove workspace route/features; leave session/client untouched.

## Risks and decisions

Confirm the backend’s domain eligibility/status enum before coding display labels.

## Coding-agent work packet

### Objective

A user can select an authorized domain and work inside a stable Local Studio-style chat workspace.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Create `features/workspace` with `DomainPicker`, `WorkspaceHeader`, and route-state helper.
2. Load domains through the canonical API client.
3. Persist only non-sensitive UI preference if required; selected domain remains URL/server-derived.
4. Render a clear domain scope label above the composer.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- The active domain is visible before a question can be sent.
- No domain data is hard-coded in the UI.
- Admin-only navigation is hidden from members and still protected by API.

### Validation commands

```bash
cd webui && npm run lint
```
```bash
cd webui && npm run test
```
