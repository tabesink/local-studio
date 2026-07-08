---
name: Context Engine
last_updated: 2026-07-08
---

# Context Engine Strategy

## Target problem

Internal teams already have governed, domain-scoped RAG with evidence, citations, eligibility, redaction, and safe multi-user sessions, but the chat experience is still a thin question box, not a full context-assembly and turn-harness loop like Local Studio. Members cannot compose turns from validated context while the server assembles prompts, and administrators still carry ingestion and lifecycle burden without the same ergonomic "load context, ask, stream, inspect evidence" workflow.

## Our approach

We win by treating Local Studio as the UX and turn-harness reference, not as the runtime architecture. Context Engine adds server-owned prompt assembly and governed composer references on top of the existing TurnOrchestrator, LightRAG evidence path, and Postgres conversation model, so users get rich turn composition while the backend still owns retrieval, redaction, citations, audit, and session authority.

## Who it's for

**Primary:** Member operators - They're hiring Context Engine to ask evidence-grounded questions against governed knowledge domains and shape each turn with trusted context, without managing retrieval, prompts, credentials, or source plumbing themselves.

**Enabling:** Administrators - They curate domains, documents, provider settings, lifecycle, diagnostics, and trust boundaries so Members can work safely inside a shared RAG workspace.

## Key metrics

- **Composer-ref usage** - Percentage of chat turns that use governed composer context refs instead of only a plain message.
- **Grounded turn completion rate** - Percentage of grounded turns that complete the expected stream lifecycle and produce a done event.
- **Evidence inspection rate** - Percentage of grounded answers where Members inspect citations or evidence details.
- **Repeat weekly Member usage** - Percentage of active Members who return weekly for governed work.
- **Domain readiness and freshness** - Percentage of active knowledge domains that remain ready, indexed, and fresh enough for Member workflows.

## Tracks

### Governed context assembly

Give Members richer ways to shape each turn with validated context refs instead of raw prompt stuffing.

_Why it serves the approach:_ It brings Local Studio-style composition into Context Engine while preserving backend authority over what enters the prompt.

### Server-owned turn harness

Make composed turns bounded, streamable, durable, and repeatable through the existing server-side orchestration path.

_Why it serves the approach:_ It adapts Local Studio's turn ergonomics without porting Pi runtime, browser-side RAG, local JSONL sessions, plugins, or a second retrieval stack.

### Evidence trust loop

Keep citations, evidence mapping, redaction, and inspection central to every grounded answer.

_Why it serves the approach:_ It protects Context Engine's core promise: users can trust answers because they can inspect the governed evidence behind them.

### Domain operations readiness

Reduce the admin burden required to keep shared knowledge domains usable, current, diagnosable, and safe.

_Why it serves the approach:_ Rich turn composition only works if the underlying domains stay ready and trustworthy for the teams depending on them.
