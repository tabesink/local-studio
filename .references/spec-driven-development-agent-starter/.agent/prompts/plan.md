# Agent Prompt — Plan

Produce an implementation plan for an approved feature specification. Do not code.

1. Read `AGENTS.md`, feature `spec.md`, touched contracts, architecture, and quality requirements.
2. Use `plan.md`, `tasks.md`, and `test-plan.md` templates.
3. Propose the smallest complete design. Prefer explicit changes over new abstractions.
4. Identify each touched UI/API/service/data/job/AI boundary.
5. State contract compatibility, schema migration, authorization, observability, failure/recovery, and release/rollback implications.
6. Create ordered tasks; each must cite specs/contracts and verification.
7. Map every acceptance criterion to test evidence.
8. Stop at open decisions that would make behaviour, data loss, authorization, or contract compatibility unsafe.

Finish with:

```text
Feature:
Plan summary:
Contracts/migrations:
Verification coverage:
Risks:
Open decisions:
Implementation is blocked by:
```
