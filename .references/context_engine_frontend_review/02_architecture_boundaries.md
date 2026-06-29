# Architecture Boundaries

## Current composition — Confirmed

```text
Browser
  ↓
Next.js client routes / global providers
  ↓
Feature UI + client API helpers
  ↓ HTTP + SSE
FastAPI routers
  ↓
Application services / repositories / lifecycle code
  ↓
Postgres + Redis/RQ worker + poller + LightRAG domain services + external LLM/parser providers
```

## Product roles

- **Member/user:** query/read product surfaces. UI hides admin controls for usability.
- **Admin:** users, provider/parser config, document writes, domain/lifecycle/operations.
- **Backend:** final authorization. UI visibility never security control.

## Current ownership

| Concern | Owner |
|---|---|
| Session verification, roles, secret handling, DB state, lifecycle transition | FastAPI/backend |
| Route rendering, dialog state, form interaction, active nav, stream rendering | frontend |
| Documents / operations / chat evidence / provider profile wire shape | explicit API contract |
| LightRAG semantic retrieval | LightRAG service through backend |
| Synthesis response / user-visible chat flow | Context Engine backend + frontend |

## Target composition root — Recommendation

```text
src/
  app/
    layout.tsx
    providers.tsx
    (public)/login/page.tsx
    (app)/layout.tsx
    (app)/chat/page.tsx
    (app)/documents/page.tsx
    (app)/graph/page.tsx
  features/
    auth/ navigation/ settings/ documents/ chat/ graph/ operations/
  lib/
    api/{client,contracts,errors,stream}.ts
    auth/session.ts
    config/env.ts
  components/
    ui/       # shadcn only
    shared/   # presentational only
```

## Dependency direction

```text
route/layout → feature UI → feature controller/hook → typed API/SSE client → FastAPI
```

Forbidden:

```text
shared primitive → raw fetch → role decision → feature business logic
```

## Keep / replace

| Area | Decision |
|---|---|
| FastAPI service boundary | Keep |
| Typed feature API modules | Keep shape; consolidate contracts |
| Document vs operation separation | Keep |
| SSE chat transport | Keep |
| Full application client-rendering shell | Simplify; server-first route group where possible |
| Global Settings dialog | Keep concept; split panels/modules |
| Token in browser localStorage | Replace |
| Client-only logout | Replace |
| Multiple duplicate type aliases / transport helpers | Consolidate after contract capture |
