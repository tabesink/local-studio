---
id: QA-004
title: Performance And Resilience
status: approved
owner: Context Engine operations team
last_reviewed: 2026-06-30
depends_on: [ARCH-005]
supersedes: []
---

# Performance And Resilience

## Pilot Target

The only approved scale target is a 5-10 user internal pilot until P8 produces benchmark evidence on target infrastructure, provider quotas, and representative data.

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
