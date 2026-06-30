---
id: QUAL-004
title: Performance and Resilience
status: draft
owner: <engineering/operations owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [ARCH-005]
supersedes: []
---

# Performance and Resilience

## Budgets

| Flow | Load / concurrency | Latency target | Error target | Resource/cost budget | Measurement |
| --- | --- | --- | --- | --- | --- |
| `<flow>` | `<load>` | `<target>` | `<target>` | `<budget>` | `<test/dashboard>` |

## Failure policy

| Dependency/failure | Classification | User/system behaviour | Retry/backoff | Timeout | Recovery owner |
| --- | --- | --- | --- | --- | --- |
| `<failure>` | `<transient/permanent>` | `<behaviour>` | `<policy>` | `<value>` | `<owner>` |

## Graceful degradation

State what may degrade, what must fail closed, and what never may be silently dropped.

## Capacity review

Specify triggers that require a capacity review: `<user threshold, backlog length, cost threshold, latency trend>`.
