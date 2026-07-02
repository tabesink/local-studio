---
id: F-008
title: Admin Document Readiness and Operations Surface
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: [F-001, F-002]
supersedes: []
---
# Admin Document Readiness and Operations Surface

## User outcome

Admins can see document readiness and act through existing Context Engine ingestion/lifecycle contracts while members continue querying.

## In scope

- Admin-only source list/status surface.
- Upload/retry/delete entry points only where approved API already exists.
- Operation/job status and safe errors.
- Query eligibility display.

## Explicitly out of scope

- No port of vault-index commands.
- No browser worker controller, provider secret editor, parser execution, direct runtime calls, or generic operations engine.

## Routes affected

- `/settings/sources` or approved admin route.

## API contracts consumed

- `API-DOC-001`; existing Context Engine lifecycle/ingest contracts take precedence.

## Data models

- `AdminSourceRow`, `OperationSummary`.

## Authorization behaviour

FastAPI requires admin on every action; direct navigation must return 403 to members.

## UI states

- Loading: table and operation polling.
- Empty: no sources.
- Error: safe operation/source error.
- Unauthenticated: redirect.
- Forbidden: 403.
- Success: current status/readiness.

## Original source references

- `src/main.ts` vault-index command progress
- `src/components/chat-view/QueryProgress.tsx`

## Source-to-target rule

Reference the listed source scripts for interaction patterns only. Do not import them or copy host-bound runtime behaviour into the target.
