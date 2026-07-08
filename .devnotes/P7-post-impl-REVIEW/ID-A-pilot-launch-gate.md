# ID-A - pilot launch gate (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-008-observability-pilot-gate/test-plan.md`, `specs/04-features/F-008-observability-pilot-gate/acceptance.md`, `specs/06-delivery/release-and-rollbacks.md`, `specs/06-delivery/runbooks/pilot-launch.md`, `specs/05-quality/test-strategy.md`, `specs/05-quality/performance-and-resilience.md`.

**Question:** Can P8 be marked implemented once audit/log/tracing unit tests pass?

## Decision

No. P8 is the pilot gate. Unit tests are necessary, but not enough.

The feature is complete only when each F-008 acceptance criterion has real evidence or an explicit blocked owner.

## Why

| Bad path | Good path |
| --- | --- |
| Mark acceptance rows implemented from planned checks. | Record exact commands, snapshots, fixtures, runbook evidence, or blocked owner. |
| Run backend tests only. | Run compose, SSE, full pilot flow, expected load, and failure injection. |
| Claim broad production readiness. | Claim only the 5-10 user internal pilot target proven by QA-004. |
| Ignore existing tool gaps. | Document missing lint/type tools and either install/approve them or mark blocked. |

## Required Evidence Map

| F-008 AC | Evidence target |
| --- | --- |
| AC-001 | format/lint/type command output; if tool missing, blocker with owner |
| AC-002 | unit/integration/migration/OpenAPI tests |
| AC-003 | secret scan output and safe fixture/doc scan |
| AC-004 | compose smoke result |
| AC-005 | SSE end-to-end transcript/regression |
| AC-006 | full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact proof |
| AC-007 | 5-10 concurrent user expected-load test |
| AC-008 | provider timeout, worker unavailable, DB unavailable, invalid upload tests |

RUN-001 also mentions P9 visual checks before pilot. If P9 is not implemented, record that as a launch dependency, not as a P8 backend completion claim.

## Implement Order

1. Patch F-008 test-plan with exact commands and evidence artifact locations.
2. Identify which checks require local-only fakes and which require pilot-like compose/runtime dependencies.
3. Add scripts or test helpers only where they reduce repeated manual work.
4. Run unit/integration/migration/OpenAPI tests.
5. Run P7 SSE regression with P8 hooks enabled.
6. Run compose smoke.
7. Run full pilot flow.
8. Run expected-load test for 5-10 users.
9. Run failure injection tests.
10. Update acceptance, implementation log, feature register, and traceability with exact evidence.

## Red Flags In PR

- `acceptance.md` says implemented while evidence cells still say pending.
- Full flow omits delete/redaction.
- Expected-load test has no target, no concurrency count, or no pass/fail rule.
- Failure injection tests use raw provider/runtime error text in fixtures.
- Compose smoke is skipped without a blocked owner.
- Known limitations are not added to `implementation-log.md`.
- P8 test changes alter P7 API/SSE contracts without updating API-001/EVT-001.

## Tests

- Fresh migration from empty.
- OpenAPI snapshot for audit/diagnostics routes.
- P7 SSE end-to-end after log/trace context.
- Audit/log/tracing safety snapshots.
- Secret scan over specs, fixtures, screenshots, logs, and generated docs.
- Compose smoke.
- Full pilot flow.
- 5-10 concurrent expected-load test.
- Provider timeout, worker unavailable, DB unavailable, invalid upload.

## One-line summary

P8 is done when the launch gate has evidence, not when observability code merely exists.
