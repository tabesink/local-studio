# ID-A - safe logging context (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/05-quality/observability.md`, `specs/05-quality/security-and-privacy.md`, `specs/02-architecture/component-boundaries.md`, `specs/04-features/F-008-observability-pilot-gate/test-plan.md`.

**Question:** Can P8 satisfy structured logs by adding logger calls wherever errors happen?

## Decision

No. Add one safe request/log context helper and make logs boring, typed, and snapshot-tested.

QA-003 already names the allowed log fields. Use those fields. Do not add route-local raw dictionaries that drift.

## Why

| Bad path | Good path |
| --- | --- |
| Every route logs its own shape. | One helper emits one approved JSON shape. |
| Production logs raw exception strings. | Logs use safe error code and exception type policy. |
| Worker/SSE logs lose request context. | Context is propagated intentionally. |
| Logs include names, filenames, questions, answer text, or source excerpts. | Logs use safe ids, counts, statuses, elapsed time, and outcomes. |

## Exact Safe Field Set

QA-003 allows:

```text
timestamp
level
logger
event
request_id
trace_id
actor_kind
domain_id
source_id
conversation_turn_id
operation_id
safe_error_code
elapsed_ms
http_method
http_route
http_status
outcome
```

If a new field seems useful, patch QA-003 first.

## Implement Order

1. Patch QA-003 with event naming and production exception policy.
2. Add request id and optional trace id context at FastAPI middleware/composition root.
3. Add a `safe_log(...)` helper or equivalent with allowlisted keys.
4. Wire API route start/finish logs through the helper.
5. Wire worker and SSE terminal logs through the same helper.
6. Add tests that serialize records and scan keys/values.
7. Add a regression test that P7 replay does not log a second provider/retrieval call.

## Red Flags In PR

- Raw exception text appears in production log records.
- Any log field contains request body, prompt, question, answer, source text, raw evidence, provider payload, runtime URL, path, or credential value.
- `logger.info({...})` appears directly in route/service code with ad hoc fields.
- Log context is global mutable state that leaks between tests/requests.
- P8 log changes alter P7 SSE payloads or terminal outcomes.

## Tests

- Safe log helper rejects unknown keys.
- API request produces JSON with expected safe keys.
- Safe error path logs `safe_error_code` and no raw exception text.
- Worker/log context includes operation id when available.
- SSE terminal logs include turn id/outcome but no streamed text.
- Snapshot scan proves forbidden key/value classes are absent.

## One-line summary

Structured logging is a small safe API, not a pile of convenient logger calls.
