---
id: Q-TEST-001
title: Test strategy
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Test strategy

## Required proof per slice

1. Unit tests for pure feature state/mapping/parsing.
2. Component tests for loading, empty, error, unauthenticated, forbidden, success, and accessibility behaviour.
3. FastAPI integration tests for authorization and contract rules.
4. Cross-boundary test for a complete browser → API → persisted/streamed response where applicable.
5. Regression test for every discovered defect before it is fixed.

## Source-reference tests

Do not run Smart Composer tests as target acceptance. Use its tests only as behavioural clues. Target tests must prove Context Engine contracts and security boundaries.
