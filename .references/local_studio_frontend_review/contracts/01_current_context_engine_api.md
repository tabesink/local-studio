# 01 — Current Context Engine API Contract

> **TARGET contract.** New `/api/v1` surface. Existing unversioned routes migrate behind this. Do not expose two contract shapes to frontend forever.

## Boundary

```text
Next.js feature
-> typed API module
-> shared HTTP client
-> FastAPI route
-> service/domain logic
-> storage / worker / LightRAG / provider
```

FastAPI owns business truth. Client owns view state.

## Transport

```text
Same-origin cookie auth.
fetch(..., { credentials: "include" }).
JSON for request/response.
SSE for one streaming chat turn.
Polling for ingestion/lifecycle until server push proves needed.
```

## Error shape

```json
{
  "error": {
    "code": "domain_not_ready",
    "message": "Selected domain is not ready.",
    "details": {},
    "request_id": "req_..."
  }
}
```

Never mix feature-specific error formats.

## Pagination

```json
{
  "items": [],
  "page": { "limit": 50, "next_cursor": null }
}
```

Current offset backend may remain internal during migration. Frontend sees one shape only.

## Endpoint catalog

| Capability | Method/path | Role | Response |
|---|---|---|---|
| Session login | `POST /api/v1/session/login` | Public | `CurrentUser` + cookie |
| Session logout | `POST /api/v1/session/logout` | Signed-in | `204` |
| Current user | `GET /api/v1/session/me` | Signed-in | `CurrentUser` |
| Domains | `GET /api/v1/domains` | Member/admin | `Page<DomainSummary>` |
| Domain detail | `GET /api/v1/domains/{id}` | Authorized | `DomainDetail` |
| Users | `GET/POST /api/v1/admin/users` | Admin | users/page |
| Provider config | `GET/PATCH /api/v1/admin/providers` | Admin | `ProviderConfig` |
| Parser policy | `GET/PATCH /api/v1/admin/domains/{id}/parser-policy` | Admin | parser policy |
| Documents | `GET /api/v1/domains/{id}/documents` | Authorized | `Page<DocumentSummary>` |
| Upload | `POST /api/v1/admin/domains/{id}/documents` | Admin | document + job |
| Document detail | `GET /api/v1/domains/{id}/documents/{doc}` | Authorized | `DocumentDetail` |
| Ingestion job | `GET /api/v1/admin/ingestion-jobs/{id}` | Admin | `IngestionJobDetail` |
| Graph | `GET /api/v1/domains/{id}/graph` | Authorized | `GraphResponse` |
| Workspace tree | `GET /api/v1/domains/{id}/workspace/tree` | Authorized | `WorkspaceTree` |
| Chat turn | `POST /api/v1/domains/{id}/chat/turns` | Authorized | SSE |
| Domain start | `POST /api/v1/admin/domains/{id}/start` | Admin | `OperationSummary` |
| Domain stop | `POST /api/v1/admin/domains/{id}/stop` | Admin | `OperationSummary` |
| Domain delete | `DELETE /api/v1/admin/domains/{id}` | Admin | `OperationSummary` |
| Operations | `GET /api/v1/admin/operations` | Admin | `Page<OperationSummary>` |
| Audit | `GET /api/v1/admin/audit-events` | Admin | `Page<AuditEvent>` |

## Frontend module map

```text
client/src/lib/api/
  session.ts
  domains.ts
  users.ts
  providers.ts
  parsers.ts
  documents.ts
  jobs.ts
  graph.ts
  workspace.ts
  chat.ts
  operations.ts
  http.ts
  generated.ts
```

Page does not call `fetch`. Feature calls API module. API module calls `http.ts`.

## Non-negotiable auth rules

```text
No access token in localStorage.
No access token in sessionStorage.
No access token in URL.
No provider secret in GET response.
Client nav role gate = usability only.
FastAPI dependency = authorization.
```
