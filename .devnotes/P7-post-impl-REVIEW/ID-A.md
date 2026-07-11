# ID-A - Observability contract and pilot gate (P8 blockers)

Working doc for the P7-to-P8 gate. Canonical patch targets: `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/05-quality/observability.md`, `specs/05-quality/security-and-privacy.md`, `specs/06-delivery/release-and-rollbacks.md`, `specs/06-delivery/runbooks/pilot-launch.md`, `specs/04-features/F-008-observability-pilot-gate/spec.md`, and the first P8 migrations/services/tests.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, F-007 spec/plan/tasks/test-plan/acceptance/implementation log, F-008 spec/plan/tasks/test-plan/acceptance/implementation log, API-001, EVT-001, DATA-001, AI-001, PROD-004, ARCH-002/003, QA-001/002/003/004, DEL-001/002, RUN-001, TRACE-001, `context_engine/models.py`, `context_engine/api/routes.py`, `context_engine/services/chat_turns.py`, `context_engine/services/evidence.py`, `tests/test_conversations.py`, `tests/test_grounded_streaming_chat.py`, `.references/context_engine_fullstack_impl_docs/phase_plan/P8_observability_pilot_gate.md`, and `.references/review/coantext-engine/context-engine-review.md`.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-audit-events.md](./ID-A-audit-events.md) | `audit_events`, `AuditEventName`, AuditService, immutable admin/security accountability |
| [ID-A-safe-logging-context.md](./ID-A-safe-logging-context.md) | JSON stdout, request/log context helper, redaction, raw exception policy |
| [ID-A-optional-tracing-langfuse.md](./ID-A-optional-tracing-langfuse.md) | optional metadata-only tracing, Langfuse isolation, neutral `trace_id` |
| [ID-A-admin-diagnostics.md](./ID-A-admin-diagnostics.md) | optional LightRAG/provider diagnostics route, bounds, redaction, audit |
| [ID-A-pilot-launch-gate.md](./ID-A-pilot-launch-gate.md) | release evidence, compose smoke, full pilot flow, load and failure tests |

---

## Lean Winner

```text
Patch P8 contracts first
+ audit_events table and event enum
+ AuditService with immutable safe records
+ admin read route over safe DTOs only
+ request/log context helper with QA-003 fields
+ optional tracing wrapper disabled by default
+ diagnostics route only if API-001 defines DTO/caps/errors
+ pilot gate script/manual evidence package
+ no P1-P7 behavior drift
```

This is the low-entropy path. It gives operators enough accountability and launch evidence without adding a metrics platform, query log, workflow system, or tracing dependency as product truth.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Use logs as audit truth | QA-003 says `audit_events` is audit truth; logs are diagnostic evidence. |
| Use Langfuse as audit/product truth | QA-003 says optional tracing is never audit truth. |
| Add `query_logs` for chat/retrieval | DATA-001 says chat state belongs to `conversation_turns`, not query logs. |
| Store raw prompt/question/answer/source/evidence/provider payloads for debugging | QA-002/QA-003 forbid it. |
| Browser supplies diagnostics path, URL, container, provider, or LightRAG target | AGENTS, QA-002, PROD-004, and API-001 forbid private runtime access from browser code. |
| Add custom dashboard/metrics stack/alerts in P8 | F-008 out-of-scope rejects them. |
| Skip contract patch and infer audit DTO/table shape from reference docs | Active specs are authority; references are evidence only. |
| Claim pilot-ready from unit tests only | DEL-002/RUN-001 require compose, full flow, secret scan, load, and failure proof. |

---

## Grill Tree - Decisions Resolved Or Required

```text
Can P8 start coding now?
  -> Not safely. DATA-001/API-001/QA-003 lack exact P8 shapes.

What is the main blocker cluster?
  -> Audit/log/trace/diagnostics contract closure plus launch evidence definition.

What is audit truth?
  -> audit_events. Not logs. Not Langfuse.

Can tracing capture content?
  -> No by default. Metadata only unless a later approved contract changes it.

Can diagnostics expose runtime details?
  -> No. Admin-only, bounded, redacted, audited, backend-owned target.

Can P8 change P7 chat behavior?
  -> No. P7 API/SSE/data semantics stay fixed; P8 observes them.

What closes P8?
  -> Real acceptance evidence in F-008 docs and traceability, not planned rows.
```

---

## A1 - Audit Events

DATA-001 currently names `audit_events` but does not define fields. F-008 names `AuditEventName` and `AuditService`, but not the enum values or row contract.

Recommended contract patch target:

| Surface | Must decide |
| --- | --- |
| Event enum | Closed names for auth/admin/domain/source/index/evidence/chat/delete/redaction/security actions. |
| Actor | actor kind and actor user id when known; no username/email unless contract-approved. |
| Target | target kind/id with safe ids only. |
| Request context | request id, optional trace id, route/action. |
| Metadata | strict allowlist, max sizes, no raw product/provider/runtime content. |
| Immutability | no update/delete API; migration/model constraints or service rule. |
| Failure behavior | same-transaction vs best-effort audit writes for protected actions. |

Decision: do not implement AuditService until DATA-001 and API-001 close the schema, event enum, and read DTO.

---

## A2 - Admin Audit Read API

API-001 lists `GET /admin/audit-events` but does not define the DTO.

Required before route code:

| Surface | Decision |
| --- | --- |
| Filters | by event name, actor kind/id, target kind/id, request id, trace id, created range? |
| Pagination | limit, cursor or offset, default order. |
| DTO | field names, timestamp format, metadata shape, null rules. |
| Authz | Administrator-only; Members/Public receive canonical errors. |
| Safety | no usernames, raw IP/user agent, request bodies, prompts, questions, answers, source text, provider payloads, paths, runtime URLs, stack traces. |

Lean default: newest-first, bounded `limit`, no export route, no delete route.

---

## A3 - Structured Logs

QA-003 defines safe fields:

```text
timestamp, level, logger, event, request_id, trace_id, actor_kind,
domain_id, source_id, conversation_turn_id, operation_id,
safe_error_code, elapsed_ms, http_method, http_route,
http_status, outcome
```

Missing before implementation:

| Surface | Decision |
| --- | --- |
| Event names | closed enough to snapshot. |
| Exception policy | production logs use safe code/type, not raw exception text. |
| Context propagation | request -> service -> worker -> SSE generator. |
| Redaction tests | exact fixture/snapshot scans. |

Decision: add one log context helper and one safe logging API. Do not scatter ad hoc logger dictionaries across routes.

---

## A4 - Optional Tracing

F-008 allows optional Langfuse, disabled by default. QA-003 says tracing is never audit truth.

Required before implementation:

| Surface | Decision |
| --- | --- |
| Module boundary | single tracing module owns external import. |
| Config | disabled by default; outage ignored. |
| Metadata allowlist | trace id, request id, turn id, domain id, event/result kind, counters, latency, safe provider/model metadata only. |
| Chat turn storage | whether `conversation_turns.trace_id` exists. |
| Tests | disabled, enabled metadata-only, outage, no content leakage. |

Decision: trace context is advisory metadata. It must never change auth, upload, retrieval, chat, SSE, delete, or redaction behavior.

---

## A5 - Admin Diagnostics

API-001 names optional `GET /admin/domains/{domain_id}/diagnostics/lightrag?tail=200`. PROD-004 says admin diagnostics are redacted, bounded, audited, and never path/URL driven by browser input.

Required before implementation:

| Surface | Decision |
| --- | --- |
| Response DTO | exact safe fields and caps. |
| Boundary | P3 controller, P5 index client, or a P8 diagnostics adapter over them. |
| Tail cap | max lines/bytes and default. |
| Redaction | how redaction is applied and tested. |
| Audit | event name and target. |
| Error codes | unknown domain, unavailable boundary, unauthorized member, invalid tail. |

Decision: diagnostics is optional. If contract shape cannot be closed, skip route and record it as blocked instead of inventing a proxy.

---

## A6 - Pilot Launch Gate

F-008 acceptance, DEL-002, RUN-001, QA-001, and QA-004 require real evidence.

Minimum gate:

```text
format/lint/type
unit/integration/migration/OpenAPI
secret scan
compose smoke
SSE end-to-end
full auth -> domain -> upload -> prepare -> index -> evidence -> chat -> delete/redact
5-10 concurrent user expected-load
provider timeout / worker unavailable / DB unavailable / invalid upload
```

Decision: P8 cannot be marked implemented with `pending` rows. Every acceptance criterion needs command output, snapshot, fixture, runbook note, or explicit blocked evidence with owner.

---

## Single-Source Functions

```text
audit_event_is_safe(event) =
  event.name in AuditEventName
  AND event.actor/target ids are safe ids
  AND metadata keys are allowlisted
  AND metadata values pass max-size/redaction checks
```

```text
log_record_is_safe(record) =
  keys subset QA-003 safe log fields
  AND no raw request body / exception text / prompt / question / answer / source text
  AND no provider payload / runtime URL / path / credential value
```

```text
trace_is_allowed(trace) =
  tracing enabled
  AND emitted through observability tracing module
  AND metadata only
  AND failure is swallowed or safely logged
```

```text
diagnostics_request_allowed(request) =
  actor.role == Administrator
  AND domain exists
  AND tail within contract cap
  AND target resolved server-side
  AND response redacted and audited
```

---

## Entity/Data Diagram

```text
users
  |
  +-- auth_sessions
  |
  +-- audit_events
        event_name
        actor_kind / actor_user_id
        target_kind / target_id
        request_id / trace_id
        safe metadata
        created_at

conversations
  |
  +-- conversation_turns
        optional trace_id?  <- contract decision
        safe counters

stdout JSON logs
  request_id / trace_id / safe operational fields only

optional tracing
  metadata only
  not product truth
```

---

## Junior Dev - Do This Order

1. Read this file and the five focused ID-A memos.
2. Patch DATA-001 for audit schema, enum, immutability, safe metadata, and trace id storage decision.
3. Patch API-001 for admin audit route and optional diagnostics route DTO/errors/caps.
4. Patch QA-003 for safe log event naming, exception policy, tracing metadata allowlist, and diagnostics redaction proof.
5. Patch F-008 test-plan with exact commands for lint/type, secret scan, compose smoke, full flow, load, and failure injection.
6. Add migration/model tests for `audit_events`.
7. Implement AuditService and route instrumentation.
8. Add admin audit read route.
9. Add structured log context helper and snapshots.
10. Add optional tracing wrapper with disabled/outage tests.
11. Add diagnostics route only if its contract is closed.
12. Run P7 SSE regressions plus P8 launch gate.
13. Update acceptance, implementation log, feature register, and traceability.

---

## Red Flags In PR

- `audit_events` has a generic unbounded metadata blob with no allowlist.
- Logs or traces contain request bodies, prompts, questions, answers, source text, raw evidence, provider payloads, runtime URLs, paths, or raw exception text.
- Langfuse import appears outside one isolated tracing module.
- Product behavior fails because tracing is unavailable.
- Admin diagnostics accepts browser-provided path, URL, container id, provider target, or runtime address.
- Member can read audit events or diagnostics.
- P8 changes P7 SSE event shapes or terminal semantics without updating EVT-001.
- Full pilot flow/load/failure gates are skipped but acceptance says implemented.
- `query_logs` or generic workflow/event warehouse appears.
- Known limitations are not recorded in `implementation-log.md`.

---

## Tests To Write

- Migration: fresh upgrade creates `audit_events` with approved constraints/indexes and no unsafe columns.
- AuditService: immutable writes, enum validation, safe metadata rejection, and coverage for admin/security actions.
- API: `GET /admin/audit-events` admin-only, bounded, ordered, safe DTO, OpenAPI snapshot.
- Logging: safe JSON record snapshot; raw exception text and forbidden keys absent.
- Tracing: disabled default, enabled metadata-only, outage ignored, import isolation.
- Diagnostics: admin-only, invalid tail rejected, response bounded/redacted, audited, no browser-private targets.
- Regression: P7 SSE direct/domain/no-context/evidence-only/replay still matches EVT-001.
- Launch: compose smoke, full pilot flow, 5-10 expected-load, provider timeout, worker unavailable, DB unavailable, invalid upload.
- Safety scan: specs/fixtures/screenshots/log samples contain no sensitive values or raw product/provider/runtime content.

Still needs ID-B only if diagnostics requires a new internal controller contract beyond P3/P5 boundaries. Otherwise keep P8 under ID-A contract closure.

Next grill session: patch DATA-001/API-001/QA-003 with exact P8 shapes, then start T-010.
