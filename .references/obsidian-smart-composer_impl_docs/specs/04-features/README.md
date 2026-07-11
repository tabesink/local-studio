---
id: FEAT-000
title: Feature folder rules
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Feature folder rules

Each folder is one vertical delivery slice. Read in this order:

1. `spec.md`
2. `plan.md`
3. `tasks.md`
4. referenced contracts
5. `test-plan.md`
6. `acceptance.md`
7. `implementation-log.md`

A slice cannot silently absorb another slice’s scope. Source references are aids to understanding, not approval to port source runtime behaviour.
