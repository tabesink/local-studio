# Agent Guidance — Controllable RAG FastAPI Rebuild

## Mission

Implement the target described in `docs/06-target-fastapi-architecture.md`. Preserve the **control model**, not the upstream notebook structure.

## Truth labels

- **OBSERVED**: directly supported by upstream code.
- **INFERRED**: reasonable reading of code flow; verify before relying on it.
- **PROPOSED**: required target design, not present upstream.
- **REJECTED**: deliberately excluded from this rebuild.

## Guardrails

1. Do not import upstream code into application routes.
2. Do not expose planning text, model reasoning, private prompts, or hidden source paths to the browser.
3. Do not permit retrieval beyond the current authorized domain.
4. Do not create a second semantic-index system beside the approved retrieval runtime.
5. Do not build Redis, Celery/RQ, a generic workflow engine, WebSockets, provider failover, microservices, or a separate agent service for this package.
6. Use typed Pydantic DTOs at route boundaries; keep ORM models inside persistence modules.
7. One responsibility per module. Routes validate/authenticate; services coordinate; adapters call external systems; repositories persist.
8. Advanced execution is request-scoped and bounded. No durable LangGraph checkpointing is required.
9. Preserve citations as typed `EvidenceRef` objects from retrieval to answer persistence.
10. Add tests before changing an orchestration branch.

## Required checks before merge

```text
unit: state transitions, route authorization, bounds, citation mapping
integration: retrieval adapter → orchestration → SSE completed event
security: cross-domain request rejected; deleted source never returned
contract: browser cannot override server-owned runtime configuration
evaluation: fixed complex-question fixture set passes baseline thresholds
```

## Done means

- A typed `POST /api/v1/chat/turns:stream` emits safe progress + answer + evidence events.
- Simple and multi-hop questions behave deterministically under configured budgets.
- Every assistant answer has either evidence references or an explicit grounded-insufficiency result.
- No code path emits hidden reasoning.
