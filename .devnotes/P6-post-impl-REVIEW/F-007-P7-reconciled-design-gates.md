# F-007 / P7 Reconciled Design Gates

Status: review decision draft  
Feature: F-007 - Agentic Chat And Streaming  
Date: 2026-07-03  
Method: grill-with-docs

## Scope

This document answers the "Questions MUST Answer Before Coding" in `.devnotes/P6-post-impl-REVIEW/F-007-P7-readiness.md`.

This is not implementation authority by itself. Before P7 code starts, patch or confirm the active contracts/specs named below.

Canonical patch targets:

- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
- `specs/04-features/F-007-grounded-streaming-chat/plan.md`
- `specs/04-features/F-007-grounded-streaming-chat/test-plan.md`
- `specs/04-features/F-007-grounded-streaming-chat/acceptance.md`

No user override decisions were supplied. The recommendations below are review decisions to be accepted by contract patches before implementation.

## Sources Grilled

- `AGENTS.md`
- `README.md`
- `CONTEXT.md`
- `specs/00-governance/constitution.md`
- `specs/01-product/business-rules.md`
- `specs/01-product/domain-model.md`
- `specs/01-product/roles-and-permissions.md`
- `specs/02-architecture/component-boundaries.md`
- `specs/02-architecture/integration-flows.md`
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`
- `specs/03-contracts/data/context-engine-data.md`
- `specs/03-contracts/ai/grounded-answering.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/acceptance.md`
- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
- `specs/04-features/F-007-grounded-streaming-chat/plan.md`
- `specs/04-features/F-007-grounded-streaming-chat/tasks.md`
- `specs/04-features/F-007-grounded-streaming-chat/test-plan.md`
- `specs/04-features/F-007-grounded-streaming-chat/acceptance.md`
- `specs/04-features/F-007-grounded-streaming-chat/implementation-log.md`
- `specs/05-quality/security-and-privacy.md`
- `specs/05-quality/test-strategy.md`
- `specs/05-quality/ai-evaluation.md`
- `specs/05-quality/performance-and-resilience.md`
- `specs/07-traceability/feature-register.md`
- `.devnotes/P6-post-impl-REVIEW/F-007-P7-readiness.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A-turn-api-and-data.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A-sse-projection-and-citations.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A-orchestrator-retrieval-port.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A-direct-llm-intent-gate.md`
- `.devnotes/P6-post-impl-REVIEW/ID-A-redaction-and-delete-hooks.md`
- `.devnotes/P3-post-impl-REVIEW/F-004-P4-reconciled-design-gates.md`
- `context_engine/services/evidence.py`
- `.references/controllable-rag-fastapi-replication-pkg/docs/04-query-control-graph.md`
- `.references/controllable-rag-fastapi-replication-pkg/docs/09-api-and-sse-contract.md`
- `.references/controllable-rag-fastapi-replication-pkg/docs/13-test-and-evaluation.md`
- `.devnotes/controllable-rag-intergration-plan-v1/01-orchestrator-sequence.md`
- `.devnotes/controllable-rag-intergration-plan-v1/02-chat-shell-wiring.md`

## Product DNA Locks

- Use canonical product terms: Knowledge Domain, Source Document, Source Block, Evidence, Citation, Conversation, Turn, Redaction.
- P7 creates owner-scoped Conversations, durable Turns, turn-scoped Evidence references, server-classified direct LLM chat, server-classified domain RAG, Context Engine SSE, and redaction hooks.
- P7 does not create source navigation, team/shared conversations, admin global chat read, chat worker queues, model picker, prompt editor, provider failover, web search, open tools, or frontend shell implementation.
- Backend owns authz, route classification, active synthesis profile resolution, retrieval intent labels, orchestration policy, citation validation, idempotency, terminal settlement, and Redaction.
- Browser sends only `clientRequestId`, `message`, and optional `domainId`; it never selects route, model, provider, prompt, retrieval mode, tool, middleware, budget, or runtime behavior.
- Retrieval enters chat through one `RetrievalPort` over the F-006 Evidence callable. Do not call LightRAG directly from chat code and do not duplicate `CE_BLOCK` parsing.
- `fact`, `overview`, and `verbatim` are server-owned retrieval intent labels over the same P6 path. They are not separate retrievers, vector stores, endpoints, browser controls, or runtimes.
- Context Engine SSE emits product events only: `stage`, `evidence`, `token`, `done`, `error`.
- KISS/YAGNI: no generic workflow engine, event bus, Redis/RQ/Celery, WebSocket migration, plugin system, LangChain/LangGraph adapter, FAISS recreation, second vector store, or local retrieval fallback.
- Reference material is evidence only. The reference `/api/v1/chat/turns:stream`, reference event names, and reference multi-retriever shape are not greenfield contracts.

## Recommended Build Shape

```text
FastAPI route
  POST /api/v1/conversations/{conversation_id}/turns:stream
    validates strict request
    authenticates Member/Admin
    delegates to ChatTurnService

ChatTurnService
  owns owner filter, idempotency, one-running guard, persistence order
  creates/settles conversation_turns
  never holds DB transaction while provider/retrieval/SSE is active

IntentGate
  classifies direct_llm vs domain_rag
  fails closed when a Knowledge Domain is required but absent

TurnOrchestrator
  CE-native request-scoped loop
  static typed middleware: budget, allowlist, evidence safety,
  verifier, citation validator, SSE projector

RetrievalPort
  retrieve(domain_id, query, intent, policy)
  -> F-006 private Evidence callable
  -> mapped Evidence with private source/block identity for persistence
  -> safe public Evidence event

SynthesisGateway
  resolves active synthesis profile once per Turn
  streams projected answer tokens only

Postgres
  conversations
  conversation_turns
  conversation_turn_evidence_refs

Delete/redaction service
  source/domain delete -> redact affected domain_rag Turns
```

## A. Contract/data/API blockers

### A1. Exact `GET /conversations/{id}` turn-summary DTO fields?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Safe typed Turn summary | Matches DATA-001 and later UI needs without leaking internals | Requires API-001 patch | `turns: [{ id, route, status, stopReason }]` |
| Return ORM-shaped Turn rows | Fast to implement | Leaks future private columns | raw model serialization |
| Return only Conversation metadata | Minimal now | P9 cannot render history without guessing | no `turns` array |

Recommendation: safe typed Turn summary.

Patch API-001 with:

```text
GET /api/v1/conversations/{conversation_id}

Response:
  conversation:
    id
    title
    createdAt
    updatedAt
  turns[]:
    id
    clientRequestId
    route: direct_llm | domain_rag
    status: running | completed | failed | redacted
    stopReason: nullable closed stop reason
    domainId: string | null
    userMessage: owner-visible user question
    assistantAnswer: string | null
    safeErrorCode: string | null
    safeErrorMessage: string | null
    evidence[]:
      evidenceId
      excerpt
      sourceLabel
      citationLabel
    createdAt
    startedAt
    completedAt
```

Rules:

```text
direct_llm turns return evidence = [].
redacted turns return assistantAnswer = null and evidence = [].
Evidence ids are turn-scoped public ids, not Source Document or Source Block ids.
```

### A2. Exact duplicate `clientRequestId` replay behavior for completed, failed, and currently running Turns?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Replay terminal safe state | Proves idempotency and avoids second provider call | Requires stored answer/evidence/error projection | duplicate completed emits stored result |
| Reject every duplicate | Simple | AC-004 expects existing result/no second provider call | `409 duplicate` for completed |
| Attach to running stream | Nice UX | More transport complexity, not required in P7 | stream fan-out |

Recommendation: replay terminal Turns, reject duplicate while running.

Patch API-001 with:

```text
Duplicate clientRequestId in same Conversation:
  if existing status in completed | failed | redacted:
    return/replay the existing safe terminal result
    do not call provider
    do not call RetrievalPort
    do not create a new Turn

  if existing status = running:
    return 409 conversation_turn_in_progress
    do not attach to the active stream in P7
```

Patch DATA-001 with:

```text
unique(conversation_id, client_request_id)
```

Patch F-007 test-plan with: duplicate completed, failed, redacted, and running cases.

### A3. Exact SSE `evidence` payload shape and public evidence reference id used by `done.citations`?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Turn-scoped opaque `evidenceId` | Supports citations without exposing private source/block ids | Requires evidence-ref persistence before citation validation | `ev_01` |
| Public Source Block id | Easy mapper | Forbidden until source-ref contract exists | `source_block_id` |
| Citation label only | Simple UI | Cannot validate citation target robustly | `[1]` only |

Recommendation: turn-scoped opaque `evidenceId`.

Patch EVT-001/API-001 with:

```text
event: evidence
data:
  evidence[]:
    evidenceId: opaque id scoped to this Turn
    excerpt: approved bounded excerpt
    sourceLabel: safe display label
    citationLabel: safe label used by answer citations
```

```text
event: done
data:
  route: direct_llm | domain_rag
  stopReason: closed stop reason
  citations[]:
    evidenceId
    citationLabel
```

Rules:

```text
done.citations references only evidenceIds emitted in the same Turn.
direct_llm done has citations = [].
No public Source Document id or Source Block id appears in SSE/API DTOs.
```

Patch DATA-001 with: `conversation_turn_evidence_refs.id` is either the public `evidenceId` or maps deterministically to it. Pick one before code.

### A4. Does `no_grounded_context` end as `done` or `error` in SSE? Exact body?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| `done` terminal | It is a valid safe insufficiency outcome, not system failure | UI must branch by `stopReason` | `done stopReason=no_grounded_context` |
| `error` terminal | Easy error path | Treats expected no-context result as failure | `error code=no_grounded_context` |
| Token fallback text | Conversational | Risks ungrounded answer style | generated apology token |

Recommendation: `done` terminal with no answer tokens required.

Patch EVT-001 with:

```text
No grounded context:
  event: done
  data:
    route: domain_rag
    stopReason: no_grounded_context
    citations: []
```

Patch AI-001 with: domain RAG no Evidence never falls back to direct LLM and does not fabricate an answer.

### A5. Does provider failure after Evidence end as `done` with `evidence_only` or `error` with partial Evidence?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| `done` with `evidence_only` | Preserves successful retrieval and matches AI-001 fallback | Requires UI to render safe partial outcome | evidence panel + terminal |
| `error` after Evidence | Standard failure flow | Makes partial Evidence look unusable | `error provider_failure` |
| Retry provider in background | Better chance of answer | P7 excludes background synthesis retry | retry worker |

Recommendation: if Evidence was emitted, end with `done stopReason=evidence_only`. If provider fails before Evidence, use safe `error`.

Patch EVT-001 with:

```text
Provider failure after Evidence:
  event: done
  data:
    route: domain_rag
    stopReason: evidence_only
    citations: []

Provider failure before Evidence:
  event: error
  data:
    code: provider_failure
    message: bland safe message
```

Patch AI-001 with: no raw provider details are exposed; no background retry in P7.

### A6. Exact title validation/generation rule for `POST /conversations`?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Optional nullable safe title | Minimal, matches DATA-001 nullable title, avoids LLM title generation | UI needs fallback label later | `title: null` |
| Always generate title | Nice list display | Adds behavior before first Turn | `Safe generated title` |
| Require title | Simple validation | Bad UX for chat create | `422 title required` |

Recommendation: optional nullable safe title. No LLM title generation in P7.

Patch API-001 with:

```text
POST /api/v1/conversations
Request:
  title?: string | null
    trim whitespace
    minLength: 1 when present
    maxLength: 120
    unknown fields rejected

If omitted or null:
  store title = null
  return title = null
```

Patch F-007 plan with: title generation beyond this safe field is deferred.

### A7. Exact safe error codes for one running Turn, duplicate request, invalid domain, and route classification failure?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Closed chat error codes | Stable client/test contract | Requires API-001 patch | `conversation_turn_in_progress` |
| Reuse generic errors only | Less contract work | Ambiguous for P9 and tests | `conflict` |
| Stream errors for all failures | One transport | Validation/auth/domain failures should fail before stream | `event:error` |

Recommendation: closed safe API error codes for pre-stream failures; EVT-001 only after stream starts.

Patch API-001 with:

```text
Unknown/other-user conversation:
  404 conversation_not_found

Second running Turn or duplicate currently running request:
  409 conversation_turn_in_progress

Duplicate terminal request:
  replay existing safe terminal result; no error

Domain-specific/ambiguous message without domainId:
  409 domain_required

Unknown selected domain:
  404 domain_not_found

Unavailable selected domain:
  409 domain_state_conflict
  or 502 domain_runtime_unavailable when runtime is unavailable

Forbidden/unknown request control fields:
  422 validation_error
```

Patch F-007 test-plan with each code path.

## B. Runtime/controller/private integration blockers

### B1. Provider stream adapter API for active synthesis profile?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Internal `SynthesisGateway` | Keeps provider details private and testable | Requires adapter fake in tests | `stream_answer(context)` |
| Provider SDK calls inside route | Fast | Violates route boundary and is hard to test | route imports SDK |
| Browser-selected model/provider | Flexible | Forbidden by API-001/AI-001 | request `model` |

Recommendation: internal gateway resolved from trusted runtime config once per Turn.

Patch F-007 spec with:

```text
SynthesisGateway:
  resolves active synthesis profile server-side once per Turn
  streams answer text chunks to internal progress DTOs
  exposes safe provider_failure terminal only
  never returns provider-native payloads to SSE/API/log fixtures
```

No public API patch is needed unless terminal payload shapes change.

### B2. RetrievalPort return type with P6 Evidence plus turn-scoped citation refs?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Private mapped Evidence result | Lets P7 persist refs and emit safe DTOs | Requires private helper beyond P6 public response shape | `sourceBlockId` private, `evidenceId` public |
| Use P6 public DTO only | Reuses current response | Cannot validate citations or Redaction | `{ excerpt, sourceLabel }` only |
| Expose source/block ids publicly | Easy persistence | Forbidden without source-ref contract | public `sourceBlockId` |

Recommendation: private mapped Evidence result inside backend only; public SSE gets opaque turn-scoped ids.

Patch F-007 spec with:

```text
RetrievalPort result item:
  private source_document_id
  private source_block_id
  excerpt
  source_label
  citation_label candidate

Public projection:
  evidenceId
  excerpt
  sourceLabel
  citationLabel
```

Patch DATA-001 with: `conversation_turn_evidence_refs` stores private FKs plus safe excerpt/citation label. It may derive `sourceLabel` from the Source Document while source exists; redacted Turns expose no Evidence.

Patch F-007 plan with: if current F-006 callable returns only public DTOs, add a private backend helper while preserving the P6 public API.

### B3. How do `fact`, `overview`, and `verbatim` shape queries without creating separate retrievers?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Server-owned policy labels over one port | Matches AI-001 and AC-013 | Requires tests proving one path | `intent=overview` |
| Three retriever clients | Mirrors reference terms | Explicitly rejected | separate FAISS stores |
| Browser sends intent | Flexible | Browser must not choose retrieval mode | request `intent` |

Recommendation: intent labels only.

Patch AI-001/F-007 spec with:

```text
Allowed RetrievalIntent:
  fact
  overview
  verbatim

All intents call:
  RetrievalPort.retrieve(domain_id, query, intent, policy)
    -> F-006 Evidence callable

Intent may alter server-owned query shaping or budget policy only.
Intent must not select a different retriever, vector store, runtime, endpoint, marker parser, or browser control.
```

Patch F-007 test-plan with AC-013 import/call assertions.

### B4. What is the exact import/dependency guard that rejects LangChain/LangGraph in chat runtime?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Static dependency/import scan | Cheap and decisive | Needs maintenance as module paths change | `rg -n "langchain|langgraph"` |
| Code review only | Flexible | Easy to miss adapter drift | reviewer checklist |
| Allow adapters behind feature flag | Future-friendly | Violates F-007 explicit rejection | disabled adapter |

Recommendation: static scan plus unit-level boundary assertions.

Patch F-007 test-plan with:

```text
Dependency guard:
  fail if F-007 chat runtime imports:
    langchain
    langgraph
    create_agent
    create_react_agent
    StateGraph
    faiss
  fail if chat runtime imports LightRAG directly
  allow RetrievalPort import of F-006 service only
```

No ADR is needed for this rejection; F-007, AI-001, and ARCH-002 already decide it.

## C. Worker/concurrency/idempotency blockers

### C1. Partial unique running Turn is enforced by migration on target DB?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| DB partial unique + service guard | Correct under concurrency | Migration must be tested | unique where `status='running'` |
| Service guard only | Easy | Race-prone | check then insert |
| Queue per Conversation | Serializes work | New infra out of scope | worker queue |

Recommendation: DB partial unique index plus service guard.

Patch DATA-001 with:

```text
conversation_turns indexes:
  unique(conversation_id, client_request_id)
  unique(conversation_id) where status = 'running'
```

Patch F-007 test-plan with fresh-upgrade migration proof and concurrent insert/service tests.

### C2. No DB transaction is held during provider or LightRAG calls or SSE streaming?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Short transactions around state changes | Matches ARCH-004 and reduces lock risk | Requires careful service design | create Turn, commit, stream, settle |
| Keep transaction open for whole stream | Simple rollback story | Violates integration-flow rule | stream inside transaction |
| Persist only after stream ends | Less DB churn | Cannot guard running Turn reliably | no running state |

Recommendation: short transactions only.

Patch F-007 plan with:

```text
ChatTurnService persistence order:
  transaction 1: validate owner, idempotency, running guard, create running Turn, commit
  external work: provider/retrieval/SSE outside DB transaction
  transaction 2..n: persist evidence refs/safe counters/terminal state in short writes
```

Patch tests with a service fake that proves provider/retrieval is invoked outside an active transaction where feasible.

### C3. Client disconnect aborts provider stream and settles `running` safely. What status/stop_reason?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| `failed` + `cancelled` | Uses existing status enum and stop reason | Client cancel is not provider failure | `status=failed` |
| `completed` + `cancelled` | Treats user cancel as terminal success | Semantically odd | completed cancelled |
| Leave running for cleanup | Simple stream code | Violates AC-007 | stale running row |

Recommendation: `status = failed`, `stop_reason = cancelled`, safe error code `client_cancelled`.

Patch DATA-001/API-001/EVT-001 with:

```text
Client disconnect:
  abort upstream provider stream
  stop RetrievalPort/orchestrator if still active
  settle Turn:
    status = failed
    stop_reason = cancelled
    safe_error_code = client_cancelled
    assistant_answer = null unless already safely completed
```

If no terminal SSE can be sent because the client disconnected, persistence evidence proves AC-007.

### C4. Duplicate request while original is still streaming returns what behavior?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| 409 running conflict | Lowest complexity and satisfies one-running guard | No stream attachment | `conversation_turn_in_progress` |
| Attach to active stream | Better UX | Requires stream fan-out not in P7 | subscriber list |
| Start second stream read-only | Confusing idempotency semantics | Complex and fragile | replay partial |

Recommendation: return `409 conversation_turn_in_progress`.

Patch API-001 with:

```text
Duplicate clientRequestId while existing Turn is running:
  409 conversation_turn_in_progress
  no provider call
  no retrieval call
  no new Turn
```

Patch F-007 test-plan with duplicate-running request test.

## D. Delete/redaction/destructive-state blockers

### D1. Source delete redaction runs before Source Block rows disappear, or refs keep enough private identity?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Redact before local source/block delete | Precise and avoids dangling refs | Requires delete-service ordering patch | source delete calls redaction |
| Retain refs after source delete | Enables later audit | FK/null semantics get tricky | soft refs |
| Rely on cascade only | Easy | Leaves assistant answer unless separately cleared | evidence refs disappear |

Recommendation: redact affected Turns before local Source Document/Source Block rows disappear; then delete evidence refs for redacted Turns.

Patch DATA-001/F-007 spec with:

```text
Source delete order for chat:
  fence source from future retrieval
  complete P5 remote cleanup as required
  find conversation_turn_evidence_refs for source_document_id/source_block_id
  redact affected domain_rag Turns
  delete affected evidence refs
  continue local source/block cleanup
```

Patch F-007 test-plan with source delete -> redacted Turn proof.

### D2. Domain delete redacts all domain-grounded Turns before local domain/source rows are gone?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Redact by `conversation_turns.domain_id` before domain cleanup | Direct and complete | Must run in delete worker path | domain delete hook |
| Redact by evidence refs only | Finds cited Turns | Misses no-context domain Turns with no refs | evidence-only lookup |
| Skip until P8 audit | Delays required behavior | Violates F-007 | later hook |

Recommendation: redact all `domain_rag` Turns for the Knowledge Domain before local domain cleanup completes.

Patch DATA-001/F-007 spec with:

```text
Domain delete redaction:
  select conversation_turns
  where route = domain_rag
    and domain_id = deleted Knowledge Domain
  redact each affected Turn
  delete/clear its evidence refs
  preserve user_message
```

Patch F-007 test-plan with domain delete -> all domain-grounded Turns redacted.

### D3. Redacted `GET /conversations/{id}` turn summary shape?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Explicit redacted Turn summary | Clear UI state and safe history | Requires API-001 patch | `status=redacted` |
| Hide redacted Turns | Simple UI | Loses user question/history continuity | omit turn |
| Keep answer but mark unavailable | Dangerous | Derived content remains visible | stale answer |

Recommendation: explicit redacted summary.

Patch API-001 with:

```text
Redacted Turn summary:
  status: redacted
  stopReason: redacted
  userMessage: preserved
  assistantAnswer: null
  evidence: []
  citations: []
  safeErrorCode: null
  safeErrorMessage: null or bland redaction message if approved
```

Patch F-007 acceptance with Redaction proof tied to source/domain delete.

## E. Storage/private data blockers

### E1. `conversation_turn_evidence_refs.excerpt` is the only persisted approved excerpt, max bound inherited from P6 or separately named?

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Inherit P6 excerpt bound | Consistent Evidence surface | Must state in DATA/API | 500 chars |
| Separate chat excerpt bound | Flexible | More contract surface | 800 chars |
| Store full Source Block content | Easy citation display | Forbidden storage expansion | full block |

Recommendation: inherit P6 bound: max 500 characters.

Patch DATA-001/API-001 with:

```text
conversation_turn_evidence_refs.excerpt:
  approved safe excerpt only
  maxLength: 500
  same bound as P6 EvidenceItem.excerpt

conversation_turn_evidence_refs.citation_label:
  safe display label
  maxLength: 64
```

Do not persist raw retrieval hit text, full Source Block content, provider payloads, or prompt material.

### E2. No prompt, planning text, provider payload, LightRAG hit, source content, private path, or raw exception text is stored or emitted.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Denylist tests + typed DTOs | Catches regressions and keeps surfaces safe | Needs snapshot maintenance | safe DTO scan |
| Rely on code review | Cheap | Easy to miss stream/log leakage | reviewer memory |
| Store debug blobs privately | Convenient | Violates QA-002 and data ownership | JSON trace blob |

Recommendation: typed DTOs plus safety scans.

Patch F-007 test-plan with:

```text
Safety snapshots scan:
  API responses
  SSE fixtures
  logs captured in tests where available
  evaluation fixtures

Forbidden categories:
  prompt material
  planning/reasoning text
  provider-native payloads
  LightRAG runtime payloads
  private source/block ids in public DTOs
  storage or runtime addresses
  raw exception text
```

Patch DATA-001 with: no generic JSON/debug columns on chat tables.

### E3. Safe counters are persisted; planning text is not.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Persist counters only | Proves budgets without leaking reasoning | Less debug detail | `plan_step_count=3` |
| Persist plan text | Easier debugging | Forbidden by AI-001/QA-002 | plan transcript |
| Persist nothing | Safest | Cannot prove budgets in acceptance | no counters |

Recommendation: persist counters only.

Patch DATA-001 with:

```text
conversation_turns:
  plan_step_count integer not null default 0 check >= 0
  retrieval_operation_count integer not null default 0 check >= 0
  repair_attempt_count integer not null default 0 check >= 0
```

Patch F-007 test-plan with budget tests asserting counters and no planning text.

## F. Authz/roles blockers

### F1. Members and Administrators can manage only their own Conversations.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Owner-filter every route | Matches API-001/PROD-004 | Admin has no global chat read in P7 | `owner_user_id=current_user.id` |
| Admin can read all chats | Operationally useful | Out of scope and privacy risk | admin global read |
| UI-only filtering | Easy | Backend authz violation | client filter |

Recommendation: owner-filter every Conversation route for both roles.

Patch API-001 with: all `/conversations*` queries include owner filter; Administrator has same chat ownership scope as Member in P7.

Patch tests with Member and Administrator own/other-user cases.

### F2. Admin cannot globally read user chat in P7.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| No admin global chat route | Matches F-007 out-of-scope | Admin diagnostics wait for later phase | no route |
| Add admin chat read now | Useful support tool | Explicitly out of scope | `/admin/conversations` |
| Audit-only metadata later | Safer | P8 work | audit events |

Recommendation: no admin global chat read in P7.

Patch F-007 spec/plan with: admin global chat read remains out of scope; P8 may add safe audit metadata only if approved.

### F3. `domain_rag` requires selected available domain; direct route has no domain.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| DB constraint + intent gate | Strong invariant | Requires nullability checks | `domain_id IS NOT NULL` |
| Service-only route check | Easier | DB can drift | if statement only |
| Let direct route carry domain | Convenient UI state | Blurs route ownership | direct with domain |

Recommendation: enforce in DATA-001 and service.

Patch DATA-001 with:

```text
check:
  route = 'domain_rag' -> domain_id IS NOT NULL
  route = 'direct_llm' -> domain_id IS NULL
```

Patch API-001/AI-001 with: direct LLM requests that include a domain but classify as direct are rejected or normalized before Turn creation; choose one in API-001. Recommendation: reject with `422 validation_error` to keep route state explicit.

### F4. Other user's Conversation returns 404, not 403 with ownership detail.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| 404 for missing or not-owned | Avoids ownership disclosure | Less diagnostic detail | `conversation_not_found` |
| 403 for not-owned | Precise | Leaks existence | forbidden |
| 401 | Incorrect for authenticated caller | Bad auth semantics | unauthenticated |

Recommendation: 404 `conversation_not_found`.

Patch API-001 with: `GET`, `DELETE`, and `turns:stream` on a not-owned Conversation return the same 404 as unknown Conversation.

Patch tests with cross-user access for all Conversation routes.

## G. Test/evidence blockers

### G1. OpenAPI snapshot covers Conversation routes and strict turn request validation.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Add snapshot before/with routes | Prevents contract drift | Snapshot maintenance | `f007_openapi.json` |
| Route tests only | Faster | Misses schema drift | status assertions |
| Defer to P9 | Too late | UI will guess | frontend discovery |

Recommendation: add OpenAPI snapshot for P7.

Patch F-007 test-plan with:

```text
OpenAPI snapshot includes:
  GET /conversations
  POST /conversations
  GET /conversations/{conversation_id}
  DELETE /conversations/{conversation_id}
  POST /conversations/{conversation_id}/turns:stream
  strict request schemas
  safe error envelopes
```

### G2. SSE transcripts cover direct success, domain success, no grounded context, evidence-only fallback, validation/auth/duplicate/client cancel.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Raw SSE fixture transcripts | Matches EVT-001 fixture requirement | More fixture files | `direct_success.sse` |
| Unit event projection only | Fast | Does not prove HTTP stream contract | event DTO tests |
| Manual browser check | Useful later | Not enough for P7 backend | manual only |

Recommendation: raw SSE fixture transcripts plus projection unit tests.

Patch EVT-001/F-007 test-plan with fixture list:

```text
direct_llm_success
domain_rag_success
domain_rag_no_grounded_context
domain_rag_evidence_only
validation_error
auth_failure
duplicate_terminal_replay
duplicate_running_conflict
client_cancel_persistence
```

### G3. Orchestrator unit tests prove budgets, closed operations, invalid operation failure, citation validation, and one RetrievalPort.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Unit tests around pure orchestrator policy | Fast and precise | Needs fakes | invalid operation |
| Only integration tests | More realistic | Harder to isolate drift | full stream |
| Trust prompt discipline | No extra tests | Not acceptable | none |

Recommendation: pure unit tests plus one integration path.

Patch F-007 test-plan with:

```text
orchestrator tests:
  closed operation allowlist
  invalid operation fails closed
  plan step budget
  retrieval operation budget
  repair attempt budget
  citation validation failure
  all retrieve_* operations use one RetrievalPort fake
```

### G4. Redaction integration test proves source/domain delete clears derived answer/citations and keeps user question.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Full integration test | Proves data transition across services | More setup | create turn, delete source |
| Unit redaction only | Fast | Misses delete ordering | service-only |
| Defer to P8 | Too late | F-007 AC includes Redaction | later audit |

Recommendation: integration tests for source delete and domain delete.

Patch F-007 test-plan with:

```text
redaction tests:
  create domain_rag Turn with evidence refs
  delete cited Source Document
  assert assistantAnswer null
  assert evidence/citations absent from API response
  assert userMessage preserved

  create domain_rag Turn
  delete Knowledge Domain
  assert same redaction outcome

  create direct_llm Turn
  delete source/domain
  assert direct Turn unchanged
```

### G5. Dependency scan rejects LangChain, LangGraph, FAISS, and second vector-store imports in chat runtime.

| Option | Pros | Cons | Example |
| --- | --- | --- | --- |
| Import/dependency scan in tests | Directly enforces F-007 rejection | Must maintain allowlist | `rg`/AST scan |
| Manual review | Flexible | Easy to miss | checklist |
| Allow behind flags | Future option | Violates P7 contract | disabled imports |

Recommendation: automated dependency scan.

Patch F-007 test-plan with:

```text
Fail P7 tests if chat runtime imports or depends on:
  langchain
  langgraph
  create_agent
  create_react_agent
  StateGraph
  faiss
  direct LightRAG client/runtime
  additional vector-store/retrieval stack
```

Reference docs may remain under `.references/`; runtime code must not import from them.

## Contract Patch Order For Junior Dev

1. Patch `API-001` with Conversation detail Turn summaries, strict title rule, duplicate replay behavior, pre-stream error codes, redacted summary shape, and strict turn request validation.
2. Patch `EVT-001` with exact `evidence`, `done`, and `error` payloads, including `evidenceId`, citation references, `no_grounded_context`, `evidence_only`, duplicate replay, and client-cancel fixture expectations.
3. Patch `DATA-001` with evidence-ref public/private identity rules, excerpt/citation label bounds, running unique index, route/domain check constraints, counters, client-cancel settlement, and Redaction delete ordering.
4. Patch `AI-001` with direct-domain failure behavior, provider-failure terminal split, RetrievalPort intent label rules, and no direct fallback.
5. Patch F-007 `spec.md`, `plan.md`, and `test-plan.md` with the internal `SynthesisGateway`, private mapped Evidence result, static dependency guard, and redaction integration tests.
6. Implement T-010 migrations/models and migration tests.
7. Implement T-020 Conversation CRUD with owner filters.
8. Implement T-030 idempotency and one-running guard.
9. Implement T-040 server intent gate and direct LLM responder.
10. Implement T-050 CE-native TurnOrchestrator and RetrievalPort over P6.
11. Implement T-060 SSE projection with transcript fixtures.
12. Implement T-070 source/domain Redaction hooks.
13. Implement T-080 evaluation fixtures.
14. Run T-900 checks and update acceptance, implementation log, feature register, and traceability.

## Red Flags In PR

| Red flag | Why it is bad | Junior-dev rule |
| --- | --- | --- |
| Route code lands before API-001/EVT-001 payload patches | Public contract drift | Patch contracts first. |
| Browser can send route/model/provider/prompt/tool/retrieval controls | Violates thin-browser and AI-001 | Request body stays strict. |
| Chat route imports LightRAG or parses `CE_BLOCK` | Duplicates P6 ownership | Use RetrievalPort only. |
| P7 uses LangChain/LangGraph/StateGraph adapters | Explicitly rejected by F-007 | CE-native modules only. |
| `fact`, `overview`, `verbatim` become separate retrievers | Creates second retrieval truth | Intent labels over one P6 path. |
| DB transaction stays open during provider/retrieval/SSE | Violates ARCH-004 and risks locks | Use short transactions. |
| Duplicate `clientRequestId` invokes provider/retrieval again | Breaks idempotency AC | Replay or 409 running. |
| Direct LLM answers domain-specific questions | Ungrounded domain behavior | Fail closed without domain. |
| Domain no-Evidence falls back to direct LLM | Violates AI-001 | End `no_grounded_context`. |
| SSE exposes planning text or provider-native chunks | Unsafe public surface | Project EVT-001 product events only. |
| Public citations expose Source Document/Source Block ids | Source-ref contract missing | Use turn-scoped `evidenceId`. |
| Redaction is UI-only | Derived content remains in data | Backend Redaction transition required. |
| Source/domain delete removes rows before Turn redaction can find refs | Redaction becomes impossible | Redact before local cleanup completes. |
| P7 adds chat queue/generic workflow/event bus | Overbuilt and out of scope | No new infra in P7. |

## Context And ADR Notes

`CONTEXT.md` does not need a vocabulary change. It already defines Conversation, Turn, Evidence, Citation, Query Eligibility, and Redaction in the terms P7 needs.

No new ADR is needed now. The architecture is already governed by F-007, API-001, EVT-001, DATA-001, AI-001, ARCH-002, and ADR-002 for vendored LightRAG ownership. A new ADR is needed only if the team proposes a different chat orchestration framework, separate retrieval stack, queue infrastructure, source navigation contract, or public source-ref identity.

Deferred hooks:

- P8 owns audit/tracing expansion beyond safe route/budget counters.
- P9 owns frontend shell, visual parity, and source navigation UI.
- Source navigation remains blocked until an opaque source-ref contract exists.
- Provider failover and background synthesis retry remain out of P7.

## QA

- Readiness question IDs covered: A1, A2, A3, A4, A5, A6, A7, B1, B2, B3, B4, C1, C2, C3, C4, D1, D2, D3, E1, E2, E3, F1, F2, F3, F4, G1, G2, G3, G4, G5.
- Open decisions still blocking coding: exact public acceptance of API-001 Turn summary/replay/error shapes; EVT-001 evidence/done/error payloads; DATA-001 evidence-ref public/private identity and Redaction ordering; AI-001 missing-domain/provider-failure terminal wording.
- Forbidden-string scan result: no credential literals, browser-auth literals, concrete runtime addresses, concrete host filesystem locations, tracebacks, raw provider payloads, raw runtime hit payloads, or raw Source Block text are included. The document names forbidden categories only as exclusion rules.
- Output path written: `.devnotes/P6-post-impl-REVIEW/F-007-P7-reconciled-design-gates.md`.
- Style parity confirmed: Scope, Sources Grilled, Product DNA Locks, Recommended Build Shape, A-G gates, Contract Patch Order, Red Flags, Context/ADR Notes, and QA.
