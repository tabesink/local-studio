# ID-A - Orchestrator and RetrievalPort boundary (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-007-grounded-streaming-chat/spec.md`, `specs/03-contracts/ai/grounded-answering.md`, `specs/02-architecture/component-boundaries.md`, `context_engine/services/evidence.py`, `.references/controllable-rag-fastapi-replication-pkg/docs/04-query-control-graph.md`, `.references/controllable-rag-fastapi-replication-pkg/docs/06-target-fastapi-architecture.md`.

**Question:** Should P7 copy the controllable-RAG reference stack or wire a framework agent?

## Decision

No. Use a CE-native `TurnOrchestrator` with a statically registered typed middleware chain and one `RetrievalPort` over the F-006 callable.

The reference control graph is evidence for shape. It is not authority for dependencies, routes, event names, or retrievers.

## Why

| Bad path | Good path |
| --- | --- |
| Import LangChain/LangGraph to get an agent loop quickly. | Plain Python orchestration with explicit budgets and tests. |
| Create separate fact/overview/verbatim retrievers. | Use intent labels over one P6 RetrievalPort. |
| Let browser choose tools or retrieval mode. | Server-owned closed operations only. |
| Parse `CE_BLOCK` in chat. | Call F-006 mapper through RetrievalPort. |
| Stream tool traces to UI. | Project safe EVT-001 product events only. |

## Exact Implementation Sketch

```text
context_engine/chat/
  contracts.py       TurnState, TurnOutcome, safe progress DTOs
  service.py         owner filters, idempotency, persistence order
  intent.py          server route classification
  orchestrator.py    direct_llm and domain_rag execution
  retrieval.py       RetrievalPort over F-006
  policy.py          budgets, allowed operations, intent labels
  events.py          internal progress -> EVT-001
  citations.py       current-turn citation validation
  providers.py       synthesis stream adapter over trusted config
```

Allowed domain RAG operations:

```text
retrieve_fact
retrieve_overview
retrieve_verbatim
answer_from_evidence
```

All `retrieve_*` operations call:

```text
RetrievalPort.retrieve(domain_id, query, intent, policy)
  -> retrieve_scoped_evidence(db, settings, domain_id, question)
```

The `intent` value may shape the server-owned query or policy. It must not select a different runtime, store, endpoint, marker parser, or browser-visible control.

## Budgets

P7 needs server-owned budgets for:

```text
plan steps
retrieval operations
repair attempts
turn timeout
concurrent advanced turns
```

Budget exhaustion maps to `turn_budget_exhausted` or another approved safe terminal. It must not emit partial unsupported answer claims.

## Implementation Order

1. Add `RetrievalPort` tests first.
2. Prove `fact`, `overview`, and `verbatim` all call the same P6 path.
3. Add operation allowlist tests.
4. Add budget exhaustion tests.
5. Add citation validator tests before provider streaming.
6. Implement direct mode and one simple domain RAG path.
7. Add advanced loop only after simple path, SSE projection, and fixtures pass.
8. Add dependency scan rejecting framework/vector-store drift.

## Red Flags In PR

- Chat runtime imports `lightrag`, `LocalLightRAGIndexClient`, or marker parser internals directly.
- New FAISS, vector-store, retriever, or retrieval endpoint appears.
- `fact`, `overview`, and `verbatim` have separate clients.
- LangChain/LangGraph imports or adapter placeholders appear in P7 runtime.
- Middleware is dynamically selected by browser input.
- Invalid operation becomes a best-effort provider answer.
- Budget exhaustion still streams answer tokens.
- Orchestrator owns HTTP/SSE response objects directly instead of progress DTOs.

## Tests

- Unit: invalid operation fails closed.
- Unit: budget exhaustion returns approved terminal.
- Unit: middleware order is static and server-owned.
- Unit/integration: all retrieval intents call one RetrievalPort implementation.
- Integration: domain RAG no Evidence returns no-grounded-context, not direct LLM.
- Dependency scan: no LangChain, LangGraph, FAISS, second vector-store, or direct LightRAG imports in chat runtime.
- SSE fixture: internal progress projects only allowed EVT-001 events.

## One-line summary

Copy the reference graph's discipline, not its dependencies; P7 retrieval is one P6 port with three server-owned intent labels.
