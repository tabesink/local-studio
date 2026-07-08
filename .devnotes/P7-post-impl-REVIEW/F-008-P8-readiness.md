# F-008 / P8 - Observability And Pilot Gate

Goal: add safe audit, structured logs, optional metadata-only tracing, admin diagnostics, and launch evidence for a 5-10 user internal pilot without changing P1-P7 behavior.

Not in P8: custom dashboard, SIEM export, alerts, compliance retention policy, OpenTelemetry collector, metrics stack, self-host Langfuse in core compose, prompt management, LLM judge evals, full content tracing, audit retention worker, generic query log, or any P9 frontend delivery.

---

## Big Picture

```text
Administrator / Member / Worker / API request
  |
  +-- API/service boundary owns authz and product state
  |
  +-- AuditService
  |     +-- immutable audit_events
  |     +-- admin/security accountability
  |
  +-- JSON stdout logger
  |     +-- request_id / trace_id context
  |     +-- safe operational diagnostics
  |
  +-- optional tracing wrapper
  |     +-- disabled by default
  |     +-- metadata only
  |     +-- never audit truth
  |
  +-- optional admin diagnostics
        +-- bounded through P3/P5 private boundaries
        +-- redacted
        +-- audited
        +-- no browser path, URL, credential, or raw runtime payload

Pilot gate
  -> prove P1-P8 flow and failure behavior
  -> record evidence in acceptance.md / implementation-log.md / feature-register.md
```

P8 observes the system. It must not become a second system of record, a debug data lake, or a way for the browser to reach private runtime details.

---

## What Observability Means Here

| Term | Meaning in P8 | Not this |
| --- | --- | --- |
| Audit event | Immutable security/admin accountability record in `audit_events` | log line, trace span, query history |
| Structured log | Safe JSON stdout diagnostic record | product truth or raw exception dump |
| Trace | Optional metadata-only timing/debug record | prompt/source/answer export |
| Diagnostics | Admin-only bounded redacted runtime/provider status through backend-owned boundaries | browser-supplied path, URL, container, provider, or LightRAG probe |
| Pilot gate | Evidence that the internal 5-10 user launch flow and failures are tested | production scale claim |

---

## P7 Dependency Gate

| Gate | Current review result |
| --- | --- |
| F-007 status | `feature-register.md`, `acceptance.md`, and `implementation-log.md` say implemented. |
| Conversation and turn tables | `conversations`, `conversation_turns`, `conversation_turn_evidence_refs` exist in models and migration `20260706_0006_conversations_and_turns.py`. |
| SSE path | `POST /api/v1/conversations/{conversation_id}/turns:stream` pre-consumes first event so validation/idempotency errors return JSON before SSE opens. |
| Safe evidence refs | Public payloads expose `conversation_turn_evidence_refs.id`, not Source Document or Source Block ids. |
| Redaction hooks | Source and domain delete call chat redaction before rows disappear. |
| P7 verification | F-007 acceptance records compileall, targeted P7 tests, conversation/OpenAPI tests, and full `pytest` -> 76 passed, 1 warning. |
| P8 code | Not implemented. No `audit_events` model/migration, AuditService, admin audit route, structured log helper, tracing wrapper, or diagnostics route found. |

Decision: P7 is a usable dependency for P8. P8 must add observability around existing P1-P7 behavior without changing those outcomes.

---

## Build Order From `tasks.md`

```text
T-000  read docs/contracts/feature folder
T-010  add audit event migration, enum, and service
T-020  instrument admin/security actions
T-030  add structured JSON logging context
T-040  add optional tracing wrapper and safe metadata policy
T-050  add admin audit and optional diagnostics routes
T-060  run pilot launch gate and expected-load test
T-900  run test-plan.md
T-910  update acceptance, implementation log, feature register
```

Do not start T-010 until API-001, DATA-001, QA-003, and DEL-002/RUN-001 identify the exact public/private shapes P8 will prove.

---

## Lifecycle Flows

### Audit Event

```text
admin/security action happens
  -> service decides event name
  -> AuditService writes immutable audit_events row
  -> API returns product DTO unchanged
```

Open blocker: exact `AuditEventName` enum, table columns, metadata shape, and event coverage are not contract-closed in DATA-001/API-001.

### Structured Log

```text
request starts
  -> request_id and trace_id context
  -> API/service/worker logs safe fields only
  -> production logs avoid raw exception text
```

QA-003 names allowed log fields. It does not yet name event names, exception typing policy, or how context crosses workers/SSE.

### Optional Trace

```text
LANGFUSE_ENABLED=false by default
  -> no product behavior changes

if enabled
  -> isolated tracing module
  -> metadata only
  -> outage ignored
```

Open blocker: whether `conversation_turns.trace_id` is persisted and which metadata keys are allowed must be patched before implementation.

### Admin Diagnostics

```text
GET /api/v1/admin/domains/{domain_id}/diagnostics/lightrag?tail=200
  -> admin authz
  -> no browser-supplied path/URL/container/provider target
  -> controller/P5 boundary fetches bounded diagnostics
  -> redaction
  -> audit
  -> safe DTO
```

Open blocker: API-001 only names the optional route. It does not define response DTO, caps, error codes, or redaction proof.

### Pilot Gate

```text
run checks
  -> format/lint/type
  -> unit/integration/migration/OpenAPI/SSE/e2e as touched
  -> secret scan
  -> compose smoke
  -> full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact
  -> 5-10 concurrent user expected-load test
  -> provider timeout / worker unavailable / DB unavailable / invalid upload
  -> update evidence docs
```

DEL-002 and RUN-001 define the launch gate. P8 acceptance currently lists pending evidence only.

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| API route | authz, strict DTOs, audit read/diagnostics HTTP surface | private runtime targeting from browser input |
| AuditService | event enum, immutable row writes, safe target metadata | product state transitions, log/tracing truth |
| Services/workers | call audit/log hooks at state transitions | raw payload export |
| Logging context | request_id, trace_id, actor kind, route/status/outcome, safe error code | raw request body, raw exception text, prompt/question/answer/source text |
| Tracing wrapper | optional timing and metadata capture | audit truth, content trace, required dependency for core behavior |
| Diagnostics boundary | redacted bounded admin diagnostics through P3/P5 | direct LightRAG/browser/controller URLs, paths, provider payloads |
| Acceptance docs | launch evidence and known limitations | unverified production claims |

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner patch |
| --- | --- | --- |
| A1 | Exact `audit_events` table fields, constraints, indexes, and immutability rule? | DATA-001 |
| A2 | Exact `AuditEventName` enum and required event coverage for auth/admin/domain/source/index/evidence/chat/delete/redaction actions? | DATA-001 + F-008 spec |
| A3 | Is audit metadata typed columns, constrained JSON, or a hybrid? What keys and max sizes are allowed? | DATA-001 + QA-003 |
| A4 | Exact `GET /admin/audit-events` response DTO, filters, sort order, pagination/limit, and error codes? | API-001 |
| A5 | Does P8 persist `trace_id` on `conversation_turns`? If yes, exact column and API/log exposure rules? | DATA-001 + EVT-001 if stream-visible |
| A6 | Exact diagnostics response shape and caps for optional LightRAG diagnostics route? | API-001 + QA-003 |
| A7 | OpenAPI snapshot target for P8 route additions? | tests/snapshots + F-008 test-plan |

### B. Runtime/controller/private integration blockers

| # | Question | Owner patch |
| --- | --- | --- |
| B1 | Which service boundary fetches LightRAG diagnostics: P3 controller, P5 index client, or a new diagnostics adapter? | ARCH-002 + API-001 |
| B2 | How is diagnostics redaction tested without storing raw runtime output in fixtures? | QA-003 + tests |
| B3 | What is the failure behavior when diagnostics boundary is unavailable? | API-001 safe errors |
| B4 | Does optional tracing import Langfuse only inside one isolated module? | QA-003 + implementation test |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner patch |
| --- | --- | --- |
| C1 | Should audit writes be same-transaction for admin/security state changes, or best-effort after commit? | DATA-001 |
| C2 | What happens if AuditService write fails for a protected admin action? | F-008 spec + DATA-001 |
| C3 | How does log context propagate into workers and streaming generators? | QA-003 |
| C4 | What prevents logs/traces from duplicating a replayed P7 turn as a new provider/retrieval call? | F-007/P8 tests |

### D. Delete/redaction/destructive-state blockers

| # | Question | Owner patch |
| --- | --- | --- |
| D1 | Which source/domain delete and redaction transitions must emit audit events? | DATA-001 + F-008 spec |
| D2 | Is there any audit read/export/delete route? Decision should be no for P8 except admin read. | API-001 |
| D3 | How are destructive schema changes blocked or compensated? | DEL-002 |

### E. Storage/private data blockers

| # | Question | Owner patch |
| --- | --- | --- |
| E1 | Are actor ids and target ids allowed in audit rows? Which ids are public-safe vs internal-only? | DATA-001 + QA-002 |
| E2 | If user-agent/IP fingerprints are used, what HMAC key source and retention rule applies? | DATA-001 + QA-003 |
| E3 | Which metadata keys are allowed in logs and traces? | QA-003 |
| E4 | How will tests prove no source text, question text, answer text, prompt text, provider payload, paths, runtime URLs, or raw LightRAG hits leak? | QA-002 + QA-003 + tests |

### F. Authz/roles blockers

| # | Question | Owner patch |
| --- | --- | --- |
| F1 | `GET /admin/audit-events` is Administrator-only. What do Member/Public get? | API-001 |
| F2 | Optional diagnostics route is Administrator-only, redacted, bounded, and audited. | API-001 + PROD-004 |
| F3 | Do auth failures create audit rows or safe logs only? PROD-004 says public auth failures are safe-log only. | PROD-004 + DATA-001 |
| F4 | Can administrators see user chat content through audit? Decision should be no. | API-001 + DATA-001 |

### G. Test/evidence blockers

| # | Question | Owner patch |
| --- | --- | --- |
| G1 | Exact commands for format/lint/type checks in this repo, given `ruff` was not installed during P7. | F-008 test-plan |
| G2 | Secret scan command and scope? | F-008 test-plan + DEL-002 |
| G3 | Compose smoke command and required private runtime fixture? | RUN-001 |
| G4 | Full pilot flow script/manual evidence format? | RUN-001 |
| G5 | Expected-load test tool and pass/fail threshold for 5-10 users? | QA-004 + F-008 test-plan |
| G6 | Failure injection fixtures for provider timeout, worker unavailable, DB unavailable, invalid upload? | QA-004 + tests |

---

## Acceptance Criteria As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | Format/lint/type checks have real command evidence or a documented blocked tool gap. |
| AC-002 | Unit/integration/migration/OpenAPI tests prove audit table/service/routes and no P1-P7 regressions. |
| AC-003 | Secret scan proves no committed sensitive values, raw payload examples, raw source text, runtime URLs, stack traces, prompts, or provider payloads. |
| AC-004 | Compose smoke proves API, DB, worker/runtime boundaries, and health/readiness on the pilot-like target. |
| AC-005 | SSE end-to-end proves P7 streaming still works with P8 request/log/trace context and no payload drift. |
| AC-006 | Full pilot flow proves auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact. |
| AC-007 | 5-10 concurrent user expected-load test passes on target infrastructure/provider quotas. |
| AC-008 | Provider timeout, worker unavailable, DB unavailable, and invalid upload fail safely with evidence recorded. |

---

## What Junior Dev Should Read

1. `AGENTS.md`
2. `README.md`
3. `specs/00-governance/constitution.md`
4. `CONTEXT.md`
5. `specs/04-features/F-007-grounded-streaming-chat/acceptance.md`
6. `specs/04-features/F-007-grounded-streaming-chat/implementation-log.md`
7. `specs/04-features/F-008-observability-pilot-gate/`
8. `specs/03-contracts/api/context-engine-v1.md`
9. `specs/03-contracts/data/context-engine-data.md`
10. `specs/05-quality/observability.md`
11. `specs/05-quality/security-and-privacy.md`
12. `specs/05-quality/test-strategy.md`
13. `specs/05-quality/performance-and-resilience.md`
14. `specs/06-delivery/release-and-rollbacks.md`
15. `specs/06-delivery/runbooks/pilot-launch.md`
16. `context_engine/api/routes.py`
17. `context_engine/services/chat_turns.py`
18. `tests/test_grounded_streaming_chat.py`
19. `.devnotes/P7-post-impl-REVIEW/ID-A.md`

---

## Practical Start Checklist

- Patch DATA-001 with `audit_events`, `AuditEventName`, immutable write rules, safe metadata rules, and optional trace id storage.
- Patch API-001 with `GET /admin/audit-events` DTO/filter/error contract and the optional diagnostics DTO/error/cap contract.
- Patch QA-003 with event naming, exception/log context policy, trace metadata allowlist, and redaction proof.
- Confirm DEL-002/RUN-001 evidence commands for compose smoke, secret scan, full flow, failure injection, and expected-load.
- Add migration/model tests before adding route instrumentation.
- Add AuditService tests before wiring every admin/security route.
- Add structured log snapshot/redaction tests.
- Add optional tracing disabled/outage tests.
- Add diagnostics authz/bounds/redaction/audit tests.
- Run P7 SSE regression after P8 context hooks are added.
- Update acceptance, implementation log, feature register, and traceability.

---

## Reference Comparison

| Question | Reference answer | Greenfield delta |
| --- | --- | --- |
| P8 scope | `.references/context_engine_fullstack_impl_docs/phase_plan/P8_observability_pilot_gate.md` lists audit, JSON stdout, optional Langfuse, diagnostics, and launch gates. | Active specs must decide exact table/API/test shapes before implementation. |
| Audit fields | Reference suggests event enum, actor id, target, request/trace id, fingerprints, strict safe metadata, created timestamp. | DATA-001 currently names only `audit_events`; do not copy fields until contract-patched. |
| Logs | Reference and QA-003 agree on safe JSON stdout fields. | QA-003 is authoritative; add implementation event names and snapshots. |
| Langfuse | Reference says disabled by default, metadata-only, isolated import, outage ignored. | Active QA-003 has layer policy but needs metadata allowlist and dependency isolation tests. |
| Diagnostics | Reference suggests `tail=200`, cap, redaction, audit, and no browser path/URL target. | API-001 names the optional route only; patch DTO/errors/caps before code. |
| Pilot gate | Reference, DEL-002, and RUN-001 agree on full flow, compose smoke, secret scan, expected-load, and failure tests. | P8 acceptance must record real commands/output before status changes to implemented. |

What reference evidence answers well:

| Area | Useful evidence |
| --- | --- |
| Observability layers | Audit truth, logs as diagnostics, tracing as optional debug. |
| Safety posture | Metadata only; no raw product/provider/runtime content. |
| Launch gate | The pilot is a proof package, not a production scale claim. |

What reference evidence does not answer:

| Area | Gap |
| --- | --- |
| Exact P8 schema | Active DATA-001 must own it. |
| Exact API DTO | Active API-001 must own it. |
| Current code layout | Reference paths differ from this greenfield package. |
| Test commands | Current repo tooling and fixtures must decide them. |

Verdict for junior dev: use references for pressure-testing only. Implement against F-008, DATA-001, API-001, QA-003, QA-002, DEL-002, RUN-001, and the current P7 code.

One-line summary: P8 is not "add logs everywhere"; it is a contract-first observability slice whose first job is closing audit, log, trace, diagnostics, and launch-evidence shapes before code.
