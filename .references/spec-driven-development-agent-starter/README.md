# Spec-Driven Development Starter

A lean documentation system for teams where humans and coding agents build the same product.

This scaffold makes **specifications the source of truth** for intended behaviour. Code, tests, pull requests, and release evidence must point back to a documented decision.

## Intended outcome

A coding agent should be able to answer these questions before changing code:

1. What problem and user outcome does this change serve?
2. What behaviour is required, prohibited, or intentionally deferred?
3. Which boundary, contract, data rule, UI flow, or AI policy is affected?
4. How will the team prove the change works?
5. Which documents and tests must change with the code?

If the answer is not documented, the agent must mark it as an **open decision** rather than inventing product behaviour.

## Use this scaffold

1. Read and complete `specs/00-governance/`.
2. Populate product, architecture, contracts, and quality specifications.
3. Create one folder in `specs/04-features/` for each delivery slice.
4. For each feature: write `spec.md` → `plan.md` → `tasks.md` → `test-plan.md` → implementation evidence.
5. Keep `specs/07-traceability/feature-register.md` current.
6. Require agents to follow root `AGENTS.md`.

## Source-of-truth hierarchy

1. `AGENTS.md` — operating rules for human and agent contributors.
2. `specs/00-governance/constitution.md` — non-negotiable engineering and product principles.
3. Approved feature acceptance criteria.
4. Versioned API, event, data, and AI contracts.
5. Architecture and quality specifications.
6. Implementation plans and task lists.
7. Code, tests, operational evidence.

Lower-ranked material may not silently contradict higher-ranked material.

## Minimum viable starting set

Do not fill every template before building. Start with:

- `00-governance/constitution.md`
- `00-governance/glossary.md`
- `01-product/product-brief.md`
- `02-architecture/system-context.md`
- `02-architecture/non-functional-requirements.md`
- `03-contracts/` documents relevant to the first feature
- one `04-features/F-###-short-name/` folder
- `05-quality/test-strategy.md`
- `07-traceability/feature-register.md`

## Naming conventions

| Artifact | Pattern | Example |
| --- | --- | --- |
| Feature | `F-###-short-name` | `F-001-user-authentication` |
| Architecture decision | `ADR-###-short-title.md` | `ADR-001-api-versioning.md` |
| API contract | `<area>-v#.yaml` | `identity-v1.yaml` |
| Event contract | `<event-name>-v#.json` | `document-indexed-v1.json` |
| Data model | `<bounded-context>.md` | `knowledge-domain.md` |
| AI capability | `AI-###-short-name.md` | `AI-001-evidence-grounded-answering.md` |

## Repository shape

See [`FOLDER-STRUCTURE.md`](./FOLDER-STRUCTURE.md) for the full structure and read order.

## Relationship to common SDD workflows

This package is tool-neutral. It maps cleanly to the common workflow:

`constitution → specify → plan → tasks → implement → verify → converge`

It can be used with any coding agent. It also fits Spec Kit-style command workflows without requiring a specific CLI.
