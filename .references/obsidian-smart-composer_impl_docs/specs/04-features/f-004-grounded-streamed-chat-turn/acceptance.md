---
id: F-004-ACC
title: Grounded Streamed Chat Turn acceptance
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---
# Acceptance criteria

- Only the API produces answer content/evidence.
- Stop works without a leaked pending UI state.
- A member cannot send to a forbidden domain through edited browser requests.
- No provider key or direct LLM library enters `webui`.

## Completion evidence

| Check | Result | Evidence link / command | Notes |
|---|---|---|---|
| Feature tests | pending | | |
| API/integration tests | pending | | |
| Authorization test | pending | | |
| Security review | pending | | |
| UI state review | pending | | |
| Source-reference review | pending | | |

A feature is not `implemented` until each required check has recorded evidence or an approved deviation.
