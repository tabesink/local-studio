---
id: API-001
title: Context Engine API v1
status: approved
owner: Context Engine API team
last_reviewed: 2026-07-02
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
| P7 | `GET /conversations`, `POST /conversations`, `GET /conversations/{conversation_id}`, `DELETE /conversations/{conversation_id}`, `POST /conversations/{conversation_id}/turns:stream` |
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

### Domain lifecycle actions

`POST /admin/domains/{domain_id}/start` and `POST /admin/domains/{domain_id}/stop` complete synchronously in P3 and return:

```json
{
  "domain": {
    "id": "fatigue",
    "displayName": "Fatigue Analysis",
    "state": "running",
    "embeddingProfileId": "openai-embedding-default",
    "available": true,
    "createdAt": "2026-06-30T12:00:00Z",
    "updatedAt": "2026-06-30T12:01:00Z"
  }
}
```

`DELETE /admin/domains/{domain_id}` accepts asynchronous hard delete with `202` and returns the queued safe operation:

```json
{
  "operation": {
    "id": "op-uuid",
    "operationType": "delete",
    "status": "queued",
    "message": "Delete queued.",
    "errorCode": null,
    "errorMessage": null,
    "startedAt": null,
    "finishedAt": null,
    "createdAt": "2026-06-30T12:02:00Z"
  }
}
```

After delete is accepted, the domain is fenced as `deleting`, omitted from member `GET /domains`, and removed from all domain reads only after the worker completes resource cleanup and hard-deletes the row.

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

## P4 Source Document DTOs

All `/admin/domains/{domain_id}/sources*` routes are Administrator-only. They require an existing Knowledge Domain whose state is not `deleting`. P4 source preparation does not require the domain to be running or available.

### Source upload

`POST /admin/domains/{domain_id}/sources` uses `multipart/form-data`.

Parts:

```text
file: required binary upload
```

The server sanitizes the uploaded filename into `originalFilename`, computes SHA-256 over the original bytes, freezes `runtime_settings.active_parser_kind` onto `source_documents.parser_kind`, stores the original in private source storage, creates a `pending` Source Document, and enqueues a `queued` preparation operation in one transaction. Same hash in the same Knowledge Domain returns `409 source_duplicate`; the same hash in another Knowledge Domain is allowed.

Pilot upload limits:

```text
max file size: 25 MiB
content types:
  application/pdf
  text/plain
  text/markdown
  application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

`201` response:

```json
{
  "source": {
    "id": "source-uuid",
    "domainId": "fatigue",
    "originalFilename": "manual.pdf",
    "contentType": "application/pdf",
    "originalSizeBytes": 12345,
    "originalSha256": "sha256-hex",
    "state": "pending",
    "parserKind": "docling",
    "blockCount": 0,
    "imageCount": 0,
    "createdAt": "2026-07-02T12:00:00Z",
    "updatedAt": "2026-07-02T12:00:00Z"
  },
  "operation": {
    "id": "op-uuid",
    "operationType": "prepare",
    "status": "queued",
    "message": "Preparation queued.",
    "errorCode": null,
    "errorMessage": null,
    "startedAt": null,
    "finishedAt": null,
    "createdAt": "2026-07-02T12:00:00Z"
  }
}
```

### Source reads

`GET /admin/domains/{domain_id}/sources` returns `{ "sources": [SourceAdminSummary] }` ordered by newest first. `GET /admin/domains/{domain_id}/sources/{source_id}` returns `{ "source": SourceAdminSummary }`.

`SourceAdminSummary` is the safe lifecycle DTO shown in the upload response. P5 extends it with safe source-index lifecycle fields defined below. It never includes source originals, storage paths, image URLs, source download URLs, parser-native payloads, parser task IDs, parser/provider URLs, canonical Markdown, raw source text, raw parser/provider payloads, runtime URLs, private LightRAG data, stack traces, credentials, index request ids, index generations, rendered input hashes, lease fields, or private remote identities.

`GET /admin/domains/{domain_id}/sources/{source_id}/outline` returns structure only:

```json
{
  "items": [
    {
      "sourceOrder": 1,
      "kind": "text",
      "headingLevel": 1,
      "title": "Inspection",
      "pageStart": 1,
      "pageEnd": 2,
      "sectionPath": ["Inspection"]
    }
  ]
}
```

`GET /admin/domains/{domain_id}/sources/{source_id}/operations` returns `{ "operations": [SourcePreparationOperation] }` ordered by newest first. `SourcePreparationOperation` uses the safe operation DTO from the upload response and omits `preparationGenerationAtStart`, lease fields, and `requestedByUserId`.

### Source actions

`POST /admin/domains/{domain_id}/sources/{source_id}/retry` is allowed only for a `pending` Source Document with no active preparation operation. It increments `preparation_generation` and enqueues a new `prepare` operation using the Source Document frozen `parserKind`, not the current global parser setting. Response: `202 { "operation": SourcePreparationOperation }`.

`POST /admin/domains/{domain_id}/sources/{source_id}/cancel` increments `preparation_generation` and marks the active queued/running preparation operation `cancelled`. Response: `200 { "operation": SourcePreparationOperation }`. If preparation has already published and the Source Document is `prepared`, cancellation returns `409 source_state_conflict`.

`DELETE /admin/domains/{domain_id}/sources/{source_id}` is synchronous local hard delete in P4. It fences active preparation work, marks active preparation cancelled, removes private original/image files, deletes Source Blocks/Images through cascade, deletes the Source Document row, and returns `204 No Content`. P5 owns remote LightRAG delete behavior for indexed sources.

### Source errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Unknown domain | 404 | `domain_not_found` |
| Domain is deleting | 409 | `domain_state_conflict` |
| Unknown source in domain | 404 | `source_not_found` |
| Duplicate file hash in domain | 409 | `source_duplicate` |
| Unsupported upload content type | 422 | `source_file_unsupported` |
| Upload exceeds pilot size limit | 413 | `source_file_too_large` |
| Wrong source state for action | 409 | `source_state_conflict` |
| Active source preparation exists | 409 | `source_operation_in_progress` |
| Parser configuration missing/unready | 409 | `parser_not_ready` |
| Parser authentication failed | 502 | `parser_auth_failed` |
| Parser unavailable or timed out | 502 | `parser_unavailable` |
| Parser response cannot be normalized | 502 | `parser_malformed_response` |
| Prepared source fails validation | 422 | `source_preparation_invalid` |

All source/parser error messages are safe and bland. Parser-native errors, provider payloads, task IDs, URLs, paths, stack traces, credentials, and source text are not returned.

## P5 Source Index DTOs And Actions

All `/admin/domains/{domain_id}/sources/{source_id}/index/*` routes are Administrator-only. They require an existing Knowledge Domain whose state is not `deleting` and an existing Source Document in that domain. The browser never talks to LightRAG, provider APIs, runtime URLs, storage paths, or remote ids.

P5 extends `SourceAdminSummary` with safe index lifecycle fields:

```json
{
  "indexState": "not_requested",
  "indexErrorCode": null,
  "indexErrorMessage": null,
  "indexAcceptedAt": null,
  "indexReadyAt": null,
  "indexUpdatedAt": null
}
```

Safe source DTOs do not include `indexGeneration`, `indexRequestId`, `indexContentHash`, `indexRemoteDocumentId`, `indexLeaseOwner`, `indexLeaseExpiresAt`, rendered LightRAG input, Source Block canonical Markdown, raw LightRAG hits, provider payloads, runtime URLs, or storage paths. `queryEligible` is not exposed in P5 unless this contract is explicitly patched; later retrieval/chat services call the backend `source_is_query_eligible()` predicate server-side.

### Source index retry

`POST /admin/domains/{domain_id}/sources/{source_id}/index/retry` queues a new source-index attempt for a prepared Source Document only after previous remote content is absent or proved never accepted. It increments `index_generation`, computes deterministic rendered input and `index_content_hash`, assigns the current generation `index_request_id`, sets `index_state = queued`, clears safe index error fields, and returns:

```text
202 { "source": SourceAdminSummary }
```

Retry must fail fast with a safe conflict when active index work exists. It does not return a preparation operation DTO and does not create an index operation/history object.

### Source index cancel

`POST /admin/domains/{domain_id}/sources/{source_id}/index/cancel` fences active or ready index content. It increments the index generation, prevents late submit/readiness results from marking the source ready, deletes remote content when accepted/ready content may exist, verifies absence when a remote delete is needed, transitions to `cancelled`, and returns:

```text
200 { "source": SourceAdminSummary }
```

If remote cleanup is required and fails, the route returns a safe failure and does not claim cancellation complete.

### Source and domain delete after P5

`DELETE /admin/domains/{domain_id}/sources/{source_id}` remains `204 No Content` only when any accepted/ready remote LightRAG content has been deleted and verified absent before local Source Document rows, Source Blocks, Source Images, or private files are removed. If remote cleanup cannot be completed, the source remains fenced and the route returns a safe error.

Domain delete remains asynchronous through the domain delete worker. For P5, the domain delete worker must clear indexed remote content for every accepted/ready source and verify absence before calling the local P4 source purge hook and hard-deleting the Knowledge Domain.

### Source index errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Source is not prepared | 409 | `source_not_prepared` |
| Active index work exists | 409 | `source_index_in_progress` |
| Index was not requested or is already terminal for this action | 409 | `source_index_state_conflict` |
| Remote LightRAG runtime unavailable | 502 | `source_index_remote_unavailable` |
| Remote LightRAG indexing failed | 502 | `source_index_remote_failed` |
| Remote LightRAG delete/absence proof failed | 502 | `source_index_delete_failed` |

All source-index error messages are safe and bland. They never include remote ids, runtime URLs, rendered input, Source Block content, raw LightRAG/provider payloads, request payloads, stack traces, credentials, or storage paths.

## P6 Scoped Evidence Retrieval

`POST /domains/{domain_id}/evidence` is available to authenticated Members and Administrators. The selected Knowledge Domain must exist and be available by backend domain availability rules before retrieval starts. The route does not mutate sources, index state, domain lifecycle, runtime settings, or diagnostics.

Request body is strict camelCase JSON with no retrieval controls:

```json
{
  "question": "What startup sequence does the manual require?"
}
```

`question` is required, trimmed by validation, at least 1 character, and at most 2000 characters. Unknown fields, including `query`, `topK`, `reranker`, `retrievalMode`, `sourceId`, `sourcePath`, `model`, `provider`, `prompt`, or `apiKey`, return `422 validation_error`.

Successful mapped retrieval returns:

```json
{
  "result": "evidence_found",
  "evidence": [
    {
      "excerpt": "Bounded evidence excerpt.",
      "sourceLabel": "manual.md"
    }
  ]
}
```

No mapped Evidence after retrieval returns `200` with:

```json
{
  "result": "no_grounded_context",
  "evidence": []
}
```

`EvidenceItem` fields:

| Field | Rule |
| --- | --- |
| `excerpt` | Safe excerpt derived from the mapped eligible Source Block, max 500 characters. It is never raw LightRAG hit text and never full Source Block content beyond this bound. |
| `sourceLabel` | Safe Source Document display label, max 255 characters. |

The response order follows mapped retrieval order. Duplicate mapped Source Blocks may be collapsed server-side; clients must not infer private identity from ordering.

P6 responses never include Source Block ids, Source Document ids, source refs, raw scores, raw LightRAG hits, remote ids, file paths, storage paths, runtime addresses, provider payloads, prompt text, stack traces, full canonical Markdown, index generations, request ids, or private runtime payloads.

### Evidence retrieval errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Unknown domain | 404 | `domain_not_found` |
| Domain is stopped, deleting, or has an active lifecycle operation | 409 | `domain_state_conflict` |
| Domain runtime unavailable or timed out | 502 | `domain_runtime_unavailable` |
| No Source Document in the selected domain passes query eligibility | 409 | `domain_no_eligible_sources` |

Safe messages are bland and suitable for a later UI toast. They never disclose whether discarded LightRAG hits existed, why individual hits were discarded, private ids, source text, runtime details, paths, provider payloads, stack traces, or the submitted question.

## P7 Conversations And Turn Stream

All `/conversations*` routes require an authenticated Member or Administrator. Conversation rows are owner-scoped; another user's conversation returns 404, not ownership details.

`GET /conversations` returns:

```json
{
  "conversations": [
    {
      "id": "conv_01",
      "title": "Safe generated title",
      "createdAt": "2026-07-02T12:00:00Z",
      "updatedAt": "2026-07-02T12:05:00Z"
    }
  ]
}
```

`POST /conversations` accepts an optional safe title and returns the same safe conversation DTO. `GET /conversations/{conversation_id}` returns the conversation plus safe turn summaries owned by the caller. `DELETE /conversations/{conversation_id}` deletes only the caller's conversation and returns `204`.

`POST /conversations/{conversation_id}/turns:stream` accepts `application/json` and returns `text/event-stream`.

```json
{
  "clientRequestId": "01J00000000000000000000000",
  "message": "What startup sequence does the manual require?",
  "domainId": "manuals"
}
```

`domainId` is optional only for direct LLM general chat. Domain-specific, source-specific, operational, or ambiguous knowledge questions require a selected available Knowledge Domain before domain RAG begins.

Forbidden request fields include `route`, `model`, `provider`, `embeddingModel`, `systemPrompt`, `topK`, `reranker`, `hiddenFilter`, `retrievalMode`, `toolChoice`, `apiKey`, `sourcePath`, raw prompt fragments, and provider payloads. Unknown or forbidden control fields return `422`.

The server classifies the turn:

| Route | Requirement | Behavior |
| --- | --- | --- |
| `direct_llm` | non-domain general chat | no retrieval, no Evidence, no citations |
| `domain_rag` | selected available Knowledge Domain | advanced agentic RAG through P6 RetrievalPort |

Missing Evidence in `domain_rag` returns a safe no-grounded-context result and does not retry as direct LLM.

SSE events follow EVT-001. Public payloads never expose prompts, raw answers before safe projection, raw LightRAG hits, provider payloads, private source/block IDs, runtime URLs, storage paths, stack traces, or tool reasoning.
