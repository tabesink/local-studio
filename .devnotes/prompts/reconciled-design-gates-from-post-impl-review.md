# Reconciled Design Gates Prompt

Purpose: take an existing post-implementation review package (for example `.devnotes/P3-post-impl-REVIEW/`) and produce a single reconciled design-gates document that answers every item in the package's "Questions MUST Answer Before Coding" section, in the style of `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`.

This prompt is advisory prompt material only. It does not replace `AGENTS.md`, active specs, contracts, acceptance evidence, or traceability. The output is a review decision draft, not implementation authority by itself.

Use the `grill-with-docs` decision method: challenge the plan against active specs and domain language, compare options explicitly, and recommend the lowest-entropy path that satisfies the next phase without inventing product behavior.

---

## When To Use

Use this after a post-implementation review package already exists:

```text
.devnotes/<completed-phase>-post-impl-REVIEW/
  F-###-P#-readiness.md
  ID-A.md
  ID-A-<topic>.md
  ID-A-<topic>-FOLLOWUP.md   # optional
```

Use it when:

- the next phase/feature is scoped in `F-###-P#-readiness.md`;
- parent and focused ID-A memos already contain lean winners, rejected alternatives, and contract patch targets;
- implementation is blocked until contract/data/API questions A–G are reconciled into one decision artifact;
- the team wants a single pre-coding gate before patching `specs/03-contracts/` and the next feature folder.

Do not use this instead of the post-phase review package generator. This prompt consumes that package; it does not recreate it.

---

## Voice Contract

Write like a senior architect/reviewer closing a grill session for a junior dev and coding agent.

Style rules:

- Short sections. Hard decisions. No hedging when active specs already decide something.
- Separate "what is true", "what is recommended", and "what still needs user acceptance".
- Prefer option tables, ASCII diagrams, exact route/table/field names, and patch targets over prose.
- Use product vocabulary from `CONTEXT.md` and the review package. Do not rename core terms.
- Treat `.references/` as evidence only, not authority.
- Reject drift explicitly: name old/reference behavior that must not be copied.
- Mark unresolved items as `Open decision` with owner patch target. Do not guess.
- Use safe language: no secrets, raw source text, runtime URLs, paths, stack traces, prompts, provider payloads, or raw LightRAG hits.
- Every recommendation must name the spec/contract file to patch before code.

Common phrasing patterns:

```text
Recommendation: ...
Patch DATA-001 with: ...
Patch API-001 with: ...
User decision: accepted Option 1.
Open decision: ...
Do not build this in P#.
Document deferred hooks only.
No ADR is needed yet.
Red flags in PR
Contract patch order for junior dev
```

---

## Required Inputs

Fill these placeholders before running the prompt:

```text
Repo root: <repo-root>
Completed phase: <P#>, feature <F-### - name>
Next phase under review: <P#>, feature <F-### - name>
Review package folder: .devnotes/<completed-phase>-post-impl-REVIEW/
Readiness file: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-readiness.md
Parent decision memo: .devnotes/<completed-phase>-post-impl-REVIEW/ID-A.md
Focused ID-A memos: <list all ID-A-*.md files in the package>
Style exemplar: .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md
Desired output path: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-reconciled-design-gates.md
User decisions already made: <none, or list accepted options / overrides>
Relevant reference folders/files: <references or "none">
```

---

## Evidence Inputs To Require

Force the agent to read these before writing:

```text
AGENTS.md
README.md
CONTEXT.md
DESIGN.md                         # only if frontend is in scope for next phase
specs/00-governance/constitution.md
specs/01-product/                   # as referenced by next feature
specs/02-architecture/              # as referenced by next feature
specs/03-contracts/                 # API, data, SSE, AI contracts named by next feature
specs/04-features/<completed-feature>/
specs/04-features/<next-feature>/
specs/05-quality/                   # as referenced by next feature
specs/07-traceability/feature-register.md
completed phase implementation and tests
review package:
  F-###-P#-readiness.md
  ID-A.md
  all ID-A-<topic>.md
  any ID-A-<topic>-FOLLOWUP.md
relevant .references/ evidence, if available
style exemplar:
  .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md
```

Required evidence scan before writing:

```text
1. Confirm the readiness file's "Questions MUST Answer Before Coding" table is the question inventory.
2. Confirm ID-A lean winner, rejected alternatives, and focused memo decisions cover those questions.
3. List every public contract shape still missing from API/data/SSE/AI specs.
4. Find contradictions between readiness, ID-A memos, active specs, code, tests, and references.
5. Identify constitution/KISS/YAGNI rejections that must appear in Product DNA Locks or Red Flags.
6. Identify deferred next-phase hooks that must be documented but not implemented now.
7. Identify stop conditions from AGENTS.md that affect recommendations.
```

---

## Copy-Paste Prompt

```text
You are a senior developer / architect / reviewer producing a reconciled design-gates document for a spec-driven Context Engine repo.

Goal:
Take an existing post-implementation review package and produce one reconciled design-gates document that answers every question in the readiness file's "Questions MUST Answer Before Coding" section.

Inputs:
- Repo root: <repo-root>
- Completed phase: <P#>, feature <F-### - name>
- Next phase under review: <P#>, feature <F-### - name>
- Review package folder: .devnotes/<completed-phase>-post-impl-REVIEW/
- Readiness file: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-readiness.md
- Parent decision memo: .devnotes/<completed-phase>-post-impl-REVIEW/ID-A.md
- Focused ID-A memos: <list all ID-A-*.md files>
- Style exemplar: .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md
- Desired output path: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-reconciled-design-gates.md
- User decisions already made: <none, or accepted options / overrides>
- Relevant reference folders/files: <references or "none">

Read in this order before writing:
1. AGENTS.md
2. README.md
3. specs/00-governance/constitution.md
4. CONTEXT.md
5. DESIGN.md only if frontend is in scope for the next phase
6. completed feature folder
7. next feature folder: spec.md, plan.md, tasks.md, test-plan.md, acceptance.md
8. every API, SSE, data, AI, architecture, product, and quality spec referenced by either feature
9. feature register and traceability files
10. completed phase implementation and tests
11. review package files:
    - F-###-P#-readiness.md
    - ID-A.md
    - all ID-A-<topic>.md
    - any ID-A-<topic>-FOLLOWUP.md
12. relevant .references evidence
13. style exemplar: .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md

Method:
Use grill-with-docs discipline.
- Reconcile the review package against active specs and contracts.
- For each readiness question, compare real options, not strawmen.
- Recommend the lowest-entropy path that satisfies the next phase without inventing product behavior.
- When the review package already decided something, carry that decision forward.
- When user decisions are provided in inputs, record them explicitly as "User decision: accepted Option N."
- When specs are silent and ID-A memos disagree, mark "Open decision" and stop short of guessing.

Hard rules:
- Active specs are intended behavior.
- .references are evidence only.
- Do not invent product behavior.
- Do not silently change contracts.
- The output is a review decision draft, not implementation authority.
- Before coding, the team must still patch the named contract/spec files.
- Browser must remain thin; never recommend browser access to private services, storage, providers, LightRAG, runtime URLs, or secrets.
- Do not expose private fields, paths, URLs, raw payloads, prompts, source text, stack traces, or secrets in examples.
- Reject generic jobs/workflow/event-bus/parser-profile frameworks unless an approved spec explicitly requires them.
- Keep recommendations scoped to the next vertical slice only.
- Document deferred hooks for later phases without implementing them now.

Output:
Write Markdown to the desired output path.

Required document structure:

# F-### / P# Reconciled Design Gates

Status: review decision draft
Feature: F-### - <feature name>
Date: <YYYY-MM-DD>
Method: grill-with-docs

## Scope

State that this document answers the "Questions MUST Answer Before Coding" in `<readiness-file>`.

State clearly that this is not implementation authority by itself.

List the canonical patch targets that must be updated before coding, for example:
- specs/03-contracts/data/context-engine-data.md
- specs/03-contracts/api/context-engine-v1.md
- specs/04-features/F-###-.../spec.md
- specs/04-features/F-###-.../plan.md
- specs/04-features/F-###-.../test-plan.md

Only include files actually needed for this phase.

## Sources Grilled

Bulleted list of every governing doc, contract, feature folder, review memo, implementation file, test, and reference consulted.

## Product DNA Locks

Short bullet list of non-negotiable vocabulary, ownership boundaries, and KISS/YAGNI rejections for this phase.

Must include:
- canonical product terms used in this phase
- what this phase creates/owns
- what this phase must not do
- backend vs browser trust boundaries
- explicit rejections of overbuilt infra or reference-model drift

## Recommended Build Shape

One ASCII architecture block showing the typed tables/services/worker boundaries recommended for this phase.

Use exact entity names from the review package when available.

## A. Contract / Data / API Gates

Create one subsection per readiness question in block A.

For each question:

### A1. <exact question text?>

Use a 4-column option table:

| Option | Pros | Cons | Example |

Then:
- `Recommendation: ...`
- If user input supplied an accepted option, add `User decision: accepted Option N.`
- Concrete patch content under `Patch DATA-001 with:` / `Patch API-001 with:` / `Patch F-### spec with:`
- Use fenced code blocks for exact fields, indexes, constraints, routes, DTO sketches, and error codes when the review memos support them.
- If still unresolved, write `Open decision:` and name the owner patch target.

Repeat for A2..An exactly matching the readiness inventory.

## B. <second readiness block name>

Same pattern as section A for every question in block B.

Use the exact block names and question IDs from the readiness file.
Typical blocks may include:
- Parser / Private Integration Gates
- Worker / Concurrency / Idempotency Gates
- Delete / Destructive-State Gates
- Storage / Private Data Gates
- Authz / Roles Gates
- Test / Evidence Gates

Do not rename question IDs.
Do not skip questions.
Do not merge unrelated questions unless the readiness file itself merged them.

## Contract Patch Order For Junior Dev

Numbered implementation order that starts with contract/spec patches and ends with acceptance/traceability updates.

Must reflect tasks.md build order from the next feature when possible.

## Red Flags In PR

3-column table:

| Red flag | Why it is bad | Junior-dev rule |

Include at least 8 red flags when the phase has meaningful drift risk.
Draw these from ID-A rejected alternatives, constitution bans, security rules, and stale-worker/delete/indexing fences.

## Context And ADR Notes

State whether `CONTEXT.md` needs changes.
State whether an ADR is needed now or can wait.
If no ADR is needed, say why the decisions are already governed by feature/contract docs.

Decision standard for each question:
- Prefer typed tables, closed enums, versioned DTOs, and single-owner services.
- Reject generic JSON truth, generic job/workflow systems, duplicate truth, browser-private-service access, and public leakage of private runtime/storage/provider details unless an approved spec requires them.
- If a decision would change a public contract, state the target spec patch before implementation.
- If a decision is deferred to a later phase, say so explicitly and define the seam/hook without building it now.

Reconciliation rules:
- Readiness question inventory is authoritative for coverage.
- ID-A parent memo is authoritative for lean winner and rejected alternatives.
- Focused ID-A memos are authoritative for field-level detail.
- Active specs win over review memos when they conflict; call out the conflict explicitly.
- Reference code is evidence only; use it to explain deltas, not to override greenfield contracts.
- When multiple memos answer the same question, prefer the most specific focused memo, but reconcile contradictions instead of hiding them.
- When a recommendation depends on a later phase, document the handoff and keep P# scope minimal.

Quality bar:
- Every readiness question A–G has a matching subsection.
- Every subsection has an option table, a recommendation, and either concrete patch content or an explicit open decision.
- Every patch recommendation names a target spec/contract file.
- Every deferred later-phase behavior is labeled deferred with no P# implementation.
- No doc treats .references as source of truth.
- No doc invents product behavior where specs are silent.
- No doc exposes secrets, paths, runtime URLs, raw payloads, prompts, source text, stack traces, provider payloads, or raw LightRAG hits.

After writing, run a lightweight QA and append a short QA note at the bottom of the output file:

## QA

- List readiness question IDs covered.
- List any open decisions still blocking coding.
- List forbidden-string scan result: secret, token value, runtime URL, host path, stack trace, raw source text.
- Confirm output path written.
- Confirm style parity with the exemplar sections: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A–G gates, Contract Patch Order, Red Flags, Context/ADR Notes.
```

---

## Prompt 2 - Reconcile Only Missing Questions

Use when a reconciled design-gates doc already exists but new ID-A follow-ups or user decisions arrived.

```text
Update .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-reconciled-design-gates.md.

Read:
- existing reconciled design-gates doc
- F-###-P#-readiness.md
- ID-A.md and all focused ID-A memos
- any new ID-A-*-FOLLOWUP.md files
- active specs/contracts for the next feature

Task:
Reconcile only these question IDs:
- <A1>
- <C3>
- <G2>

Rules:
- Preserve unchanged sections.
- For each listed question, ensure option table + recommendation + patch target or open decision.
- Record user decisions explicitly when provided.
- Refresh Contract Patch Order and Red Flags only if the new decisions change them.
- Keep the same voice and structure as .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md.
- Do not invent behavior.
```

---

## Prompt 3 - QA / Normalizer

Use after the reconciled design-gates doc exists.

```text
Review .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-reconciled-design-gates.md against:
- F-###-P#-readiness.md question inventory
- ID-A.md and focused ID-A memos
- .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md style exemplar
- AGENTS.md stop conditions

Check:
- Every readiness question A–G is answered exactly once.
- Every answer has option table, recommendation, and patch target or open decision.
- Product DNA Locks match CONTEXT.md vocabulary and next-phase scope boundaries.
- Recommended Build Shape matches ID-A lean winner.
- Contract Patch Order starts with spec/contract edits, not code.
- Red Flags cover generic infra drift, leakage, stale-worker/delete fences, and out-of-phase behavior.
- No .references material is treated as authority.
- No forbidden private data appears in examples.
- Deferred P#+ behavior is documented but not implemented in current phase recommendations.

Output:
- Findings first, ordered by severity.
- Then a short change list for edits you made.
- If editing, keep changes advisory under .devnotes only unless explicitly asked to patch specs.
```

---

## Quick Fill-In Template

```text
Using .devnotes/prompts/reconciled-design-gates-from-post-impl-review.md, produce a reconciled design-gates document for the next phase after <completed phase/feature>.

Review package: .devnotes/<completed-phase>-post-impl-REVIEW/
Readiness: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-readiness.md
Style exemplar: .devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md
Output: .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-reconciled-design-gates.md

Read AGENTS.md, README.md, constitution, CONTEXT.md, completed and next feature folders, all referenced contracts/specs, implementation/tests, the full review package, and relevant .references evidence.

Answer every "Questions MUST Answer Before Coding" item with option tables, recommendations, and named contract patch targets. Mark unresolved items as open decisions. Include Product DNA Locks, Recommended Build Shape, Contract Patch Order, Red Flags, and Context/ADR Notes.

Do not invent behavior. Keep reference code as evidence only. Use grill-with-docs discipline.
```

---

## Relationship To Other Prompt Kits

```text
post-phase-review-package-prompts.md
  -> creates F-###-P#-readiness.md, ID-A.md, focused ID-A memos

reconciled-design-gates-from-post-impl-review.md   # this file
  -> consumes that package
  -> produces F-###-P#-reconciled-design-gates.md

phase-implementation-summary-for-junior-devs.md
  -> summarizes an already implemented phase for juniors/agents
```

Typical sequence:

```text
1. Implement completed phase
2. Run post-phase review package prompt
3. Run reconciled design-gates prompt            # this prompt
4. Patch contracts/specs from reconciled gates
5. Implement next phase
6. After implementation, run phase summary prompt if needed
```
