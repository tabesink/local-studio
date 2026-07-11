---
id: Q-PERF-001
title: Performance and resilience
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Performance and resilience

## Pilot assumption

Initial target: 5–10 concurrent users. It is a target to validate, not proof of capacity.

## Required tests

- Smoke: session, domain list, one chat stream, source status.
- Baseline: ordinary member read/query and admin status mix.
- Expected load: concurrent grounded streams plus one or two source operations.
- Stress: increase until app/provider/runtime/DB limit emerges.
- Dependency failure: provider timeout/rate limit, worker unavailable, database loss, source deletion during turn.
- Soak: only after baseline stability; inspect memory, connections, queue age, container restarts.

## Initial acceptance calibration

Do not put numeric latency/error thresholds in a release gate until hardware, model, provider quota, document size, and domain count are measured. Record p50/p95/p99, error rate, DB pools, worker queue age, runtime memory, and provider failures.
