---
id: PRD-001
title: Contextual chat adaptation product brief
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Product brief

## Outcome

Members ask grounded questions in a selected Context Engine domain. They can see the answer stream, inspect evidence, reuse safe prompt templates, and revisit their own conversations. Admins additionally operate domains, sources, providers, and document readiness through existing Context Engine controls.

## Source-inspired user value

| Smart Composer idea | Target outcome |
|---|---|
| Contextual chat | Domain-scoped evidence-grounded chat. |
| `@` context selection | Safe source/evidence context tokens controlled by API. |
| Vault search | Server retrieval only; no client-side index. |
| Chat history | Server-owned user conversations. |
| Prompt templates | Template selection and expansion without client secrets. |
| Response metadata | Safe server-provided model/latency/citation metadata. |
| Apply edit | Deferred change-proposal workflow, not direct write. |

## Explicit exclusions

MCP tools, direct provider selection per end user, subscription OAuth, local Ollama setup, local vault indexing, arbitrary website fetching, direct file writes, and a second RAG stack.
