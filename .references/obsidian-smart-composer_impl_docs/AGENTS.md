# Agent Operating Contract — Smart Composer Adaptation

## Authority order

1. This `AGENTS.md`
2. `specs/00-governance/constitution.md`
3. Approved feature acceptance criteria
4. Approved API/data contracts
5. Architecture and quality specifications
6. Existing Context Engine code and tests
7. Smart Composer source reference at `6b38ab3c57e03c5c6cbeb79815277857df59cbd8`

## Non-negotiable rules

1. Smart Composer is a **reference**, never the runtime authority.
2. Context Engine FastAPI owns auth, authorization, retrieval, providers, persistence, and audit state.
3. Next.js owns rendering, local interaction state, accessibility, navigation feedback, and stream presentation.
4. Browser code must not contain provider secrets, OAuth flows, Docker access, database credentials, raw provider clients, or local retrieval logic.
5. Do not port Obsidian APIs, PGlite/Drizzle storage, MCP execution, vault scanning, direct note writes, or subscription OAuth.
6. No feature is complete without its specified tests, acceptance evidence, and traceability update.
7. Unknown behaviour is an open decision. Do not recreate it by guessing.
8. Keep changes to one vertical slice. Do not introduce Redis, a queue, an agent framework, a second retrieval stack, or a compatibility layer unless a higher-authority spec approves it.

## Required agent report

```text
Feature: F-### — <name>
Scope: <changed / deliberately not changed>
Specifications read: <paths>
Contracts affected: <paths or none>
Original reference inspected: <commit-pinned paths>
Implementation: <files/modules changed>
Verification: <commands and outcome>
Evidence updated: <paths>
Open decisions / known limits: <items or none>
```
