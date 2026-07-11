# Executive Summary

## Product

Context Engine is a small multi-user knowledge-workbench. Users browse documents, query grounded knowledge, inspect graph/context surfaces. Admins manage users, providers/parsers, document ingestion, LightRAG domains, operations, diagnostics.

## Rebuild target

Rebuild UI in Next.js App Router + TypeScript + Tailwind + shadcn primitives. Keep FastAPI as auth/business/lifecycle truth. Do not port framework coupling or browser token persistence.

## Primary journeys

```text
Login → session resolve → app rail → Chat / Documents / Graph

Admin:
Settings → provider/parser/users/domains
Documents → upload → operation → document status
Domain lifecycle → operation → status
```

## High-risk integration areas

| Risk | Why | Gate |
|---|---|---|
| Browser auth | v1 writes bearer to localStorage while backend also sets HttpOnly cookie | cookie-only session + real logout before app shell |
| SSE chat | event ordering/payloads/cancel semantics runtime-dependent | capture raw SSE fixtures before streaming UI |
| Async work | document status and operation status are distinct | preserve two state machines |
| Provider/parser config | secret/status separation | never return/read secret value client-side |
| Domain lifecycle | destructive, operational, undocumented exact routes | capture OpenAPI + admin/member tests |
| Graph/source detail | contracts/ACL details incomplete | build read-only shell after route capture |

## Recommended rebuild shape

```text
public login
  → cookie session
  → authenticated shell
  → narrow vertical slices
  → typed API/SSE client
  → FastAPI authority
```

## Minimum backend contract before frontend wiring

1. Auth login/me/logout plus stable 401/403/error envelope.
2. Current-user role DTO.
3. Document list/upload/result + operation detail contract.
4. Chat capability + captured SSE event models.
5. Provider/parser schema with secret status-only fields.
6. Domain/graph/lifecycle DTOs before those screens.

## Decision

Do not attempt full visual clone first. Ship foundation → auth → shell → Settings panels → documents/upload → chat/SSE → admin control plane. This preserves parity where source evidence exists, avoids hard-coding unknown backend behavior.
