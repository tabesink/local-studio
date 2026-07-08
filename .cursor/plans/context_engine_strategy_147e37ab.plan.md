---
name: Context Engine Strategy
overview: Complete the ce-strategy first-run interview for Context Engine, then write STRATEGY.md at the repo root using captured answers from sections 1-5 (plus any optional sections).
todos:
  - id: interview-persona
    content: "Interview Section 3: Who it's for (primary persona + JTBD)"
    status: pending
  - id: interview-metrics
    content: "Interview Section 4: Key metrics (3-5, leading + lagging)"
    status: pending
  - id: interview-tracks
    content: "Interview Section 5: Tracks (2-4 investment domains)"
    status: pending
  - id: interview-optional
    content: "Offer optional sections: Milestones, Not working on, Marketing"
    status: pending
  - id: draft-review
    content: Present filled strategy-template draft; one edit round
    status: pending
  - id: write-strategy
    content: Write STRATEGY.md with frontmatter and post-write checklist
    status: pending
isProject: false
---

# Context Engine STRATEGY.md

## Status

First-run interview in progress. Two of five required sections captured.

| Section | Status |
|---------|--------|
| Target problem | Captured |
| Our approach | Captured |
| Who it's for | **Next** |
| Key metrics | Pending |
| Tracks | Pending |
| Milestones (optional) | Pending |
| Not working on (optional) | Pending |
| Marketing (optional) | Pending |

## Captured answers

### Target problem

Internal teams already have governed, domain-scoped RAG with evidence, citations, eligibility, redaction, and safe multi-user sessions — but the chat experience is still a thin question box, not a full context-assembly + turn harness like Local Studio. Members cannot compose turns from validated context (sources, modes, templates, attachments) while the server assembles prompts; administrators still carry ingestion and lifecycle burden without Local Studio's ergonomic loop. Closing that gap is hard because Local Studio's context pipeline and agent-harness patterns must merge into server-owned, multi-user Context Engine without porting Pi runtime, local filesystem skills, JSONL session authority, or a second retrieval stack — while preserving exact domain RAG, contract safety, and constitution boundaries.

### Our approach

We win by treating Local Studio as the UX and turn-harness **reference**, not as the runtime architecture. Context Engine adds server-owned prompt assembly and governed composer references on top of the existing TurnOrchestrator, LightRAG evidence path, and Postgres conversation model, so users get rich turn composition while the backend still owns retrieval, redaction, citations, audit, and session authority. We explicitly do not port Pi runtime, browser-side RAG, local filesystem skills, plugin behavior, or a second retrieval stack.

## Remaining interview (ce-strategy flow)

Per [interview.md](file:///home/tkodippili@mtcdom.multimatic.com/.cursor/plugins/local/compound-engineering/skills/ce-strategy/references/interview.md), continue one section at a time with pushback when answers fall into anti-patterns:

1. **Who it's for** — "Who is the primary user, and what job are they hiring this product to do?" (JTBD framing; one primary persona)
2. **Key metrics** — "What 3-5 metrics will tell you whether the approach is working?" (mix leading/lagging; avoid vanity)
3. **Tracks** — "What are the 2-4 tracks of work you're investing in to execute the approach?" (investment domains, not feature lists)
4. **Optional** — Milestones, Not working on, Marketing (skip by default unless user engages)

## Write step (after sections 1-5 complete)

1. Read [strategy-template.md](file:///home/tkodippili@mtcdom.multimatic.com/.cursor/plugins/local/compound-engineering/skills/ce-strategy/references/strategy-template.md)
2. Fill template with captured language; set frontmatter:
   - `name: Context Engine`
   - `last_updated: 2026-07-08`
3. Present full draft in chat; offer one edit round
4. Write to [`STRATEGY.md`](STRATEGY.md) at repo root
5. Note downstream grounding for `ce-ideate`, `ce-brainstorm`, `ce-plan`

## Grounding context (read-only, already in repo)

- [`CONTEXT.md`](CONTEXT.md) — product vocabulary and boundaries
- [`AGENTS.md`](AGENTS.md) — constitution and non-negotiables (server-owned authority, no browser RAG, contract safety)
- [`.devnotes/local-studio-templates/local-studio-context-pipline.md`](.devnotes/local-studio-templates/local-studio-context-pipline.md) — Local Studio reference patterns being merged

## Quality bar before write

- Target problem and Our approach clearly connected (diagnosis → guiding policy)
- 3-5 metrics, 2-4 tracks
- No placeholders; optional sections deleted if unused
- Whole doc readable in under 5 minutes
