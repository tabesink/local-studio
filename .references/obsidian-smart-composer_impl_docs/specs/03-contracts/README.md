---
id: CTR-000
title: Contract conventions
status: approved
owner: Context Engine team
last_reviewed: 2026-07-02
depends_on: []
supersedes: []
---
# Contract conventions

All contracts here are **proposed target contracts**, not discovered Smart Composer APIs. Backend owner approval is required before implementing callers.

## Common response rules

```ts
export type ApiError = {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}
```

- 401 = unauthenticated; frontend clears transient state and redirects through the canonical session flow.
- 403 = authenticated but forbidden; frontend shows a safe forbidden state.
- 404 = resource absent or intentionally not disclosed.
- 409 = state conflict, including `conversation_busy`.
- 422 = request validation error.
- 429 = rate limit; return `Retry-After` and safe code.
- 5xx = safe generic message plus request ID; no internals.

No contract may expose provider credentials, opaque internal prompts, raw retriever responses, private runtime addresses, or source content not authorized for the caller.
