# Agent Operating Contract

This repository uses spec-driven development for a fullstack Context Engine rebuild. Treat the active specifications as intended behavior.

## Required Reading Order

Before editing code, read:

1. `specs/00-governance/constitution.md`
2. `CONTEXT.md`
3. `DESIGN.md` for frontend work
4. The relevant folder in `specs/04-features/`
5. Every API, SSE, data, or AI contract referenced by that feature
6. Relevant architecture and quality specs
7. Existing implementation and tests

Reference files under `.references/` are evidence only. Use `README.md` for source-of-truth precedence.

## Non-Negotiable Rules

1. No invented product behavior. Missing behavior is an open decision.
2. No silent contract drift. Change API, SSE, data, or AI behavior only after updating its contract.
3. One vertical slice at a time. Keep changes scoped to the requested feature and its documented dependencies.
4. Backend owns auth, secrets, lifecycle, retrieval, evidence, chat, audit, and destructive state transitions.
5. Browser code never talks to LightRAG, Docker, storage paths, database, provider APIs, controller, runtime URLs, or Langfuse directly.
6. No browser token persistence. Use opaque HttpOnly cookie sessions.
7. No secret, raw prompt, raw answer, raw source text, raw LightRAG hit, runtime URL, path, stack trace, or provider payload in API responses, logs, traces, fixtures, screenshots, or specs.
8. Local Studio visual parity governs frontend styling. Do not create a generic white dashboard or broad shadcn redesign.
9. Tests prove behavior. Each acceptance criterion needs automated or explicit manual evidence.
10. Docs and code move together. Update feature evidence, contracts, acceptance, implementation logs, and traceability in the same change when practical.

## Required Workflow

### 1. Discover

Report applicable feature IDs, contracts, current implementation state, contradictions, and proposed scope.

### 2. Specify

Create or improve `specs/04-features/F-###-short-name/spec.md` before implementation when behavior is new, changed, or unclear.

### 3. Plan

Update `plan.md`. State affected boundaries, contracts, data changes, migrations, risks, tests, deployment, and rollback concerns.

### 4. Tasks

Update `tasks.md`. Each task must be small, ordered, and independently verifiable.

### 5. Implement

Implement approved tasks only. Keep material deviations in `implementation-log.md`.

### 6. Verify

Run the checks named in `test-plan.md`. Update `acceptance.md`, `implementation-log.md`, and `specs/07-traceability/feature-register.md`.

### 7. Converge

Compare code, tests, contracts, and feature specs. Correct drift or create a follow-up task before claiming completion.

## Stop Conditions

Stop implementation and request a decision when:

- a requirement conflicts with a higher-authority document;
- a public contract needs a breaking change without a version/migration policy;
- data loss, privilege escalation, secret exposure, unsafe prompt/source disclosure, or irreversible migration is possible;
- P5 LightRAG proof fails for `CE_BLOCK`, idempotent submit, readiness, deletion, or typed secret injection;
- frontend wiring needs a field shape not captured in OpenAPI/runtime fixtures;
- source navigation is requested before an opaque source-ref contract exists;
- a required acceptance criterion cannot be tested or observed.

## Required Response Format For Coding Agents

```text
Feature: F-### - <name>
Scope: <what changed / did not change>
Specifications read: <paths>
Contracts affected: <paths or none>
Implementation: <files/modules changed>
Verification: <commands/checks and outcome>
Evidence updated: <paths>
Open decisions / known limits: <items or none>
```

## Definition Of Done

A feature is complete only when required acceptance criteria pass, contracts and migrations are updated, tests provide evidence, logging/audit requirements are addressed, visual checks pass for frontend slices, remaining limits are explicit, and traceability is updated.
