---
id: WF-001
title: Grounded chat workflow
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Grounded chat workflow

```text
member selects domain
  → optionally adds source/evidence context tokens
  → submits a question
  → FastAPI authenticates, authorizes, validates, persists guarded turn intent
  → FastAPI retrieves only within selected domain
  → FastAPI streams typed events
  → Next.js renders partial answer and evidence
  → FastAPI settles completed/failed/cancelled state
  → Next.js exposes safe retry/new-turn actions
```

The browser never compiles vault text, selects a provider, calls an LLM, or synthesizes citations.
