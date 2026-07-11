# ID-A - optional tracing and Langfuse (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/05-quality/observability.md`, `specs/05-quality/security-and-privacy.md`, `specs/05-quality/performance-and-resilience.md`, `specs/04-features/F-008-observability-pilot-gate/spec.md`, `.references/context_engine_fullstack_impl_docs/phase_plan/P8_observability_pilot_gate.md`.

**Question:** Can optional Langfuse tracing be wired directly into chat/retrieval code?

## Decision

No. Optional tracing belongs behind one isolated wrapper. It is disabled by default, metadata-only when enabled, and never audit truth.

Langfuse outage must not block auth, upload, retrieval, chat, SSE, source delete, domain delete, or redaction.

## Why

| Bad path | Good path |
| --- | --- |
| Import Langfuse in route, chat, retrieval, or worker modules. | One tracing module owns the optional dependency. |
| Capture prompt/question/answer/evidence/source text for debugging. | Capture metadata counters/timing only. |
| Let tracing failures fail a user request. | Swallow or safe-log tracing failures. |
| Use traces to reconstruct product state. | Product state stays in Postgres/API-owned tables. |

## Exact Contract Needs

Before implementation, patch QA-003/F-008 with:

| Surface | Decision |
| --- | --- |
| config | disabled default and exact env names |
| module | single import boundary |
| metadata | allowlisted keys and max sizes |
| trace id | generated where, persisted where, returned where if anywhere |
| outage | safe behavior and log event |

Safe metadata candidates:

```text
trace_id
request_id
conversation_turn_id
domain_id
route
stop_reason
plan_step_count
retrieval_operation_count
repair_attempt_count
mapped_evidence_count
discard_count
latency_ms
provider_kind enum
synthesis_profile_id
```

Do not approve content fields by accident.

## Implement Order

1. Patch QA-003 with tracing metadata allowlist and disabled/outage rules.
2. Patch DATA-001 if `trace_id` is stored on `conversation_turns` or `audit_events`.
3. Add `context_engine/observability/tracing.py` or equivalent isolated module.
4. Add no-op tracer as default.
5. Add optional Langfuse adapter behind config.
6. Wire chat/retrieval timing through the wrapper using safe metadata only.
7. Test disabled default, enabled metadata, outage ignored, and import isolation.

## Red Flags In PR

- Langfuse import appears outside the tracing wrapper.
- Traces contain prompt, user question, answer text, source excerpt, raw evidence, raw provider payload, Source Block id, storage path, runtime URL, or stack trace.
- A tracing exception changes API/SSE behavior.
- The browser can enable tracing or select trace fields.
- `trace_id` is exposed publicly without API-001 approval.

## Tests

- Tracing disabled by default emits no external call.
- Enabled tracing sends only allowlisted metadata.
- Simulated tracing outage does not fail the product request.
- Source scan proves external tracing import is isolated.
- P7 chat tests still pass with tracer installed.

## One-line summary

Tracing is optional metadata plumbing; if it can see content or break product behavior, it is already too much.
