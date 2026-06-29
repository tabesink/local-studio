# API And Backend Connection Notes

This document is the frontend-to-backend handoff. It names the contract each frontend slice expects so backend implementers can wire the matching route, model, permission, and persistence behavior later.

## Global Rules

- Use one typed API client in `webui/src/lib/api/client.ts`.
- Feature modules own endpoint wrappers.
- UI components must not call `fetch` directly.
- Use `credentials: "include"` for cookie sessions.
- Normalize all failures to one `ApiError`.
- Map backend `snake_case` to frontend `camelCase` at the API boundary.
- Never render raw stack traces, provider traces, secrets, auth headers, database errors, or private paths.

## Shared Types

```ts
export type ApiError = {
  status: number
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
}

export type Role = "member" | "admin"

export type CurrentUser = {
  id: string
  email: string
  displayName?: string | null
  role: Role
  isActive: boolean
}
```

## Runtime And Session

| Frontend need | API | Backend owner | Notes |
| --- | --- | --- | --- |
| Resolve current user | `GET /auth/me` or future `GET /api/v1/session/me` | auth/session service | returns user, role, active status; 401 means anonymous |
| Login | `POST /auth/login` | auth service | should set HttpOnly cookie; no localStorage token |
| Logout | `POST /auth/logout` preferred | auth service | must invalidate server session/cookie; client-only logout is not enough |
| Health | `GET /health` or `GET /api/v1/health` | FastAPI app | public response must be minimal and secret-free |

## Shell And Domains

| Frontend need | API | Backend owner | Data model |
| --- | --- | --- | --- |
| Accessible domains for selector/context | `GET /api/v1/domains` or current domain route after verification | domain service | `DomainSummary` |
| Role-aware admin links | `GET /auth/me` | auth/session service | `CurrentUser.role` |
| Forbidden state | any admin API returns `403` | API middleware/router guards | `ApiError` |

Expected domain shape:

```ts
export type DomainSummary = {
  id: string
  name: string
  status: "ready" | "indexing" | "degraded" | "disabled" | "unknown"
  documentCount?: number
}
```

## Documents And Operations

| Frontend need | API | Backend owner | Data model |
| --- | --- | --- | --- |
| Document library | `GET /documents` | document repository/service | `DocumentListItem[]` |
| Upload document | `POST /admin/documents/upload` | admin document service | document plus operation |
| Operation list | `GET /operations` | operation service | `OperationSummary[]` |
| Operation detail | `GET /operations/{id}` | operation service | `OperationDetail` |

```ts
export type DocumentStatus =
  | "uploaded"
  | "indexing"
  | "ready"
  | "failed"
  | "deleted"

export type DocumentListItem = {
  id: string
  filename: string
  contentType: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  errorMessage?: string | null
}

export type OperationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"

export type OperationSummary = {
  id: string
  type: string
  status: OperationStatus
  stage?: string | null
  message?: string | null
  createdAt?: string
  updatedAt?: string
}
```

## Chat And Evidence

| Frontend need | API | Backend owner | Notes |
| --- | --- | --- | --- |
| Check chat readiness | `GET /chat/capability` | chat/retrieval service | show disabled/empty state if not ready |
| Submit streaming turn | `POST /chat/turn/stream` as SSE | chat service | use one SSE parser |
| Retrieval-only evidence | `POST /retrieve` | retrieval service | verify role/domain behavior |

```ts
export type ChatTurnRequest = {
  domainId?: string
  clientTurnId: string
  question: string
  conversation?: unknown[]
}

export type ChatStreamEvent =
  | { type: "sources"; data: unknown }
  | { type: "answer_complete"; data: unknown }
  | { type: "evidence_only"; data: unknown }
  | { type: "error"; data: { code?: string; message?: string } }
```

## Settings

| Surface | API | Role | Secret handling |
| --- | --- | --- | --- |
| Users | `/admin/users*` | admin | no passwords returned |
| Domains | domain admin routes after verification | admin | no provider internals |
| Model provider | `/admin/ai-settings*` | admin | secret values never returned |
| Parser settings | `/admin/document-parser-settings*` | admin | test output sanitized |
| General preferences | verify current route or keep client-local initially | member/admin | non-secret only |

## Backend Work Needed Before Full Integration

- Confirm canonical route prefixes and whether `/api/v1/*` will be introduced or existing paths retained.
- Confirm role names and whether `member` maps to current backend `user`.
- Add real logout/session invalidation if not already present.
- Ensure CORS/cookie config works for local `webui/` dev server.
- Publish OpenAPI schema or generated types once backend contracts stabilize.
- Confirm graph route replacement for `/database-visualize` versus `/graph`.

