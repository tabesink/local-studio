---
id: ARCH-002
title: Component Boundaries
status: approved
owner: Context Engine architecture team
last_reviewed: 2026-06-30
depends_on: [ARCH-001]
supersedes: []
---

# Component Boundaries

## Composition Roots

- API: FastAPI app factory/composition root.
- Worker: one Postgres-backed worker process for domain delete, source prep, indexing, remote cleanup, and redaction hooks.
- Controller: private lifecycle component with Docker/runtime access.
- Frontend: Next.js App Router with route groups and feature modules.

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
| Services | business rules and lifecycle orchestration | state transitions and safe DTOs | UI assumptions, duplicated ownership |
| Repositories | persistence access | DB reads/writes | business decisions outside transactional helpers |
| Worker | async resource work | leases, retries, cleanup | generic job platform or separate queue infra |
| Controller | private runtime lifecycle | Docker/runtime details | public/browser routes |
| LightRAG client | retrieval/index calls | private provider interaction | UI DTOs or product state ownership |
