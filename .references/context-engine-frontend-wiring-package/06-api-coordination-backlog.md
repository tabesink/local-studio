# Backend / Frontend API Coordination Backlog

## P0 — Blocks foundation or security correctness

| Priority | Frontend slice | Backend phase | Required API proof/change | Owner | Blocking? | Temporary safe UI behavior |
|---|---|---|---|---|---|---|
| P0 | F01/F02 | P1 | Versioned base path, cookie attributes, `POST login` / `GET me` / `POST logout`, safe error DTO, request ID header | Backend API + Frontend | Yes | No authenticated shell; show local build error only. |
| P0 | F02 | P1 | Same-origin / CORS / CSRF policy for cookie-authenticated writes | Backend/security | Yes before separate-origin UI | Develop same-origin; do not ship cross-origin mutation config. |
| P0 | F03 | P1 | Exact current-user role DTO and 401/403 behavior | Backend API | Yes | Hide only unavailable links; do not assume client authorization. |
| P0 | F07/F08 | P2 | Safe runtime settings read/mutation DTO; validation errors; known provider/parser rules | Backend API | Yes for settings build | Read-only “Configuration unavailable” placeholder. |
| P0 | F12 | P6/P7 | Exact conversation turn SSE endpoint, event types/order/data, idempotency, abort/disconnect settlement | Backend API + frontend | Yes | Chat shell with composer disabled / “Streaming contract not available”. |
| P0 | F16 | P6/later | Confirm P6 evidence response excludes source detail; no source-view endpoint present | Backend API | Yes for security | Metadata-only evidence panel, no open action. |

## P1 — Blocks specific feature slice

| Priority | Frontend slice | Backend phase | Required API proof/change | Owner | Blocking? | Temporary safe UI behavior |
|---|---|---|---|---|---|---|
| P1 | F05 | P1/later | User-management write routes, payloads, self-lockout/deletion policy | Product + backend | Yes for CRUD only | Read-only user table. |
| P1 | F06/F14 | P3 | Admin domain list/detail/status/action DTO; allowed actions or conflict semantics; 202/404 lifecycle behavior | Backend API | Yes | Read-only placeholder. |
| P1 | F09/F10 | P4 | Domain-scoped source list/detail/outline/upload/retry/cancel/delete DTOs and pagination | Backend API | Yes | Empty source page state; no generic `/documents`. |
| P1 | F09/F10 | P5 | Safe index state current fields, retry/cancel/delete transition shape | Backend API | Yes | Render preparation only; do not imply indexed status. |
| P1 | F11 | P3/P5/P7 | Available-domain list, conversation list/create/read, domain-unavailable/no-source errors | Backend API | Yes | Chat setup-required shell. |
| P1 | F13 | future graph proxy | Graph node/edge/detail/list/permission API | Backend/product | Yes | Empty graph shell + contract-needed message. |
| P1 | F15 | P3/P4/P5/P8 | Resource-specific history/list APIs and retention/pagination | Backend API | Yes | Deep-link from resource detail only; no global Activity page. |
| P1 | F17 | P8 | Audit events query filters and safe diagnostics DTO/availability | Backend API | Yes | Diagnostics unavailable state. |

## P2 — Can defer behind disabled/read-only UI

| Priority | Frontend slice | Backend phase | Required API proof/change | Owner | Blocking? | Temporary safe UI behavior |
|---|---|---|---|---|---|---|
| P2 | F03 | P2–P8 | Final nav route/visibility registry | Frontend | No | Hide deferred nav entries. |
| P2 | F06 | P2 | Embedding profile display-name lookup for Domains panel | Backend API | No | Show safe profile ID only or omit until safe label contract. |
| P2 | F14 | P3 | Server-provided `allowed_actions` optional convenience field | Backend API | No | Use endpoint-specific conflict response and refetch. |
| P2 | F16 | later source-view | Opaque authorized source detail/asset capability | Backend/product | No | Metadata-only evidence panel. |
| P2 | F17 | P8 | Request ID copy support and audit actor formatting | Backend API | No | Display only returned safe ID; no generated/support data. |
| P2 | F13 | future graph proxy | URL-selected node persistence | Product/frontend | No | Keep selection local. |

## Contract capture template

Every API gate closes only when this exists in repository:

```text
1. OpenAPI snapshot or explicit SSE contract markdown.
2. Typed fixture file used by frontend tests.
3. Backend API integration test covering auth + success + safe failure.
4. Frontend adapter test mapping DTO -> view model.
5. Response-shape test proving forbidden private fields are absent.
```

For SSE add:

```text
6. Split-frame parser fixture.
7. Evidence-before-terminal fixture.
8. Duplicate client request fixture.
9. Disconnect/abort fixture.
10. Terminal result-kind fixture.
```
