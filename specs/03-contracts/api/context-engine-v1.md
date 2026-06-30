---
id: API-001
title: Context Engine API v1
status: approved
owner: Context Engine API team
last_reviewed: 2026-06-30
depends_on: [CON-000, ARCH-001]
supersedes: []
---

# Context Engine API v1

## Global Rules

- Base path: `/api/v1` for product APIs unless a deployment-specific health endpoint is explicitly outside the API version.
- Auth: opaque `ce_session` HttpOnly cookie. JSON responses never include a token.
- Error envelope: `{ error: { code, message, requestId, fields? } }`.
- Unknown fields are rejected where phase docs say strict DTOs.
- Safe DTOs never expose secrets, ciphertext, storage paths, runtime URLs, controller payloads, raw provider payloads, raw LightRAG hits, source/block IDs for member evidence unless a later source-ref contract approves them.

## Phase Endpoint Catalog

| Phase | Endpoints |
| --- | --- |
| P1 | `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `GET /admin/users`, `GET /health/live`, `GET /health/ready` |
| P2 | `GET /admin/runtime-settings`, `PUT /admin/runtime-settings/providers/{provider_kind}`, `POST /admin/runtime-settings/model-profiles`, `PATCH /admin/runtime-settings/model-profiles/{profile_id}`, `DELETE /admin/runtime-settings/model-profiles/{profile_id}`, `PATCH /admin/runtime-settings` |
| P3 | `POST /admin/domains`, `GET /admin/domains`, `GET /admin/domains/{domain_id}`, `GET /admin/domains/{domain_id}/status`, `POST /admin/domains/{domain_id}/start`, `POST /admin/domains/{domain_id}/stop`, `DELETE /admin/domains/{domain_id}`, `GET /admin/domains/{domain_id}/operations`, `GET /domains` |
| P4 | `POST /admin/domains/{domain_id}/sources`, `GET /admin/domains/{domain_id}/sources`, `GET /admin/domains/{domain_id}/sources/{source_id}`, `GET /admin/domains/{domain_id}/sources/{source_id}/outline`, `GET /admin/domains/{domain_id}/sources/{source_id}/operations`, `POST /admin/domains/{domain_id}/sources/{source_id}/retry`, `POST /admin/domains/{domain_id}/sources/{source_id}/cancel`, `DELETE /admin/domains/{domain_id}/sources/{source_id}` |
| P5 | `POST /admin/domains/{domain_id}/sources/{source_id}/index/retry`, `POST /admin/domains/{domain_id}/sources/{source_id}/index/cancel` |
| P6 | `POST /domains/{domain_id}/evidence` |
| P7 | conversation CRUD and `POST` turn SSE route captured before implementation; every turn requires `domain_id` and `client_request_id` |
| P8 | `GET /admin/audit-events`, optional `GET /admin/domains/{domain_id}/diagnostics/lightrag?tail=200` |
| P9 | frontend consumes only captured P1-P8 endpoints through typed feature wrappers |

## Contract Capture Rule

Older reference catalogs may list stale paths such as `/auth/login`, `/chat/turn/stream`, or `/retrieve`. The phase docs above are the target. If implementation keeps compatibility aliases, document them as aliases, not primary product contracts.
