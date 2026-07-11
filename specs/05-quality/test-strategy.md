---
id: QA-001
title: Test Strategy
status: approved
owner: Context Engine engineering team
last_reviewed: 2026-06-30
depends_on: [GOV-001]
supersedes: []
---

# Test Strategy

## Required Layers

| Layer | Scope |
| --- | --- |
| Unit | pure policy, validators, state maps, parser normalization, `CE_BLOCK` parsing, DTO mappers |
| Integration | FastAPI routes, Postgres repositories, Alembic fresh upgrade, worker lease/retry/cancel/delete, controller boundary fakes |
| Contract | OpenAPI snapshots, error envelope, safe DTO snapshots, SSE transcript fixtures |
| E2E | auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact proof |
| Frontend | Playwright auth/routing/admin/member/SSE flows plus visual screenshots |
| Security | storage scan, secret redaction, browser storage, 401/403, unsafe redirect |
| Load | P8 expected-load test for 5-10 internal concurrent users |

## Done Rule

A feature may not be marked complete until its `acceptance.md` references the actual commands, snapshots, screenshots, logs, or manual review evidence required by `test-plan.md`.
