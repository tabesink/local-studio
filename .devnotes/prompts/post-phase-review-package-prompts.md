# Post-Phase Review Package Prompt Kit

Purpose: recreate the `.devnotes/P2-post-impl-REVIEW/` document style after a phase implementation, with the same senior engineer / architect / reviewer voice: terse, decisive, safe for junior developers, and grounded in active specs.

This is advisory prompt material only. It does not replace `AGENTS.md`, specs, contracts, acceptance evidence, or traceability.

---

## Reverse-Engineered Package Shape

Use this package when a phase has just been implemented and the next phase needs a review gate, blocker map, and junior-dev implementation path.

Expected output folder:

```text
.devnotes/<completed-phase>-post-impl-REVIEW/
  F-###-P#-readiness.md
  ID-A.md
  ID-A-<topic-1>.md
  ID-A-<topic-2>.md
  ID-A-<topic>-FOLLOWUP.md        # only when follow-up questions were resolved
```

Folder name tracks the phase just completed. `F-###-P#-readiness.md` tracks the next feature/phase being prepared.

Minimum package:

- `F-###-P#-readiness.md`: broad phase/feature readiness, gap analysis, source comparison, build order, acceptance gate.
- `ID-A.md`: parent decision memo for the main blocker cluster, usually contract/data/API ownership.
- `ID-A-<topic>.md`: one focused explainer per decision, written for a junior dev who will implement it.
- `ID-A-<topic>-FOLLOWUP.md`: terse closure note when a reviewer question needs a short resolved addendum.

Do not add an index file unless the current package already uses one. The parent `ID-A.md` owns the related-docs table.

---

## Voice Contract

Write like a senior developer, architect, and reviewer giving a junior dev a safe path through a risky slice.

Style rules:

- Short sections. Hard decisions. No hedging when the spec decides something.
- Separate "what is true" from "what is evidence" and "what is still unknown".
- Prefer tables, ASCII diagrams, exact route/table/field names, and implementation order over prose.
- Use product vocabulary from `CONTEXT.md`: Knowledge Domain, Source Document, Evidence, Citation, Turn, Redaction.
- Treat `.references/` as evidence only, not authority.
- Reject drift explicitly: name old/reference behavior that must not be copied.
- End focused memos with tests, red flags, and a one-line summary.
- Use safe language: no secrets, raw source text, runtime URLs, paths, stack traces, prompts, provider payloads, or raw LightRAG hits.
- When behavior is missing, write "open decision" or "blocked", not a guess.

Common phrasing patterns:

```text
Decision
No. Server owns this.
Do not persist this field.
This is a contract gap, not an implementation detail.
Old code is evidence, not a spec.
Greenfield target differs here.
Junior dev: do this order.
Red flags in PR
One-line summary
```

---

## Evidence Inputs To Require

Every prompt below should force the agent to read these before writing:

```text
AGENTS.md
README.md
specs/00-governance/constitution.md
CONTEXT.md
DESIGN.md                         # frontend only
specs/04-features/<completed-feature>/
specs/04-features/<next-feature>/
all contracts named by both features
relevant specs/01-product/
relevant specs/02-architecture/
relevant specs/05-quality/
specs/07-traceability/feature-register.md
existing implementation and tests for the completed phase
relevant .references/ evidence, if available
```

Required evidence scan:

```text
1. Confirm completed phase status from acceptance.md, implementation-log.md, tests, and feature register.
2. Confirm next phase depends_on and acceptance criteria.
3. List public contracts touched or needed: API, SSE, data, AI, quality.
4. Find contradictions between specs, code, tests, and references.
5. Identify missing contract shapes before implementation.
6. Identify stop conditions from AGENTS.md.
```

---

## Prompt 1 - Full Package Generator

Use this when you want the whole document set in one pass.

```text
You are a senior developer / architect / reviewer preparing a post-phase implementation review package for a spec-driven Context Engine repo.

Inputs:
- Repo root: <repo-root>
- Completed phase: <P#>, feature <F-### - name>
- Next phase under review: <P#>, feature <F-### - name>
- Output folder: .devnotes/<completed-phase>-post-impl-REVIEW/
- Relevant reference folders/files: <references or "none">

Read in this order before writing:
1. AGENTS.md
2. README.md
3. specs/00-governance/constitution.md
4. CONTEXT.md
5. DESIGN.md only if frontend is in scope
6. completed feature folder
7. next feature folder
8. every API, SSE, data, AI, architecture, product, and quality spec referenced by either feature
9. feature register and traceability files
10. existing implementation and tests for the completed phase
11. relevant .references evidence

Task:
Reverse-engineer the completed phase state, then prepare the next phase implementation gate. Create a document package with the same structure and terse reviewer voice as .devnotes/P2-post-impl-REVIEW/.

Output files:
1. F-###-P#-readiness.md
2. ID-A.md
3. ID-A-<topic>.md files for each major decision in ID-A
4. ID-A-<topic>-FOLLOWUP.md only for resolved follow-up questions

Hard rules:
- Active specs are intended behavior.
- .references are evidence only.
- Do not invent product behavior.
- Do not silently change contracts.
- If public API/SSE/data/AI shape is missing, mark it as a blocker and propose a contract patch target.
- Browser must remain thin; never propose browser access to private services, storage, providers, LightRAG, runtime URLs, or secrets.
- Do not expose private fields, paths, URLs, raw payloads, prompts, source text, stack traces, or secrets in examples.
- Keep implementation advice scoped to the next vertical slice.

F-###-P#-readiness.md structure:
- Title: "# F-### / P# - <feature name>"
- Goal and "Not in P#"
- Big picture ASCII architecture diagram
- What the core product term means here
- End-to-end build order from tasks.md
- Lifecycle / user / system flows
- Layer ownership table
- Dependency gate from previous phases
- Questions MUST answer before coding
  - A. Contract/data/API blockers
  - B. Runtime/controller/private integration blockers, if relevant
  - C. Worker/concurrency/idempotency blockers
  - D. Delete/redaction/destructive-state blockers, if relevant
  - E. Storage/private data blockers, if relevant
  - F. Authz/roles blockers
  - G. Test/evidence blockers
- Acceptance criteria as definition of done
- What junior dev should read, in order
- Practical start checklist
- One-line summary
- Reference comparison, if references exist:
  - Master table: question, reference answer, greenfield delta
  - What old/reference code answers well
  - What old/reference code does not answer
  - Architecture comparison
  - Verdict for junior dev

ID-A.md structure:
- Title: "# ID-A - <decision cluster> (<phase blockers>)"
- One-sentence purpose and canonical patch targets
- Sources grilled
- Related docs table
- Lean winner
- Rejected alternatives table
- Grill tree - decisions resolved
- A1, A2, A3... detailed recommended contract/data/API patches
- Single-source functions or state formulas
- Entity/data diagram
- Junior dev - do this order
- Red flags in PR
- Tests to write
- Still needs ID-B / fixture / ADR, if any
- Next grill session

Focused ID-A-<topic>.md structure:
- Title: "# ID-A - <topic> (junior dev explainer)"
- Parent links
- Question
- Decision
- Why / bad-vs-good table
- Exact contract or implementation sketch
- Implementation order
- Red flags in PR
- Tests
- One-line summary

FOLLOWUP structure:
- Title: "# ID-A - <topic> follow-ups (resolved)" or "## Terse EXPLAIN"
- Parent link
- Q/A blocks or terse explain bullets
- No new unreviewed behavior
- Link back to full explainer

Quality bar:
- Every claim is sourced to a spec, contract, implementation file, test, or reference.
- Every blocker has an owner document and next action.
- Every proposed contract change names the target spec file.
- Every implementation instruction has a test/evidence counterpart.
- No package file exceeds usefulness with filler prose.

After writing, run a lightweight QA:
- List created files.
- Scan for forbidden strings/examples: secret, token value, runtime URL, host path, stack trace, raw source text.
- Confirm parent doc links resolve.
- Confirm each focused memo has Decision, Tests, Red flags, and One-line summary.
```

---

## Prompt 2 - Main Phase Review Only

Use this when `F-###-P#-readiness.md` is missing or weak.

```text
Write .devnotes/<completed-phase>-post-impl-REVIEW/F-###-P#-readiness.md in the terse senior reviewer style of .devnotes/P2-post-impl-REVIEW/F-003-P3-readiness.md.

Read:
- AGENTS.md, README.md, constitution, CONTEXT.md
- completed feature folder and next feature folder
- all contracts named by both features
- relevant architecture/product/quality specs
- implementation and tests from completed phase
- relevant .references evidence

The review is for junior dev implementation of <next phase/feature>, after <completed phase/feature> was implemented.

Include:
- Goal and "Not in P#"
- Big picture diagram
- core product concept definition
- task/build order from next feature tasks.md
- lifecycle/system flows
- layer ownership
- dependency gate from completed phase
- questions MUST answer before coding, grouped A-G
- acceptance criteria as definition of done
- junior-dev reading order
- practical start checklist
- one-line summary
- reference comparison table if old/reference code exists

Rules:
- Do not invent missing behavior. Mark gaps as blockers.
- Do not suggest code before contract/data/API shapes are captured.
- Contrast old/reference behavior against greenfield target.
- Use exact route/table/field names.
- Keep it terse, instructional, and safe.
```

---

## Prompt 3 - Parent Decision Memo ID-A

Use this to produce the architect decision hub.

```text
Write .devnotes/<completed-phase>-post-impl-REVIEW/ID-A.md as the parent decision memo for the largest next-phase blocker cluster: <cluster name>.

Audience: junior dev implementing the next vertical slice. Voice: senior architect/reviewer, terse and concrete.

Read the main phase review, next feature spec/plan/tasks/test-plan/acceptance, API/data/SSE/AI contracts, relevant quality specs, and implementation files.

Structure:
- "# ID-A - <cluster> (<phase blockers>)"
- Working-doc purpose and canonical patch targets
- Sources grilled
- Related docs table for all focused ID-A memos
- Lean winner
- Rejected alternatives with reasons
- Grill tree - decisions resolved
- A1..An recommended contract/data/API patches
- Single-source formulas or helper functions
- Entity/data diagram
- Junior dev - do this order
- Red flags in PR
- Tests to write
- Still needs ID-B / fixture / ADR
- Next grill session

Decision standard:
- Prefer typed tables, closed enums, versioned DTOs, and single-owner services.
- Reject generic JSON, generic job/workflow systems, duplicate truth, browser-private-service access, and public leakage of private runtime/storage/provider details unless an approved spec requires them.
- If a decision would change a public contract, state the target spec patch before implementation.
```

---

## Prompt 4 - Focused Junior Explainer

Use once per major ID-A decision.

```text
Write .devnotes/<completed-phase>-post-impl-REVIEW/ID-A-<topic-slug>.md.

Topic: <one decision question>
Parent: ID-A.md
Related docs: <links>

Audience: junior dev. Voice: terse senior reviewer.

Required structure:
- "# ID-A - <topic> (junior dev explainer)"
- Parent links
- "**Question:** <the question this memo answers>"
- "### Decision"
- "### Why" with a bad-vs-good table where useful
- exact route/table/field/flow sketch
- "### What you implement (order)" or "### Implement order"
- "### Red flags in PR"
- "### Tests"
- "### One-line summary"

Rules:
- Answer one question only.
- Use exact names from active specs.
- Include at least one concrete test.
- Include at least three PR red flags when the risk is implementation drift.
- If reference code differs, include a short "vs old/reference" section.
- Do not introduce new behavior not present in ID-A or active specs; mark unknowns as open decisions.
```

---

## Prompt 5 - Follow-Up Resolver

Use when the reviewer or junior dev asks a clarifying question after an explainer.

```text
Write .devnotes/<completed-phase>-post-impl-REVIEW/ID-A-<topic-slug>-FOLLOWUP.md.

Parent explainer: <file>
Questions to resolve:
- <question 1>
- <question 2>

Voice: terse reviewer. No long essay.

Structure options:
1. Q/A:
   - "# ID-A - <topic> follow-ups (resolved)"
   - Parent link
   - "## Q: <question>"
   - concise answer
2. Terse explain:
   - "## Terse EXPLAIN"
   - bold concept bullets
   - one small ASCII/code block if it clarifies the fence/flow

Rules:
- Only resolve questions already answered by specs, ID-A, or implementation.
- If a question is not decided, say "Open decision" and name the owner document.
- Link back to the full explainer.
- Do not expand scope.
```

---

## Prompt 6 - Package QA / Normalizer

Use after the package exists.

```text
Review .devnotes/<completed-phase>-post-impl-REVIEW/ for structural parity with .devnotes/P2-post-impl-REVIEW/.

Check:
- One broad F-###-P#-readiness.md exists.
- One parent ID-A.md exists.
- ID-A.md has a related-docs table linking focused memos.
- Each focused memo answers one question.
- Each focused memo has Decision, implementation order, Red flags in PR, Tests, and One-line summary.
- Follow-up files contain only resolved Q/A or terse explain material.
- No doc treats .references as source of truth.
- No doc invents product behavior where specs are silent.
- No doc exposes secrets, paths, runtime URLs, raw payloads, prompts, source text, stack traces, provider payloads, or raw LightRAG hits.
- Every blocker names a target spec/contract/ADR/fixture.
- Every acceptance criterion maps to a proposed test or evidence item.
- Links resolve.

Output:
- Findings first, ordered by severity.
- Then a short change list for edits you made.
- If editing, keep changes advisory under .devnotes only unless explicitly asked to patch specs.
```

---

## Quick Fill-In Template

Use this as the smallest reusable request.

```text
After implementing <completed phase/feature>, create a post-implementation review package for <next phase/feature> under .devnotes/<completed-phase>-post-impl-REVIEW/.

Match the structure and terse senior-reviewer-for-junior-dev style of .devnotes/P2-post-impl-REVIEW/.

Read AGENTS.md, README.md, constitution, CONTEXT.md, the completed and next feature folders, all referenced contracts/specs, implementation/tests, traceability, and relevant .references evidence.

Produce:
- F-###-P#-readiness.md
- ID-A.md
- focused ID-A-<topic>.md explainers
- follow-up files only when needed

Do not invent behavior. Mark missing contracts as blockers. Keep reference code as evidence only. Include implementation order, red flags, tests, and one-line summaries.
```
