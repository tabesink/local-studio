---
id: ARCH-002
title: Component Boundaries
status: approved
owner: Context Engine architecture team
last_reviewed: 2026-07-06
depends_on: [ARCH-001]
supersedes: []
---

# Component Boundaries

## Composition Roots

- API: FastAPI app factory/composition root.
- Worker: one Postgres-backed worker process for domain delete, source prep, indexing, remote cleanup, and redaction hooks.
- Controller: private lifecycle component with Docker/runtime access.
- Frontend: Next.js App Router with route groups and feature modules. **Port** shell/routes from `.references/code/context-engine/client/`; **restyle** with Local Studio per `F-009/ce-client-port-and-parity.md` and `F-009/context-panel-tabs.md`.

## Dependency Direction

```text
Next route/layout -> feature UI/controller -> typed API/SSE client -> FastAPI
FastAPI route -> service/use case -> repository/client -> Postgres/storage/controller/provider/LightRAG
Worker loop -> lease/claim -> service -> repository/client
```

## Boundary Table

| Component | Responsibility | Owns | Forbidden |
| --- | --- | --- | --- |
| Shared UI primitives | presentational controls | styling/accessibility primitives | raw fetch, role decisions, business state |
| Frontend feature modules | route behavior, form state, DTO mapping | endpoint wrappers and local interaction state | secret handling, direct runtime/provider access |
| API routes | validation/authz/error envelope | HTTP contract surface | Docker socket, raw provider leakage |
| Services | business rules and lifecycle orchestration, including chat turn routing and agentic RAG orchestration | state transitions and safe DTOs | UI assumptions, duplicated ownership |
| Repositories | persistence access | DB reads/writes | business decisions outside transactional helpers |
| Worker | async resource work | leases, retries, cleanup | generic job platform or separate queue infra |
| Controller | private runtime lifecycle | Docker/runtime details | public/browser routes |
| LightRAG client | retrieval/index calls and native lifecycle guard | private provider interaction, process-global native LightRAG lifecycle serialization | UI DTOs, product state ownership, or unproven per-domain native concurrency |
| Vendored LightRAG runtime (`vendor/lightrag/`) | native indexing/retrieval runtime and KG prompt ownership | pinned upstream copy with surgical CE edits | direct API routes, browser access, pip-only runtime source |

## Vendored LightRAG Runtime

Private LightRAG integration must use an editable vendored copy at `vendor/lightrag/` per ADR-002. `.references/code/lightrag/` is read-only evidence only. Planned knowledge-graph prompt modifications belong in the vendored tree (mainly `prompt.py`), not in unpinned PyPI installs of `lightrag-hku`.

Context Engine's production native adapter is `LightRAGClient`. It serializes native `vendor/lightrag/1.4.16` lifecycle operations process-wide because the vendored runtime uses module-level shared storage initialization/finalization state. Per-domain native lifecycle locking is a later-phase optimization and requires an explicit concurrency proof against the pinned vendored tree before different Knowledge Domains may run native LightRAG work concurrently inside one process.

## Chat Orchestration Boundary

F-007 chat code must keep one server-side entry into retrieval: the P6 Evidence callable wrapped by a `RetrievalPort`. The chat route owns HTTP/SSE only; `ChatTurnService` owns authz, pre-claim validation, idempotency, persistence order, replay from persisted safe fields, and terminal mapping; `TurnOrchestrator` owns the request-scoped direct LLM or advanced agentic RAG execution. Pre-stream validation and idempotency failures return canonical JSON errors before `text/event-stream` is opened. The advanced RAG path is CE-native and may use only a statically registered typed middleware chain for budgets, allowlists, evidence safety, verification, citation validation, and SSE projection. Browser code never selects operations, model, provider, top-k, prompts, middleware, or orchestration mode. `fact`, `overview`, and `verbatim` are logical intent labels over one P6/LightRAG retriever, not separate retrievers or stores. The RetrievalPort may return private mapped Evidence only inside backend services for citation validation/redaction; public DTOs expose only turn-scoped evidence refs. LangChain/LangGraph adapters are not an approved boundary for F-007.
