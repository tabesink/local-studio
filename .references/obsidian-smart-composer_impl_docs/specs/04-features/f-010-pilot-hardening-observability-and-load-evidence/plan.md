---
id: F-010-PLAN
title: Pilot Hardening, Observability, and Load Evidence implementation plan
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001, F-004, F-005, F-008]
supersedes: []
---
# Plan

## Goal

The integrated chat workspace has minimum security, failure, visibility, and load evidence before a 5–10 concurrent-user pilot.

## Implementation steps

1. Add request correlation to API responses/SSE metadata.
2. Redact sensitive content by policy.
3. Write smoke/baseline/expected-load scenarios based on actual hardware/provider quotas.
4. Test source deletion while history/evidence exists.
5. Document launch gate and rollback path.

## Exact target areas expected to change

### Frontend

- `load/k6/context-engine-chat.js` or existing test-tool equivalent
- `docs/runbooks/chat-stream-incident.md`
- API logging middleware, tests, CI/release checklist.

### Backend / data

- Implement only the contracts named in this feature if they are not already approved and present.
- Preserve existing Context Engine route, schema, and worker owners where they already satisfy the contract.
- Do not introduce a second service or retrieval path.

## API / compatibility impact

- New or changed API behaviour requires the referenced `specs/03-contracts/` document to be approved first.
- Existing API names take precedence over the proposed names in this package; update the contract and traceability matrix instead of creating aliases.
- Error payloads follow `CTR-000`.

## Rollback

Disable new optional telemetry emitter; retain structured server logs. Revert UI-only error presentation independently.

## Risks and decisions

No latency thresholds are valid until actual host, model, retrieval, and provider quotas are measured.

## Coding-agent work packet

### Objective

The integrated chat workspace has minimum security, failure, visibility, and load evidence before a 5–10 concurrent-user pilot.

### Repository areas

- `webui/` feature modules and route files listed above.
- FastAPI/API/model/test areas only where a named approved contract requires them.

### Required changes

1. Add request correlation to API responses/SSE metadata.
2. Redact sensitive content by policy.
3. Write smoke/baseline/expected-load scenarios based on actual hardware/provider quotas.
4. Test source deletion while history/evidence exists.
5. Document launch gate and rollback path.

### Constraints

- Maintain existing public API behaviour unless the approved contract explicitly changes it.
- Keep routes thin; put feature behaviour in `features/<area>/`.
- Do not copy provider, OAuth, MCP, PGlite, Obsidian, or direct filesystem code.
- Use the canonical client and server authorization.
- Update test and traceability evidence in the same change.

### Definition of done

- No secrets or raw content in logs.
- Pilot capacity target is measured and recorded.
- Failure does not leave stuck running turns or leaked DB connections.
- Backup/restore and migration plan are proven.

### Validation commands

```bash
cd backend && pytest -q
```
```bash
cd webui && npm run lint && npm run test
```
```bash
k6 run load/k6/context-engine-chat.js
```
