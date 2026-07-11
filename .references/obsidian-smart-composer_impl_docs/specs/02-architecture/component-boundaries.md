---
id: ARCH-004
title: Target module boundaries
status: proposed
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Target module boundaries

```text
webui/src/
  app/
    (public)/
    (authenticated)/chat/
    (authenticated)/settings/
  features/
    auth/
    workspace/
    chat/
    evidence/
    conversations/
    templates/
    sources/
    change-proposals/       # remains disabled until F-009 approval
  components/
    ui/                     # shadcn primitives only
    shared/                 # display-only, no API calls
  lib/
    api/client.ts           # one HTTP transport
    api/errors.ts           # one error normalization path
    api/contracts.ts        # generated or versioned DTOs
    api/stream.ts           # one SSE parser
    auth/session.ts
```

## Dependency direction

```text
route/layout → feature component → feature hook/controller → typed API/stream client → FastAPI
```

Shared UI components must never call API endpoints, decide authorization, access browser secrets, or contain domain-specific stream parsing.
