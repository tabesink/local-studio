---
id: ARCH-003
title: Target Next.js + Context Engine system context
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Target system context

```mermaid
flowchart LR
  U[Member or Admin Browser] --> N[Next.js App Router UI]
  N -->|same-origin /api/v1; cookie session| A[Context Engine FastAPI]
  A --> P[(PostgreSQL)]
  A --> W[Source worker / lifecycle services]
  A --> R[Private LightRAG runtime per domain]
  A --> L[Provider runtime / model API]
  A --> O[Structured logs / optional masked Langfuse]
```

## Request lifecycle

```text
route/layout → feature component → feature hook → typed API/stream client
  → FastAPI authorization → retrieval/chat service → SSE
  → feature reducer → rendered states
```

## Constraints

- The browser is thin: no local retrieval, model selection logic, provider credentials, or document authority.
- The API does not expose private runtime endpoints or provider secrets.
- Slow parsing/indexing remains outside request paths. Chat handlers do not hold database transactions while streaming or waiting on providers.
- One active turn per conversation is recommended by the target data contract; different conversations may proceed independently.
