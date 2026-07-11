# ID-A - Chat turn contract and orchestration boundary (P7 blockers)

Working doc for the P6-to-P7 gate. Canonical patch targets: `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/events/context-engine-sse-v1.md`, `specs/03-contracts/data/context-engine-data.md`, `specs/03-contracts/ai/grounded-answering.md`, `specs/04-features/F-007-grounded-streaming-chat/spec.md`, and the first P7 migrations/services/tests.

Sources grilled: AGENTS.md, README.md, constitution, CONTEXT.md, DESIGN.md, F-006 spec/plan/tasks/test-plan/acceptance/implementation log, F-007 spec/plan/tasks/test-plan/acceptance/implementation log/ux, API-001, EVT-001, DATA-001, AI-001, PROD-001/002/003/004, ARCH-002/003/004, QA-001/002/003/004/005, TRACE-001, `context_engine/services/evidence.py`, `context_engine/services/indexing.py`, `context_engine/api/routes.py`, `context_engine/models.py`, `tests/test_scoped_evidence_retrieval.py`, `.devnotes/controllable-rag-intergration-plan-v1/`, and `.references/controllable-rag-fastapi-replication-pkg/` control/API/test docs.

**Related docs**

| Doc | Scope |
| --- | --- |
| [ID-A-turn-api-and-data.md](./ID-A-turn-api-and-data.md) | conversation/turn/evidence-ref schema, API DTOs, idempotency, running guard |
| [ID-A-sse-projection-and-citations.md](./ID-A-sse-projection-and-citations.md) | EVT-001 event payloads, evidence event ids, citation references, terminal events |
| [ID-A-orchestrator-retrieval-port.md](./ID-A-orchestrator-retrieval-port.md) | CE-native TurnOrchestrator, typed middleware, RetrievalPort over P6 |
| [ID-A-direct-llm-intent-gate.md](./ID-A-direct-llm-intent-gate.md) | server-classified direct LLM vs domain RAG route rules |
| [ID-A-redaction-and-delete-hooks.md](./ID-A-redaction-and-delete-hooks.md) | source/domain delete redaction for derived answers and citations |

---

## Lean Winner

```text
Patch exact P7 public shapes first
+ add conversation/turn/evidence-ref tables with constraints
+ implement owner-scoped Conversation CRUD
+ implement ChatTurnService idempotency and one-running guard
+ classify route server-side
+ direct_llm: trusted synthesis profile, no retrieval, no citations
+ domain_rag: CE-native TurnOrchestrator
+ RetrievalPort wraps F-006 retrieve_scoped_evidence()
+ EVT-001 product SSE projection only
+ redaction hooks clear derived answer/citations and keep user questions
```

This is the lowest-entropy path that satisfies F-007 without reopening P6 evidence mapping or importing a second RAG stack.

---

## Rejected Alternatives

| Alternative | Reject because |
| --- | --- |
| Browser chooses `direct_llm` or `domain_rag` | AI-001 says route is server-owned. |
| Browser sends model/provider/prompt/top-k/tool controls | API-001 and AI-001 forbid control fields. |
| Chat route calls LightRAG directly | ARCH-002 says chat must enter retrieval through P6 RetrievalPort. |
| Re-parse `CE_BLOCK` markers in chat code | P6 owns marker parsing and mapping. |
| Add separate fact/overview/verbatim retrievers | AI-001 says these are labels over one physical P6 retriever. |
| Add FAISS or second vector store | F-007 out-of-scope rejects it. |
| Use LangChain/LangGraph adapters in P7 runtime | F-007 and ARCH-002 explicitly reject them for this phase. |
| Stream provider-native events to browser | EVT-001 requires product events only. |
| Persist planning text or provider payloads for debugging | DATA-001 and QA-002 allow safe counters, not private payloads. |
| Ship chat without redaction hooks | BR-010, DATA-001, and F-007 AC require source/domain redaction. |

---

## Grill Tree - Decisions Resolved Or Required

```text
Can P7 start coding?
  -> Only after A1/A2 public DTO and SSE payload gaps are patched or explicitly confirmed.

Is P6 ready as dependency?
  -> Yes. F-006 acceptance says implemented; code exposes retrieve_scoped_evidence().

Where does chat state live?
  -> conversation_turns, not query logs or UI state.

Who chooses route?
  -> Server intent gate only.

How does domain RAG retrieve?
  -> RetrievalPort -> F-006 callable -> private LightRAG/P6 mapping.

Can citation refs expose Source Block ids?
  -> No. Use current-turn Evidence reference identity, not source/block ids.

Can no Evidence fall back to direct LLM?
  -> No. It ends as no_grounded_context.

Can provider failure after Evidence expose raw provider error?
  -> No. It ends as evidence_only or another safe terminal named by EVT-001.
```

---

## A1 - Conversation, Turn, And Idempotency Contract

DATA-001 gives the table set and core constraints:

| Table | Required ownership |
| --- | --- |
| `conversations` | owner-scoped container with safe title and timestamps |
| `conversation_turns` | route/status/stop_reason, client idempotency, user question, safe answer, counters |
| `conversation_turn_evidence_refs` | private FKs for redaction/citation validation plus safe citation label/excerpt |

Required before route code:

| Surface | Required decision |
| --- | --- |
| Turn summary DTO | Exact fields returned by `GET /conversations/{id}`. |
| Duplicate completed request | Exact response/replay behavior and whether a new SSE transcript is reconstructed. |
| Duplicate running request | Exact conflict/replay behavior. |
| Partial unique running Turn | Migration proof on target DB. |
| Terminal settlement | Exact status/stop_reason for disconnect, provider failure, budget exhaustion, citation failure. |

Decision: data ownership is settled, but full public replay/summary shape is still a contract blocker.

---

## A2 - SSE Projection And Citation Identity

EVT-001 names event types and ordering:

```text
stage
evidence
token
done
error
```

It also says `evidence` precedes grounded answer tokens for `domain_rag`, direct LLM emits no `evidence`, and exactly one terminal event is emitted.

Missing exact shape:

| Surface | Missing field-level decision |
| --- | --- |
| `evidence` payload | Public evidence reference id, excerpt, source label, optional citation label. |
| `done.citations` | How citations reference current-turn Evidence without source/block ids. |
| terminal payloads | Exact `done` vs `error` split for `no_grounded_context`, `evidence_only`, cancel, and validation failure. |
| duplicate request | Whether replayed SSE uses original event ids or a compact terminal payload. |

Recommended patch: use an opaque turn-scoped Evidence reference id from `conversation_turn_evidence_refs.id` or a derivative explicitly approved by API-001/EVT-001. Do not use Source Document id or Source Block id.

---

## A3 - Orchestrator And RetrievalPort Boundary

AI-001 and ARCH-002 resolve the architecture:

```text
TurnOrchestrator
  -> closed operations:
       retrieve_fact
       retrieve_overview
       retrieve_verbatim
       answer_from_evidence
  -> typed middleware:
       budget
       allowlist
       evidence safety
       verifier
       citation validator
       SSE projector
  -> RetrievalPort.retrieve(domain_id, query, intent, policy)
       -> F-006 retrieve_scoped_evidence()
```

Decision: implement CE-native modules and tests. Do not use LangChain, LangGraph, `create_agent`, `create_react_agent`, `StateGraph`, FAISS, another vector store, or a framework adapter.

`fact`, `overview`, and `verbatim` may affect server-owned query shaping only. They do not create endpoints, stores, runtimes, retrievers, browser controls, or marker parsers.

---

## A4 - Direct LLM And Provider Stream

Direct LLM is allowed only for non-domain general chat. It must:

```text
use server-resolved synthesis profile
omit retrieval
omit Evidence
omit citations
avoid domain/source claims
persist route = direct_llm
emit stage/token/done or safe error
```

Required before coding:

| Surface | Required decision |
| --- | --- |
| Intent fixtures | Direct greetings/writing help vs domain-specific/ambiguous questions. |
| Missing domain behavior | Exact error/terminal when the message needs a Knowledge Domain. |
| Provider gateway | Stream adapter over trusted runtime config, with safe failures only. |
| Context policy | Bounded prior user questions only; no prior assistant answers in prompt per AI-001. |

Do not use direct LLM as fallback for domain questions with missing Evidence.

---

## A5 - Redaction Hooks

DATA-001 and BR-010 require:

```text
source/domain delete
  -> redact derived assistant answer/citations
  -> preserve user_message
```

Required before delete/chat convergence:

| Surface | Required decision |
| --- | --- |
| Source delete order | Redact affected turns before deleting source/block rows or keep enough private refs to find them. |
| Domain delete order | Redact all domain-grounded turns for that Knowledge Domain. |
| Redacted API DTO | Safe turn summary shape after redaction. |
| Evidence refs | Delete, mark, or clear refs as approved by DATA-001/API-001. |

Decision: do not treat redaction as a UI hide. It is a server-side data transition with tests.

---

## Single-Source Functions

```text
turn_can_start(conversation) =
  authenticated user owns conversation
  AND no existing conversation_turn.status == running
  AND client_request_id is new for that conversation
```

```text
domain_rag_turn_allowed(domain, message) =
  server intent gate classifies as domain_rag
  AND domain_id is present
  AND domain is available by backend rules
```

```text
direct_llm_turn_allowed(message) =
  server intent gate classifies as non-domain general chat
  AND domain_id is absent
```

```text
redact_turn(turn) =
  turn.route == domain_rag
  AND turn cited affected Source Document or Knowledge Domain
  -> clear assistant_answer
  -> remove/clear citation evidence refs
  -> status = redacted
  -> stop_reason = redacted
  -> keep user_message
```

---

## Entity/Data Diagram

```text
users
  |
  +-- conversations
        owner_user_id
        |
        +-- conversation_turns
              client_request_id unique per conversation
              route/status/stop_reason
              domain_id nullable by route
              user_message
              assistant_answer
              safe counters
              |
              +-- conversation_turn_evidence_refs
                    private source_document_id
                    private source_block_id
                    citation_label
                    excerpt

domains/source_documents/source_blocks
  |
  +-- redaction lookup for cited Turns
```

---

## Junior Dev - Do This Order

1. Patch or confirm API-001/EVT-001 for turn summaries, evidence payloads, citations, duplicate replay, terminal events, and safe errors.
2. Add migration/model tests for Conversation, Turn, and EvidenceRef tables and constraints.
3. Implement Conversation CRUD with owner filters.
4. Implement ChatTurnService idempotency and one-running guard.
5. Implement strict request validation rejecting browser control fields.
6. Implement server intent gate fixtures.
7. Implement direct LLM stream through trusted synthesis profile.
8. Implement RetrievalPort as the only wrapper over P6 `retrieve_scoped_evidence()`.
9. Implement CE-native TurnOrchestrator and middleware.
10. Implement EVT-001 projection and transcript fixtures.
11. Implement redaction hooks.
12. Run F-007 test plan and update acceptance, implementation log, feature register, and traceability.

---

## Red Flags In PR

- Route code lands before exact SSE evidence/citation payload shape is approved.
- Browser can send route, model, provider, prompt, tool, top-k, hidden filter, or retrieval mode.
- Chat imports `LocalLightRAGIndexClient` or parses `CE_BLOCK` directly.
- `fact`, `overview`, and `verbatim` become separate retrievers or vector stores.
- LangChain, LangGraph, FAISS, or adapter placeholders appear in P7 chat runtime.
- Provider stream runs while a DB transaction is held.
- Duplicate `clientRequestId` calls provider or retrieval twice.
- Direct LLM answers domain-specific questions without a selected Knowledge Domain.
- No Evidence falls back to direct LLM.
- SSE emits planning text, prompt text, provider-native chunks, private ids, or raw runtime payloads.
- Source/domain delete leaves derived answers or citation rows visible.

---

## Tests To Write

- Migration: fresh upgrade creates Conversation/Turn/EvidenceRef constraints, including unique `(conversation_id, client_request_id)` and one running Turn per Conversation.
- API: owner CRUD, other-user 404, strict request validation, forbidden control fields -> 422.
- Idempotency: duplicate request returns existing result and does not invoke provider/retrieval twice.
- Concurrency: second running Turn -> 409.
- Intent gate: direct general chat omits retrieval; domain-specific/ambiguous without domain fails closed.
- RetrievalPort: `fact`, `overview`, and `verbatim` all call the same P6 callable.
- Orchestrator: invalid operation/plan fails closed; budgets stop loops.
- SSE fixtures: direct success, domain success, no grounded context, evidence-only fallback, validation/auth/duplicate/client cancel.
- Citation validation: final citations reference current-turn evidence refs only.
- Redaction: source/domain delete clears derived answer/citations and preserves user question.
- Dependency scan: no LangChain, LangGraph, FAISS, second vector-store, or direct LightRAG imports in chat runtime.
- Safety snapshots: API/SSE/log fixtures contain no private payloads or unsafe internal details.

Still needs ID-B only if provider gateway streaming requires a public contract change beyond safe terminal events, or if source navigation is pulled into P7. Source navigation should stay blocked until F-009 source-ref contract work.

Next grill session: patch API-001/EVT-001 for turn replay, evidence event identity, citations, and terminal payloads; then start T-010 migration tests.
