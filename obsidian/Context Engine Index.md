---
type: index
status: active
audience:
  - agent
  - junior-dev
tags:
  - type/index
  - status/active
---

# Context Engine Index

Entry point for Context Engine rebuild notes (spec-driven, phase-by-phase).

## Navigation

- [[Build Order Index]] — P0–P12 map and spec paths
- [[Lessons Index]] — junior-dev teaching notes
- [[Architecture Index]] — cross-phase system design
- [[Reviews Index]] — post-impl review packages
- [[Guidelines Index]] — coding and vault conventions
- [[Inbox Index]] — unprocessed scratch / brainstorm captures

## Architecture (quick links)

- [[Architecture Index]] — system design notes
- [[Pi SDK Coding Agent Runtime]] — Local Studio coding-agent harness (Pi); not RAG; CE later-release boundary

## Inbox (quick links)

- [[LS Harness To CE Rag Brainstorm]] — LS harness/middleware → CE basic/advanced RAG tools (scratch)

## Lessons (quick links)

- [[Backend-Owned Lifecycle]] — workers, Postgres leases, not a job platform
- [[Job Platform vs Backend-Owned Lifecycle]] — Redis/queue pattern vs CE; when to pick which
- [[Git Branching For Feature Slices]] — branch, commit, PR, merge, delete per vertical slice

## Authority

| Source | Role |
| --- | --- |
| `specs/` | Implementation truth |
| `AGENTS.md` | Binding agent rules |
| `obsidian/` | Distilled notes — spec wins on conflict |

## Repo sources

- `specs/README.md`
- `AGENTS.md`
- `CONTEXT.md`
