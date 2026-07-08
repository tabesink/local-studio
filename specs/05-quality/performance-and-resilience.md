---
id: QA-004
title: Performance And Resilience
status: approved
owner: Context Engine operations team
last_reviewed: 2026-07-06
depends_on: [ARCH-005]
supersedes: []
---

# Performance And Resilience

## Pilot Target

The only approved scale target is a 5-10 user internal pilot until P8 produces benchmark evidence on target infrastructure, provider quotas, and representative data.

## Expected-Load Gate

P8 must prove an expected-load scenario for 10 concurrent authenticated users using deterministic fakes where provider/runtime quotas would make the test flaky. The scenario should mix conversation creation, direct turns, and domain evidence/chat where fixtures allow.

Pass criteria:

- no request returns an unsafe 5xx;
- P7 idempotency and replay behavior do not regress;
- every completed request stays within the approved turn timeout budget or records a target-limit note;
- logs contain safe metadata only, with request/operation correlation and chat trace correlation where applicable.

If target infrastructure or provider quotas are required for final confidence, record a pilot-like runbook evidence item in addition to deterministic tests.

## Resilience Rules

| Failure | Behavior |
| --- | --- |
| DB unavailable | safe health/readiness failure; no partial success claim |
| worker crash | lease timeout transitions to safe failed/cancelled state per phase |
| parser/provider timeout | safe operation/turn error code; no raw payload |
| LightRAG timeout | reconcile by idempotency/readiness contract; no duplicate content |
| delete partial failure | resource remains fenced/deleting and repeat action resumes |
| Langfuse outage | ignored; core behavior continues |
| SSE disconnect | provider stream aborted; turn settled safely |
