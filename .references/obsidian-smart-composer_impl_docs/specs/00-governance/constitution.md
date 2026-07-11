---
id: GOV-001
title: Context Engine adaptation constitution
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Constitution

## Product boundary

Context Engine is a shared, authenticated RAG workspace. Smart Composer is an external reference for chat interaction and visual behaviour only.

## Ownership

| Concern | Owner |
|---|---|
| session, roles, permission, domain eligibility | FastAPI |
| documents, parsing, indexing, retrieval, evidence | FastAPI + trusted private services |
| provider secrets/model routing | FastAPI / trusted runtime only |
| conversation persistence and deletion/redaction | FastAPI + PostgreSQL |
| rendering, local UI state, keyboard interaction, SSE rendering | Next.js |

## Engineering principles

- KISS: one clear path for each capability.
- DRY: one canonical contract and one owner per rule.
- YAGNI: do not add agents, MCP, local vector stores, browser provider clients, or generic workflow engines.
- Server-first: browser receives only safe view data.
- Evidence-first: answers expose only server-authorized evidence.
- Isolation: a selected domain scopes current-turn retrieval; prior turns never expand the scope.

## Hard constraints

- No secrets, tokens, raw provider output, raw document body, database URLs, stack traces, or internal runtime paths in browser code/logs.
- No local storage for credentials or authoritative chat history.
- Direct URL access must be protected by FastAPI, not navigation visibility.
- A domain/source delete must prevent future retrieval immediately and follow the approved history-redaction contract.
