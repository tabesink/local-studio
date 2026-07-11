# ID-A - audit events (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/05-quality/observability.md`, `specs/05-quality/security-and-privacy.md`, `specs/01-product/roles-and-permissions.md`, `specs/04-features/F-008-observability-pilot-gate/`.

**Question:** Can P8 start by adding an `audit_events` table and filling in fields from code?

## Decision

No. Server owns this, but the table, enum, metadata allowlist, read DTO, and failure behavior must be contract-patched first.

`audit_events` is audit truth. JSON logs and Langfuse traces are not.

## Why

| Bad path | Good path |
| --- | --- |
| Add a flexible event table and figure out fields while instrumenting routes. | Patch DATA-001 with a closed schema and event enum first. |
| Store raw request body, usernames, titles, prompts, questions, answers, source text, or provider details as metadata. | Store strict safe metadata only. |
| Treat log lines as accountability. | Write immutable `audit_events` rows for admin/security actions. |
| Add edit/delete/export routes for audit data. | P8 has admin read only. |

## Contract Sketch

This is a patch target, not an approved schema:

| Field group | Needs contract decision |
| --- | --- |
| identity | `id`, `eventName`, `createdAt` |
| actor | `actorKind`, optional safe actor id |
| target | `targetKind`, optional safe target id |
| request | `requestId`, optional `traceId`, route/action |
| outcome | success/failure, `safeErrorCode` where applicable |
| metadata | allowlisted keys only, bounded values |

Event names should be closed. Start from actions already owned by P1-P7:

```text
auth.login.failed
admin.runtime_settings.updated
admin.domain.created
admin.domain.started
admin.domain.stopped
admin.domain.delete_queued
admin.source.uploaded
admin.source.deleted
admin.source.index_retry_queued
admin.source.index_cancelled
chat.turn.completed
chat.turn.redacted
admin.audit_events.read
admin.diagnostics.read
```

Do not copy this list into code until F-008/DATA-001 approve exact names.

## Implement Order

1. Patch DATA-001 with the table fields, enum, safe metadata rule, immutability rule, and indexes.
2. Patch API-001 with `GET /admin/audit-events` DTO, filters, pagination, and error codes.
3. Add migration/model test.
4. Implement `AuditService.record(...)` as the only writer.
5. Instrument admin/security state transitions after service decisions are already safe.
6. Add admin read route.
7. Add safe DTO snapshots and OpenAPI snapshot.

## Red Flags In PR

- `metadata` is unbounded or accepts arbitrary nested data.
- Event names are free-form strings from route code.
- Audit rows include prompt, question, answer, source text, raw evidence, provider payload, path, runtime URL, or raw exception text.
- AuditService writes are skipped for delete/redaction/security events without an explicit test-plan reason.
- There is an update/delete route for audit rows.
- Members can read audit events.

## Tests

- Fresh migration creates `audit_events` with approved columns and constraints.
- AuditService rejects unknown event names and unsafe metadata keys.
- Admin action writes exactly one expected audit row.
- Member/public cannot read audit route.
- `GET /admin/audit-events` returns safe fields only and is bounded.
- Safety snapshot proves no forbidden content appears in audit DTOs.

## One-line summary

Audit is a contracted immutable product record; do not let route-local logging decisions become audit schema.
