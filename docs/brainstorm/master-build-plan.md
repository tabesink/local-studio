# Master Build Plan

This is the project task tracker. It is the first place a coding agent should check before starting tracked work.

Status values:

- `CANONICAL`: architecture/product contract source already accepted as project guidance.
- `PLANNED`: not implemented yet.
- `IN PROGRESS`: a coding agent is actively working the task.
- `BLOCKED`: cannot proceed without a named gate.
- `DONE (YYYY-MM-DD)`: implemented, validated, and documented.

## Phase Tracker

| ID | Phase | Status | Depends On | Gate / Notes |
|---|---|---:|---|---|
| P0 | Shared contract | CANONICAL | None | Cross-phase rules in `docs/backend/p0-shared-contract.md` win when phase plans disagree. |
| P1 | Trusted application foundation | PLANNED | P0 | FastAPI, Postgres, migrations, opaque HttpOnly sessions, admin/member authz, typed errors. |
| P2 | Trusted runtime config | PLANNED | P1 | Encrypted provider credentials, model profiles, active synthesis profile, parser selection, private resolver. |
| P3 | Domain lifecycle and private runtimes | PLANNED | P1, P2 | Private controller boundary, three domain states, async hard delete, no provider calls. |
| P4 | Source upload and canonical preparation | PLANNED | P1, P2, P3 | Immutable originals, parser-neutral prepared blocks/images, one worker, no LightRAG calls. |
| P5 | LightRAG indexing and eligibility | PLANNED | P1-P4 | Pinned LightRAG contract fixture, runtime secret injection, deterministic handoff, native ready required. |
| P6 | Evidence retrieval and source navigation | PLANNED | P1, P3-P5 | Exact `CE_BLOCK` provenance must survive retrieval. No fuzzy mapping or fallback retrieval. |
| P7 | Routed streaming chat | PLANNED | P1-P6 | One turn executor, direct vs grounded route, frozen synthesis profile, grounded-only redaction. |
| P8 | Observability | PLANNED | P1, P7 | Metadata-only tracing. Failure isolated. No prompts, answers, questions, source text, refs, secrets, or raw payloads. |
| DOCS-001 | Agent and junior developer docs | DONE (2026-06-30) | P0-P8 plans | Created canonical docs spine, PRD workspace, issue batons, decision log, ADR seed, and task note. |

## Required Build Order

1. P1 must land before any runtime config, domain, source, retrieval, or chat work.
2. P2 must land before P3 creates domains because domains reference immutable embedding profiles.
3. P3 must land before P4 because source storage is domain-instance scoped.
4. P4 must land before P5 because LightRAG indexing consumes stable source block IDs.
5. P5 must land before P6 because evidence retrieval depends on native ready state and eligibility.
6. P6 must land before P7 because chat must reuse exact mapped evidence, not raw LightRAG hits.
7. P8 must follow P7 because it observes turn lifecycle and must not alter request-path behavior.

## Hard Gates

- No P4 until P2 embedding-profile immutability and parser-kind rules exist.
- No P5 business code until a pinned LightRAG fixture proves submit, idempotency, readiness, delete, stable identity, and runtime secret injection.
- No P6 implementation until a pinned LightRAG fixture proves exact block markers survive retrieval.
- No P7 chat synthesis that bypasses P6 mapped evidence for grounded answers.
- No production migration without backup and restore proof.

## Work Intake Rules

Use one phase/task ID per logical change. Keep each slice independently testable. If a task crosses API, persistence, auth, UI workflow, security, or infrastructure boundaries, create or update a task note in `docs/tasks/`.

When a task starts, change its tracker row to `IN PROGRESS`. When it is complete, use `DONE (YYYY-MM-DD)` and summarize the validation in the task note.

## Current Next Task

Recommended next task: `P1-FOUNDATION`. Build the trusted empty backend with auth, sessions, role gates, request IDs, typed errors, Postgres migration `0001`, and focused tests.

