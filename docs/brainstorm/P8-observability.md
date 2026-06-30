# P8 - Observability

Status: PLANNED

## Context Packet

Build metadata-only observability after chat exists. P8 is currently a seed plan and must be expanded before implementation.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p8-observability-plan.md`.

## Previous Slice Provides

P7 provides turn lifecycle, safe outcome codes, answer kind, retrieval counts, citation counts, and never-log constraints.

## This Slice Changes

- define versioned safe structured event schema;
- add trace/metric wrappers around request, retrieval, mapping, synthesis, and stream completion;
- add export-time masking choke point;
- optionally integrate Langfuse or equivalent metadata-only tracer;
- add pilot metrics for latency and safe error rates;
- document retention and access policy.

## This Slice Must Not Rework

- tracing must not block chat/retrieval/upload;
- no raw question, prior question, prompt, answer, catalog text, source text, source refs, raw LightRAG payload, provider secret, runtime URL, storage path, session token, or stack trace;
- no content-based sampling;
- no analytics dashboard that exposes user/source content;
- no P8 dependency in core business rules.

## Next Slice Can Assume

Future post-P8 work can use safe metrics to identify bottlenecks, but not as a source of product truth.

## Acceptance Criteria

- full P8 plan is expanded and accepted before code starts.
- trace export contains only safe metadata.
- exporter failure is swallowed/logged safely and never fails the request.
- masking is tested before any payload leaves Context Engine.
- tests prove never-log fields do not appear in traces/logs.
- deployment docs include tracer env vars, retention, and access policy.

