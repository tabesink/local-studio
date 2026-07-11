# Phase Implementation Summary Prompt

Purpose: generate a terse junior-dev summary for an implemented Context Engine phase, in the style of `.devnotes/P2-trusted-runtime-config-impl-SUMMARY.md`.

This prompt is advisory prompt material only. It does not replace `AGENTS.md`, active specs, contracts, acceptance evidence, implementation logs, or traceability.

---

## Copy-Paste Prompt

```text
You are a senior developer / architect writing a terse implementation summary for junior developers and coding agents in the Context Engine spec-driven rebuild.

Goal:
Create a phase summary that explains what was implemented, why it exists, how it connects to the overall product architecture and product identity, and what junior devs must understand before touching the next slice.

Inputs:
- Repo root: <repo-root>
- Completed phase: <P#>
- Completed feature: <F-### - feature name>
- Completed feature folder: specs/04-features/<F-###-slug>/
- Post-implementation review folder: .devnotes/<P#>-post-impl-REVIEW/ or <path>
- Existing phase summary style exemplar: .devnotes/P2-trusted-runtime-config-impl-SUMMARY.md
- Desired output path: .devnotes/<P#>-<short-feature-name>-impl-SUMMARY.md

Read in this order before writing:
1. AGENTS.md
2. README.md
3. specs/README.md
4. specs/00-governance/constitution.md
5. CONTEXT.md
6. DESIGN.md only if the completed phase includes frontend work
7. Completed feature folder: spec.md, plan.md, tasks.md, test-plan.md, acceptance.md, implementation-log.md
8. Every API, SSE, data, AI, architecture, product, and quality contract referenced by the feature
9. specs/07-traceability/feature-register.md
10. Existing implementation files and tests for the completed phase
11. The post-implementation review docs for the phase
12. .devnotes/P2-trusted-runtime-config-impl-SUMMARY.md as the style and structure exemplar

Evidence rules:
- Active specs and contracts are the source of truth.
- Post-implementation review docs are synthesis evidence; verify important claims against specs, code, tests, and acceptance evidence.
- .references/ material is evidence only, never authority.
- Do not invent behavior. If behavior is unclear, write it as an open decision or known limit.
- Do not claim a phase is implemented unless acceptance evidence, tests, implementation log, and feature register support that claim.

Output:
Write the summary to the desired output path. Use terse Markdown. Prefer tables, ASCII diagrams, exact route/table/service names, and short bullets over long explanation.

Required structure:

# Phase <N> (P<N>) - <Feature Name>

**Feature:** `F-###`
**One-liner:** <one sentence explaining the phase in product language>

<One short bridge paragraph explaining what the previous phase gave us and what this phase adds.>

---

## What got built

Use a compact table:

| Piece | Purpose |
| --- | --- |
| <tables/services/routes/workers/contracts/tests> | <why they matter> |

Only include major pieces a junior dev needs to orient themselves.

---

## Mental model

Add one ASCII diagram that shows the data, service, lifecycle, or trust model at the center of this phase.

Rules:
- Use Context Engine vocabulary from CONTEXT.md.
- Show ownership boundaries.
- Show how this phase depends on earlier phases.
- Hide private implementation details from browser-facing surfaces.

---

## Main flow

Use an ASCII sequence or compact table for the core admin/member/system flow.

Include exact API route names when this phase added or changed API behavior.
Include exact state names when this phase added or changed lifecycle behavior.

---

## Security and ownership boundaries

Write this as a "memorize these" section.

Must call out anything the browser must never see or control:
- secrets
- raw prompt or raw answer text
- raw source text
- raw LightRAG hits
- provider payloads
- runtime URLs
- host paths
- container ids
- stack traces
- private runtime identifiers

Map each sensitive concern to the backend owner that handles it.

---

## Core service / worker / resolver

Name the central backend abstraction introduced or used by the phase.

Explain:
- why it exists
- what it validates or owns
- what it deliberately does not do
- which later phases should call it instead of duplicating logic

If the phase has no central abstraction, replace this section with "Key backend rules".

---

## Key files

Use a compact table:

| File | What |
| --- | --- |
| `<path>` | <short role> |

Include only files junior devs should open first: models, services, routes, migrations, workers, contracts, tests, acceptance evidence.

---

## What P<N> deliberately did not build

List explicit non-goals from the spec, plan, review docs, and implementation log.

This section is important: prevent juniors from continuing into the next phase accidentally.

---

## How P<N> connects forward

Add one ASCII diagram or short dependency map:

P<N-1> -> P<N> -> P<N+1>

Explain what later phases consume from this phase:
- database rows
- services/resolvers
- state machines
- DTOs/contracts
- workers/controllers
- tests/fixtures

Call out any stop conditions or open decisions that block the next phase.

---

## Junior dev checklist

Write 5-8 short, imperative bullets.

Each bullet should prevent a likely mistake:
- "Read safe DTOs first..."
- "Do not return..."
- "Run..."
- "Use..."
- "Do not copy..."

Include the most important test command(s) for this phase.

---

**Status:** <F-### status and date, with acceptance/test evidence summary.>

Style rules:
- Match the terse, senior, practical tone of `.devnotes/P2-trusted-runtime-config-impl-SUMMARY.md`.
- Use product words: Knowledge Domain, Source Document, Canonical Source, Source Block, Evidence, Citation, Conversation, Turn, Redaction, Administrator, Member.
- Explain "why this exists" before implementation trivia.
- Prefer "backend owns..." / "browser sees..." / "later phases call..." phrasing.
- Use exact names for tables, routes, states, services, tests, and contracts.
- Keep diagrams simple enough to skim.
- Keep the document short enough for a junior dev to read before coding.

Do not include:
- broad history
- generic architecture lecture
- unresolved speculation
- copied raw review text
- raw provider payloads
- real secrets or token-shaped examples
- host-specific paths
- stack traces
- raw source text
- runtime URLs or container ids

Final QA before finishing:
1. Confirm every major claim is backed by a spec, contract, code file, test, acceptance note, implementation log, feature register entry, or review doc.
2. Confirm no public DTO example exposes private fields or forbidden data.
3. Confirm "What got built", "What did not build", and "How it connects forward" are all present.
4. Confirm at least one diagram exists.
5. Confirm the junior checklist names the key test command(s).
6. Confirm open decisions / known limits are explicit rather than silently resolved.
```

---

## Notes For Use

Use this after a phase has already been implemented and reviewed. For creating the review package itself, use `.devnotes/prompts/post-phase-review-package-prompts.md` instead.

The summary is not a contract. If the summary discovers drift, stop and patch the authoritative spec, contract, acceptance evidence, or traceability file first.
