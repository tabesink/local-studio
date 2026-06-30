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

## P2 Runtime Settings DTOs

All P2 endpoints are Administrator-only.

### Safe status response

`GET /admin/runtime-settings` returns only status and model metadata safe for an admin UI:

```json
{
  "providers": [
    { "providerKind": "openai", "isConfigured": false }
  ],
  "modelProfiles": [
    {
      "id": "profile-id",
      "name": "GPT 4.1",
      "profileKind": "synthesis",
      "providerKind": "openai",
      "modelName": "gpt-4.1",
      "vectorDimensions": null,
      "isDefault": false
    }
  ],
  "runtimeSettings": {
    "activeSynthesisProfileId": "profile-id",
    "activeParserKind": "docling"
  }
}
```

Provider DTOs never include secret values, ciphertext, credential update timestamps, provider payloads, base URLs, runtime URLs, or storage paths. `isConfigured` is true when a provider that requires credentials has encrypted credentials, or when the provider does not require credentials.

### Provider credential rotation

`PUT /admin/runtime-settings/providers/{provider_kind}` accepts a closed `provider_kind` of `openai`, `bedrock`, `ollama`, or `reducto`.

Request:

```json
{ "credential": "secret value" }
```

Response:

```json
{ "provider": { "providerKind": "openai", "isConfigured": true } }
```

The route rotates encrypted credentials on the existing provider row. `ollama` does not accept credentials in P2.

### Model profiles

`POST /admin/runtime-settings/model-profiles` request:

```json
{
  "name": "OpenAI synthesis",
  "profileKind": "synthesis",
  "providerKind": "openai",
  "modelName": "gpt-4.1",
  "vectorDimensions": null
}
```

`profileKind` is `synthesis` or `embedding`. `providerKind` for model profiles is `openai`, `bedrock`, or `ollama`; `reducto` is parser-only. Embedding profiles require positive `vectorDimensions`. Synthesis profiles must not provide `vectorDimensions`. `modelName` and embedding `vectorDimensions` must match the approved model catalog. Safe profile DTOs include `isDefault` for seeded defaults used by later UI preselects.

Seeded defaults are `openai-embedding-default` for domain embedding preselect and `openai-synthesis-default` for synthesis. The active synthesis profile remains null until OpenAI credentials are configured, then the default synthesis profile may be activated automatically when no active synthesis profile exists.

`PATCH /admin/runtime-settings/model-profiles/{profile_id}` may update `name`, `modelName`, or `vectorDimensions`. Used embedding profiles are immutable once a domain references them.

`DELETE /admin/runtime-settings/model-profiles/{profile_id}` deletes an unused profile. Active synthesis profiles and profiles referenced by a domain cannot be deleted.

### Runtime singleton

`PATCH /admin/runtime-settings` request:

```json
{
  "activeSynthesisProfileId": "profile-id",
  "activeParserKind": "docling"
}
```

Both fields are optional, but at least one must be present. `activeSynthesisProfileId` must reference a synthesis profile whose provider is ready. `activeParserKind` is `docling` or `reducto`; `reducto` requires configured Reducto credentials.


## P3 Knowledge Domain DTOs

All `/admin/domains*` routes are Administrator-only. `GET /domains` is available to authenticated Members and Administrators and returns only available domains.

### Domain create

`POST /admin/domains` uses a strict camelCase body:

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "embeddingProfileId": "openai-embedding-default"
}
```

`id` is an administrator-chosen slug matching `^[a-z0-9][a-z0-9_-]{1,62}$`. `displayName` is optional, 1-120 characters, and defaults to `id`. `embeddingProfileId` is required and must resolve to an embedding model profile whose provider is ready through the trusted runtime resolver.

`201` response:

```json
{
  "domain": {
    "id": "fatigue",
    "displayName": "Fatigue Analysis",
    "state": "stopped",
    "embeddingProfileId": "openai-embedding-default",
    "available": false,
    "createdAt": "2026-06-30T12:00:00Z",
    "updatedAt": "2026-06-30T12:00:00Z"
  }
}
```

Admin domain DTOs never expose `runtimeInstanceId`, `controlGeneration`, controller payloads, container IDs, runtime URLs, host ports, storage paths, runtime DB names, provider config, or provider secrets.

### Admin domain reads

`GET /admin/domains` returns `{ "domains": [DomainAdminSummary] }`.

`GET /admin/domains/{domain_id}` returns `{ "domain": DomainAdminSummary }`. Detail is intentionally the same safe summary in P3.

`DomainAdminSummary`:

```json
{
  "id": "fatigue",
  "displayName": "Fatigue Analysis",
  "state": "stopped",
  "embeddingProfileId": "openai-embedding-default",
  "available": false,
  "createdAt": "2026-06-30T12:00:00Z",
  "updatedAt": "2026-06-30T12:00:00Z"
}
```

`available` is computed at read time from running state, no active domain operation, and fresh private controller health. It is never persisted.

### Domain status

`GET /admin/domains/{domain_id}/status` returns a lean polling DTO:

```json
{
  "domain": {
    "id": "fatigue",
    "displayName": "Fatigue Analysis",
    "state": "running",
    "available": true
  },
  "activeOperation": {
    "id": "op-uuid",
    "operationType": "delete",
    "status": "running",
    "message": "Removing runtime resources."
  }
}
```

`activeOperation` is null when no queued/running domain operation exists.

### Domain operations

`GET /admin/domains/{domain_id}/operations` returns safe lifecycle history:

```json
{
  "operations": [
    {
      "id": "op-uuid",
      "operationType": "start",
      "status": "succeeded",
      "message": "Domain started.",
      "errorCode": null,
      "errorMessage": null,
      "startedAt": "2026-06-30T12:01:00Z",
      "finishedAt": "2026-06-30T12:01:05Z",
      "createdAt": "2026-06-30T12:01:00Z"
    }
  ]
}
```

Operation DTOs omit `controlGenerationAtStart`, `leaseOwner`, and `requestedByUserId` in P3.

### Member domain list

`GET /domains` filters server-side and returns only rows where computed availability is true:

```json
{
  "domains": [
    { "id": "fatigue", "displayName": "Fatigue Analysis", "available": true }
  ]
}
```

Unavailable domains are omitted entirely rather than returned with `available: false`. Member DTOs do not include `state` or `embeddingProfileId`.

### Domain lifecycle errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Bad slug/request validation | 422 | `validation_error` |
| Duplicate slug | 409 | `domain_id_conflict` |
| Unknown domain | 404 | `domain_not_found` |
| Missing embedding profile | 404 | `embedding_profile_not_found` |
| Wrong/unready embedding profile | 400 | `embedding_profile_invalid` |
| Wrong lifecycle state | 409 | `domain_state_conflict` |
| Active operation exists | 409 | `domain_operation_in_progress` |
| Controller or runtime unavailable | 502 | `domain_runtime_unavailable` |

Second lifecycle requests are never queued behind an active operation. They fail fast with `domain_operation_in_progress` and a safe message suitable for a later admin toast.
