# F-007 / P7 - Agentic Chat And Streaming

Goal: create owner-scoped conversations where each Turn is server-classified as either narrow direct LLM general chat or advanced domain RAG, then streamed through safe Context Engine SSE events.

Not in P7: team/shared conversations, admin global chat read, old-turn semantic search, summary/compaction workflow, prompt editor, model picker, provider failover, chat worker/queue, source navigation UI, browser tools, LangChain/LangGraph adapters, separate retrievers, FAISS recreation, second vector store, or a duplicate retrieval endpoint.

---

## Big Picture

```text
Member/Admin
  |
  v
POST /api/v1/conversations/{conversation_id}/turns:stream
  |
  +-- ChatTurnService
  |     +-- owner filter
  |     +-- clientRequestId idempotency
  |     +-- one running Turn per Conversation
  |     +-- persist running Turn
  |
  +-- server intent gate
        |
        +-- direct_llm
        |     +-- trusted synthesis profile
        |     +-- no retrieval, no Evidence, no citations
        |
        +-- domain_rag
              +-- selected available Knowledge Domain
              +-- CE-native TurnOrchestrator
              +-- typed middleware and closed operations
              +-- RetrievalPort -> F-006 retrieve_scoped_evidence()
              +-- citation validation
  |
  v
EVT-001 product SSE: stage, evidence, token, done, error
  |
  v
conversation_turns + conversation_turn_evidence_refs
```

Browser sends message, optional `domainId`, and `clientRequestId`. Server owns route, model/profile, prompt, retrieval intent, budgets, tools, citation validation, and terminal state.

---

## What A Turn Means Here

A Conversation is an owner-scoped chat container. A Turn is one user question plus one response attempt.

For P7:

```text
Turn route:
  direct_llm  -> no Knowledge Domain, no Evidence, no citations
  domain_rag  -> exactly one Knowledge Domain, current-turn Evidence, citations

Turn status:
  running | completed | failed | redacted

Turn stop reason:
  direct_llm | grounded | no_grounded_context | evidence_only
  | turn_budget_exhausted | provider_failure
  | citation_validation_failed | cancelled | redacted
```

Citation is not source navigation. Citations must point to current-turn Evidence references only. Public payloads must not expose private Source Block or Source Document ids.

---

## P6 Dependency Gate

| Gate | Current review result |
| --- | --- |
| F-006 status | `feature-register.md`, `acceptance.md`, and `implementation-log.md` say implemented. |
| Evidence callable | `retrieve_scoped_evidence()` exists in `context_engine/services/evidence.py`. |
| Marker parser | Strict `CE_BLOCK` parser exists and rejects missing, malformed, and multiple markers. |
| Query eligibility | P6 calls `source_is_query_eligible()` before retrieval and during mapping. |
| Safe DTO | API returns only `excerpt` and `sourceLabel`. |
| P6 tests | `tests/test_scoped_evidence_retrieval.py` records 7 focused tests; F-006 acceptance records full suite pass. |
| Durable Evidence table | Intentionally absent in P6; P7 owns turn-scoped evidence references. |
| P7 code | No conversation, turn, SSE, or orchestrator implementation found yet. |

Decision: P6 is a usable dependency for P7. P7 must wrap it through a `RetrievalPort`; do not duplicate marker parsing, query eligibility, or LightRAG client access in chat route code.

---

## Build Order From `tasks.md`

```text
T-000  read docs/contracts/feature folder
T-010  add conversation, turn, and evidence-ref migrations/constraints
T-020  implement conversation CRUD with owner filters
T-030  implement turn idempotency and one-running-turn guard
T-040  implement server intent gate and direct LLM responder
T-050  implement CE-native TurnOrchestrator + RetrievalPort
T-060  implement Context Engine SSE endpoint
T-070  implement source/domain redaction hooks
T-080  add direct, no-evidence, single-hop, multi-hop, invalid-operation fixtures
T-900  run test-plan.md
T-910  update acceptance, implementation log, and traceability
```

Do not start T-050/T-060 until the turn data/API/SSE contract blockers in ID-A are resolved.

---

## Lifecycle Flows

### Conversation CRUD

```text
GET /conversations
POST /conversations
GET /conversations/{conversation_id}
DELETE /conversations/{conversation_id}

All rows are filtered by owner_user_id.
Other user's Conversation returns 404.
```

### Stream Turn

```text
validate request
  -> owner Conversation
  -> optional selected Knowledge Domain
  -> reject forbidden controls
  -> duplicate clientRequestId?
  -> one running Turn?
  -> persist running Turn
  -> classify route
  -> run direct_llm or domain_rag
  -> emit safe SSE
  -> persist terminal state
```

### Direct LLM

```text
non-domain general chat
  -> resolve active synthesis profile once
  -> bounded conversation context without Evidence
  -> stage/token/done or error
  -> route = direct_llm
  -> no evidence refs
```

### Domain RAG

```text
domain-specific or ambiguous knowledge question
  -> require selected available Knowledge Domain
  -> TurnOrchestrator
  -> retrieve_fact | retrieve_overview | retrieve_verbatim
  -> same RetrievalPort -> P6 callable
  -> evidence before answer tokens
  -> citation validation
  -> done grounded | no_grounded_context | evidence_only | safe failure
```

### Delete/Redaction

```text
source/domain delete
  -> block future query eligibility
  -> find domain-grounded Turns that cited affected Source Document/Block
  -> clear assistant_answer
  -> remove or redact evidence refs
  -> status/stop_reason = redacted
  -> keep user_message
```

---

## Layer Ownership

| Layer | Owns | Must not own |
| --- | --- | --- |
| API route | HTTP validation, auth dependency, SSE response surface | orchestration policy, direct LightRAG calls, provider internals |
| ChatTurnService | owner filters, idempotency, running guard, persistence order, terminal mapping | prompt text ownership, retrieval parsing |
| Intent gate | server classification of `direct_llm` vs `domain_rag` | browser-selected route |
| TurnOrchestrator | direct LLM or domain RAG execution for one request | DB transaction lifetime, UI assumptions |
| RetrievalPort | single chat entry into F-006 evidence callable | separate retrievers, marker parsing fork, direct API route concerns |
| Middleware | budget, allowlist, evidence safety, verifier, citation validator, SSE projection | plugin system, browser-selected order |
| Provider gateway | trusted synthesis profile resolution and stream adapter | public provider payloads or model picker |
| Worker/delete hooks | source/domain redaction side effects | query-time masking only |
| Frontend later | render API/SSE truth | route/model/retrieval/tool selection |

---

## Questions MUST Answer Before Coding

### A. Contract/data/API blockers

| # | Question | Owner patch |
| --- | --- | --- |
| A1 | Exact `GET /conversations/{id}` turn-summary DTO fields? | API-001 |
| A2 | Exact duplicate `clientRequestId` replay behavior for completed, failed, and currently running Turns? | API-001 + DATA-001 |
| A3 | Exact SSE `evidence` payload shape and public evidence reference id used by `done.citations`? | EVT-001 + API-001 |
| A4 | Does `no_grounded_context` end as `done` or `error` in SSE? Exact body? | EVT-001 |
| A5 | Does provider failure after Evidence end as `done` with `evidence_only` or `error` with partial Evidence? | EVT-001 + AI-001 |
| A6 | Exact title validation/generation rule for `POST /conversations`? | API-001 |
| A7 | Exact safe error codes for one running Turn, duplicate request, invalid domain, and route classification failure? | API-001 |

### B. Runtime/controller/private integration blockers

| # | Question | Owner patch |
| --- | --- | --- |
| B1 | Provider stream adapter API for active synthesis profile? | F-007 implementation + API-001 if public behavior changes |
| B2 | RetrievalPort return type with P6 Evidence plus turn-scoped citation refs? | ID-A + DATA-001 |
| B3 | How do `fact`, `overview`, and `verbatim` shape queries without creating separate retrievers? | AI-001 + implementation tests |
| B4 | What is the exact import/dependency guard that rejects LangChain/LangGraph in chat runtime? | F-007 test plan |

### C. Worker/concurrency/idempotency blockers

| # | Question | Owner patch |
| --- | --- | --- |
| C1 | Partial unique running Turn is enforced by migration on target DB? | DATA-001 + migration test |
| C2 | No DB transaction is held during provider or LightRAG calls or SSE streaming? | ARCH-004 + implementation tests |
| C3 | Client disconnect aborts provider stream and settles `running` safely. What status/stop_reason? | EVT-001 + DATA-001 |
| C4 | Duplicate request while original is still streaming returns what behavior? | API-001 |

### D. Delete/redaction/destructive-state blockers

| # | Question | Owner patch |
| --- | --- | --- |
| D1 | Source delete redaction runs before Source Block rows disappear, or refs keep enough private identity? | DATA-001 + worker/delete service |
| D2 | Domain delete redacts all domain-grounded Turns before local domain/source rows are gone? | DATA-001 + worker/delete service |
| D3 | Redacted `GET /conversations/{id}` turn summary shape? | API-001 |

### E. Storage/private data blockers

| # | Question | Owner patch |
| --- | --- | --- |
| E1 | `conversation_turn_evidence_refs.excerpt` is the only persisted approved excerpt, max bound inherited from P6 or separately named? | DATA-001 + API-001 |
| E2 | No prompt, planning text, provider payload, LightRAG hit, source content, private path, or raw exception text is stored or emitted. | QA-002 + tests |
| E3 | Safe counters are persisted; planning text is not. | DATA-001 |

### F. Authz/roles blockers

| # | Question | Owner patch |
| --- | --- | --- |
| F1 | Members and Administrators can manage only their own Conversations. | API route tests |
| F2 | Admin cannot globally read user chat in P7. | API route tests |
| F3 | `domain_rag` requires selected available domain; direct route has no domain. | API-001 + AI-001 |
| F4 | Other user's Conversation returns 404, not 403 with ownership detail. | API-001 tests |

### G. Test/evidence blockers

| # | Question | Owner patch |
| --- | --- | --- |
| G1 | OpenAPI snapshot covers Conversation routes and strict turn request validation. | tests/snapshots |
| G2 | SSE transcripts cover direct success, domain success, no grounded context, evidence-only fallback, validation/auth/duplicate/client cancel. | EVT-001 fixture requirement |
| G3 | Orchestrator unit tests prove budgets, closed operations, invalid operation failure, citation validation, and one RetrievalPort. | F-007 tests |
| G4 | Redaction integration test proves source/domain delete clears derived answer/citations and keeps user question. | F-007 tests |
| G5 | Dependency scan rejects LangChain, LangGraph, FAISS, and second vector-store imports in chat runtime. | F-007 tests |

---

## Acceptance Criteria As Definition Of Done

| AC | Done means |
| --- | --- |
| AC-001 | CRUD routes filter by owner and other-user access returns 404. |
| AC-002 | Server intent gate routes direct general chat without domain and requires domain for domain-specific questions. |
| AC-003 | Second running Turn in the same Conversation returns contracted 409. |
| AC-004 | Duplicate `clientRequestId` does not call provider/retrieval twice and returns the contracted existing result. |
| AC-005 | Domain RAG with no Evidence returns `no_grounded_context` and no answer fabrication. |
| AC-006 | Provider failure after Evidence returns `evidence_only` safely. |
| AC-007 | Client disconnect aborts upstream stream and clears running state. |
| AC-008 | Browser-sent provider/model/prompt/retrieval/tool fields return 422. |
| AC-009 | Direct LLM has no retrieval, Evidence, or citations. |
| AC-010 | Domain no-evidence case never falls back to direct LLM. |
| AC-011 | Advanced RAG is CE-native, closed over allowed operations/budgets, and fails invalid plans closed. |
| AC-012 | `stage` events expose labels only, never planning text or reasoning. |
| AC-013 | `fact`, `overview`, and `verbatim` are intent labels over one RetrievalPort/P6 path. |

---

## What Junior Dev Should Read

1. `AGENTS.md`
2. `README.md`
3. `specs/00-governance/constitution.md`
4. `CONTEXT.md`
5. `specs/04-features/F-006-scoped-evidence-retrieval/acceptance.md`
6. `specs/04-features/F-006-scoped-evidence-retrieval/implementation-log.md`
7. `specs/04-features/F-007-grounded-streaming-chat/`
8. `specs/03-contracts/api/context-engine-v1.md`
9. `specs/03-contracts/events/context-engine-sse-v1.md`
10. `specs/03-contracts/data/context-engine-data.md`
11. `specs/03-contracts/ai/grounded-answering.md`
12. `specs/02-architecture/component-boundaries.md`
13. `context_engine/services/evidence.py`
14. `tests/test_scoped_evidence_retrieval.py`
15. `.devnotes/P6-post-impl-REVIEW/ID-A.md`

---

## Practical Start Checklist

- Patch or confirm API-001/EVT-001 for full turn-summary, evidence event, citation, duplicate, and terminal payload shapes.
- Add migrations/models for `conversations`, `conversation_turns`, and `conversation_turn_evidence_refs`.
- Add constraints before service code: owner FK, unique `(conversation_id, client_request_id)`, partial unique running Turn, route/status/stop_reason checks, domain nullability checks.
- Implement Conversation CRUD with owner filters.
- Implement idempotent Turn creation and one-running guard before provider or retrieval calls.
- Wrap P6 `retrieve_scoped_evidence()` in one RetrievalPort.
- Implement direct route and domain route as server decisions only.
- Emit EVT-001 product events, not provider-native events.
- Persist only safe answer/evidence/counter fields.
- Add redaction hooks before source/domain delete can ship with chat history.
- Update OpenAPI snapshot, SSE transcripts, acceptance, implementation log, and traceability.

---

## Reference Comparison

| Question | Reference answer | Greenfield delta |
| --- | --- | --- |
| Turn endpoint | Reference package proposes `/api/v1/chat/turns:stream`. | API-001 target is `/api/v1/conversations/{conversation_id}/turns:stream`. |
| Control loop | Reference control graph has plan/retrieve/replan/verify loops. | Keep the bounded loop shape, but implement CE-native modules only. |
| Retrieval intents | Reference uses fact/overview/verbatim operations. | CE keeps these as intent labels over one P6 RetrievalPort, not separate retrievers. |
| Framework | Some advisory notes discuss LangChain/LangGraph patterns. | F-007 rejects LangChain/LangGraph adapters in this phase. |
| SSE event names | Reference names `turn.started`, `stage.changed`, `answer.delta`. | EVT-001 names `stage`, `evidence`, `token`, `done`, `error`. |
| Evidence identity | Reference exposes rich source/citation metadata. | CE needs turn-scoped citation refs without public source/block ids or source navigation. |
| UI shell | Reference chat shell maps SSE to messages and context panel. | P7 owns backend/API/SSE; P9 ports/restyles UI later. |

What reference code answers well:

| Area | Useful evidence |
| --- | --- |
| Orchestration shape | Bounded plan/retrieve/replan/final-answer loop. |
| SSE projection | Product progress events should hide provider-native stream internals. |
| Evaluation | Fixtures should include direct, no-context, multi-hop, invalid operation, budget exhaustion, and redaction cases. |

What reference code does not answer:

| Area | Gap |
| --- | --- |
| CE_BLOCK mapping | Context Engine exact Source Block identity is greenfield-specific and already proven in P6. |
| CE route names | API-001 supersedes reference endpoint names. |
| P7 framework policy | F-007 forbids framework adapters even if advisory notes mention them. |
| Redaction contract | CE delete/redaction rules come from DATA-001 and business rules, not the reference. |

Verdict for junior dev: use the reference for control-flow intuition only. Implement against F-007, API-001, EVT-001, DATA-001, AI-001, and the P6 callable.

One-line summary: P7 is ready to implement after the turn/SSE/citation replay shapes are patched or confirmed; do not invent those shapes in route code.
