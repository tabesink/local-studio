---
id: CON-000
title: Contract Conventions
status: approved
owner: Context Engine engineering team
last_reviewed: 2026-06-30
depends_on: [GOV-001, ARCH-001]
supersedes: []
---

# Contract Conventions

Contracts are boundary agreements, not implementation notes. Context Engine uses:

- API contracts for HTTP request/response/error/auth behavior;
- SSE contracts for Context Engine streaming events;
- data contracts for persistent ownership, state, and migration rules;
- AI contracts for retrieval, grounding, prompt, citation, fallback, and evaluation behavior.

## Compatibility Policy

- Default to additive changes.
- Do not repurpose a field.
- Version breaking changes or coordinate consumer migration.
- Capture OpenAPI/runtime fixtures before frontend wiring.
- Normalize API errors as `{ error: { code, message, requestId, fields? } }`.
- Map snake_case backend names to frontend camelCase at feature boundaries only.

## Active Contracts

- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
