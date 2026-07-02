---
id: F-001-PLAN
title: Next.js Composition Root and Safe Session Bridge implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-000]
supersedes: []
---
# Plan

## Goal

A signed-in user reaches a protected Next.js workspace shell through the existing Context Engine session boundary.

## Implementation steps

1. Create `webui/src/app/(authenticated)/layout.tsx` as the browser composition root.
2. Add `lib/api/client.ts`, `errors.ts`, `contracts.ts`, and `auth/session.ts`.
3. Configure a same-origin API base; do not publish private backend URLs in browser configuration.
4. Resolve session once through the canonical client; do not mirror it into localStorage.
5. Add app-level error and not-found boundaries.

## Exact target areas expected to change

### Frontend

- `webui/src/app/(authenticated)/layout.tsx`
- `webui/src/lib/api/client.ts`
- `webui/src/lib/api/errors.ts`
- `webui/src/lib/auth/session.ts`
- Existing root layout and proxy/config only as required.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Remove the new route group/client; backend session behaviour is untouched.

## Risks and decisions

Actual Context Engine session path may differ; stop until its current OpenAPI/route is verified.

## Coding-agent work packet

### Objective

A signed-in user reaches a protected Next.js workspace shell through the existing Context Engine session boundary.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Create `webui/src/app/(authenticated)/layout.tsx` as the browser composition root.
2. Add `lib/api/client.ts`, `errors.ts`, `contracts.ts`, and `auth/session.ts`.
3. Configure a same-origin API base; do not publish private backend URLs in browser configuration.
4. Resolve session once through the canonical client; do not mirror it into localStorage.
5. Add app-level error and not-found boundaries.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- A signed-out user cannot render protected content.
- A member and admin receive only display-safe session data.
- No secret/token is placed in browser storage.
- All browser API calls use one transport boundary.

### Validation commands

```bash
cd webui && npm run lint
```
```bash
cd webui && npm run test
```
```bash
cd backend && pytest -q
```
