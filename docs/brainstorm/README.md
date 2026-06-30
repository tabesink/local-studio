# Developer Documentation Index

This directory is the live operating manual for Context Engine. It is written for coding agents and junior developers who need to understand the system before editing it.

Read in this order:

1. `AGENTS.md` at the repository root for working rules.
2. `README.md` at the repository root for project status and entry points.
3. `CONTEXT.md` at the repository root for shared product vocabulary.
4. `docs/backend/p0-shared-contract.md` for canonical cross-phase product and safety rules.
5. `docs/master-build-plan.md` for phase order, task IDs, status, dependencies, and gates.
6. `docs/architecture.md` for system shape, ownership, routes, and boundaries.
7. `docs/implementation.md` for current implemented scope, backlog, and definition of done.
8. `docs/test-strategy.md` before writing or changing behavior.
9. `docs/deployment.md` before adding services, env vars, migrations, or storage paths.
10. `docs/DATABASE_OWNERSHIP.md` before changing schema or persistence semantics.
11. `docs/decisions/log.md` and `docs/adr/` before changing durable architecture choices.

The backend phase plans in `docs/backend/` are source material. The docs at this level are the durable map that agents should keep updated as implementation progresses.

## Documentation Ownership

Update the docs in the same change when you modify:

- public API behavior, routes, request or response shapes;
- persistent state, schema, migrations, or ownership rules;
- setup, run, test, deployment, or backup commands;
- architecture boundaries, cross-cutting middleware, auth, authorization, logging, or tracing;
- phase/task status, acceptance criteria, or handoff notes.

Do not edit reference material in `.references/` or `docs/brainstorm/**/reference*/` unless the user explicitly asks for reference changes.

## Current Repo State

This repository is at bootstrap/documentation stage. There is no runtime application code yet. The planned backend implementation is documented in phases `P0` through `P8`.

## Agent Workflow

For a small local fix, read the closest docs and validate with focused checks.

For non-trivial behavior, API, persistence, auth, security, infrastructure, or cross-layer work:

1. Find or create the task in `docs/master-build-plan.md`.
2. Mark it `IN PROGRESS`.
3. Create or update `docs/tasks/{task-id}.md`.
4. Follow the relevant phase plan and `docs/brainstorm/context-engine-backend/IMPLEMENTATION_MAP.md`.
5. Implement in thin vertical slices.
6. Run the narrowest meaningful validation.
7. Mark the task `DONE (YYYY-MM-DD)` only after behavior, tests, docs, and handoff notes are complete.
