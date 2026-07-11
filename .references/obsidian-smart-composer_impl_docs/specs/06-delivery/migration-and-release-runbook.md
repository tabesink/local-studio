---
id: DEL-001
title: Migration and release runbook
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Migration and release runbook

## Before deployment

- Confirm active feature acceptance evidence.
- Review approved contract and OpenAPI changes.
- Back up database; test restore path for migrations that persist conversations/templates.
- Run lint, type checks, frontend tests, backend tests, migration fresh-upgrade test, and selected load smoke.
- Verify no source secrets or copied `constants.ts` credential values exist in target repository/history.

## During deployment

1. Deploy backwards-compatible backend contract/data migration.
2. Confirm health/readiness and direct authorization tests.
3. Deploy Next.js feature.
4. Verify member chat and admin source status path.
5. Watch safe stream/error/latency metrics.

## Rollback

- Roll back UI independently when possible.
- Prefer forward-only database fixes; do not automatically downgrade destructive migrations.
- Cancel/fail in-flight turns safely before changes that affect streaming contracts.
- Preserve source/document and conversation evidence needed for recovery/redaction policy.
