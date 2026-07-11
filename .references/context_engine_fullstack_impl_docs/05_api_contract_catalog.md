# API Contract Catalog

## Contract rule

Use one typed client. Feature modules own endpoint wrappers. Shared UI imports no raw transport. Confirm field-level shapes against OpenAPI/runtime before final rebuild.

## Auth / user

| Endpoint | Method | Purpose | Role |
|---|---:|---|---|
| `/auth/login` | POST | credential login; response bearer + session cookie | public |
| `/auth/me` | GET | resolve current user | authenticated |
| `/admin/users` | GET | user list | admin |
| `/admin/users` | POST | create user | admin |
| `/admin/users/{id}` | PATCH | update role/active/user fields | admin |
| `/admin/users/{id}/reset-password` | POST | reset password | admin |
| `/admin/users/{id}` | DELETE | delete/deactivate behavior verify | admin |

## Settings

| Endpoint | Method | Purpose | Role |
|---|---:|---|---|
| `/admin/ai-settings` | GET | provider profiles/settings | admin |
| `/admin/ai-settings/defaults` | PUT | update defaults | admin |
| `/admin/ai-settings/profiles` | POST | create profile | admin |
| `/admin/ai-settings/profiles/{id}` | PATCH | edit profile | admin |
| `/admin/ai-settings/profiles/{id}/test` | POST | test profile | admin |
| `/admin/ai-settings/profiles/{id}/validate` | POST | validate profile | admin |
| `/admin/ai-settings/profiles/{id}/activate` | POST | activate profile | admin |
| `/admin/ai-settings/provider-secrets` | PUT/POST/DELETE | write/test/delete secret reference | admin |
| `/admin/document-parser-settings` | GET/PUT | parser config/profiles | admin |
| `/admin/document-parser-settings/profiles/{id}/test` | POST | parser test | admin |

## Documents / operations

| Endpoint | Method | Purpose | Role |
|---|---:|---|---|
| `/documents` | GET | read library | authenticated |
| `/admin/documents/upload` | POST | upload document; returns document + operation/status URL | admin |
| `/operations` | GET | operation list | admin / verify |
| `/operations/{id}` | GET | operation detail | admin / verify |

## Chat / retrieval

| Endpoint | Method | Purpose | Role |
|---|---:|---|---|
| `/chat/capability` | GET | determine chat readiness | authenticated |
| `/chat/turn/stream` | POST SSE | stream answer/evidence | authenticated |
| `/retrieve` | POST | retrieval evidence only; no natural language stream | authenticated / verify |
| LightRAG domain/graph routes | mixed | lifecycle and graph proxy | admin/read behavior verify |


## TypeScript contract starter — Recommendation

```ts
export type DocumentStatus =
  | "uploaded"
  | "indexing"
  | "ready"
  | "failed"
  | "deleted"

export type OperationStatus =
  | "queued"
  | "running"
  | "succeeded"
  | "failed"
  | "canceled"

export interface DocumentListItem {
  id: string
  filename: string
  contentType: string
  status: DocumentStatus
  createdAt: string
  updatedAt: string
  metadata?: Record<string, unknown>
  errorMessage?: string | null
}

export interface OperationSummary {
  id: string
  type: string
  status: OperationStatus
  stage?: string | null
  message?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface ChatTurnRequest {
  domain_id?: string
  client_turn_id: string
  question: string
  conversation?: unknown[] // Replace after runtime capture.
}

export type ChatStreamEvent =
  | { type: "sources"; data: unknown } // Map after capture.
  | { type: "answer_complete"; data: unknown }
  | { type: "evidence_only"; data: unknown }
  | { type: "error"; data: { code?: string; message?: string } }
```

Wire naming currently uses snake_case in backend/client evidence. Map to frontend camelCase at feature boundary; never mix both through all components.

## Shared error target — Recommendation

```ts
export type ApiError = {
  code: string
  message: string
  fieldErrors?: Record<string, string[]>
  requestId?: string
  status: number
}
```

Normalize non-JSON/network/abort errors. Never render raw provider trace, secret, auth header, or backend stack.
