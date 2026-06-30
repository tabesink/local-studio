# Agent Operating Contract

This repository uses spec-driven development. Treat the active specifications as the intended behaviour of the system.

## Authority and reading order

Before editing code, read:

1. `specs/00-governance/constitution.md`
2. The relevant folder in `specs/04-features/`
3. Every API, event, data, or AI contract referenced by that feature
4. Relevant quality and architecture documents
5. Existing implementation and tests

When sources conflict, use the hierarchy in `README.md`. Do not choose a convenient interpretation silently.

## Non-negotiable rules

1. **No invented product behaviour.** Missing behaviour is an open decision, not an implementation opportunity.
2. **No silent contract drift.** Change API, data, event, or AI behaviour only after updating its contract and compatibility note.
3. **One vertical slice at a time.** Keep changes scoped to the requested feature unless a documented dependency requires more.
4. **Tests prove behaviour.** Add or update tests that map to acceptance criteria and relevant risk.
5. **Docs and code move together.** Update feature evidence, status, and affected contracts in the same change.
6. **Preserve simple design.** Prefer direct control flow, explicit data ownership, and standard platform features. Do not add layers, flags, queues, services, or abstractions without a stated current need.
7. **Name uncertainty.** Record unresolved questions in the feature `spec.md` or `implementation-log.md`. Do not hide uncertainty in code comments.
8. **Protect enterprise constraints.** Treat authorization, privacy, auditability, reliability, and observability as acceptance requirements when the relevant specs say they apply.
9. **Never store secrets in specs, code, fixtures, prompts, or logs.**
10. **No “done” without evidence.** A feature is complete only when its acceptance document lists completed checks and known deviations.

## Required workflow

### 1. Discover

Inspect the existing specifications and code. Report:
- applicable feature and contract IDs
- current implementation state
- contradictions or missing decisions
- exact proposed scope

### 2. Specify

Create or improve `specs/04-features/F-###-short-name/spec.md` before implementation when the requested behaviour is new, changed, or unclear.

### 3. Plan

Create or update `plan.md`. State affected boundaries, contracts, data changes, migrations, risks, tests, and deployment concerns.

### 4. Tasks

Create or update `tasks.md`. Each task must be small, ordered, and independently verifiable.

### 5. Implement

Implement approved tasks only. Keep a running list of material deviations.

### 6. Verify

Run the tests and checks named in `test-plan.md`. Update `acceptance.md`, `implementation-log.md`, and `feature-register.md`.

### 7. Converge

Compare code, tests, contracts, and feature specs. Record drift and create a follow-up task or correct the drift now.

## Required response format for coding agents

When working in this repository, report:

```text
Feature: F-### — <name>
Scope: <what changed / did not change>
Specifications read: <paths>
Contracts affected: <paths or none>
Implementation: <files/modules changed>
Verification: <commands/checks and outcome>
Evidence updated: <paths>
Open decisions / known limits: <items or none>
```

## Stop conditions

Stop implementation and request a decision when:
- a requirement conflicts with a higher-authority document;
- a public contract needs a breaking change without a version/migration policy;
- data loss, privilege escalation, security exposure, or irreversible migration is possible;
- a required acceptance criterion cannot be tested or observed;
- the requested behaviour depends on an undocumented business rule.

## Definition of done

A feature may be marked complete only when:
- required acceptance criteria pass;
- required contracts, migrations, and docs are updated;
- tests provide the promised evidence;
- logging/metrics/audit requirements are addressed;
- remaining limitations are explicit;
- the traceability register is updated.
