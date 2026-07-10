---
id: API-001
title: Context Engine API v1
status: approved
owner: Context Engine API team
last_reviewed: 2026-07-10
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
| P4 | `POST /admin/domains/{domain_id}/sources`, `GET /admin/domains/{domain_id}/sources`, `GET /admin/domains/{domain_id}/sources/{source_id}`, `GET /admin/domains/{domain_id}/sources/{source_id}/outline`, `GET /admin/domains/{domain_id}/sources/{source_id}/operations`, `POST /admin/domains/{domain_id}/sources/{source_id}/retry`, `POST /admin/domains/{domain_id}/sources/{source_id}/cancel`, `DELETE /admin/domains/{domain_id}/sources/{source_id}`, `GET /domains/{domain_id}/sources`, `GET /domains/{domain_id}/sources/{source_id}/preview` |
| P5 | `POST /admin/domains/{domain_id}/sources/{source_id}/index/retry`, `POST /admin/domains/{domain_id}/sources/{source_id}/index/cancel` |
| P6 | `POST /domains/{domain_id}/evidence` |
| P7 | `GET /conversations`, `POST /conversations`, `GET /conversations/{conversation_id}`, `PATCH /conversations/{conversation_id}`, `DELETE /conversations/{conversation_id}`, `POST /conversations/{conversation_id}/turns:stream` |
| P8 | `GET /admin/audit-events`, optional `GET /admin/domains/{domain_id}/diagnostics/lightrag` |
| P12 | `POST /composer-refs:discover`, extended `POST /conversations/{conversation_id}/turns:stream` with `composerRefTokens` |
| P9 | frontend consumes only captured P1-P8 endpoints through typed feature wrappers |
| P10 | no new product API for the first runnable-stack gate; Runtime Node/Logs/Usage/storage/Docker environment APIs remain blocked until this contract is patched |
| P11 | `GET /wiki/pages`, `GET /wiki/pages/{page_id}`, `GET /wiki/pages/{page_id}/revisions`, `GET /wiki/contributions`, `POST /wiki/contributions`, `GET /wiki/contributions/{contribution_id}`, `PATCH /wiki/contributions/{contribution_id}`, `POST /wiki/contributions/{contribution_id}:submit`, `GET /admin/wiki/contributions`, `GET /admin/wiki/contributions/{contribution_id}`, `POST /admin/wiki/contributions/{contribution_id}:publish`, `POST /admin/wiki/contributions/{contribution_id}:reject` |

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

Operation DTOs omit `controlGenerationAtStart`, `leaseOwner`, `requestedByUserId`, and P8 `requestId` in P3.

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

`GET /admin/domains/{domain_id}/sources/{source_id}/operations` returns `{ "operations": [SourcePreparationOperation] }` ordered by newest first. `SourcePreparationOperation` uses the safe operation DTO from the upload response and omits `preparationGenerationAtStart`, lease fields, `requestedByUserId`, and P8 `requestId`.

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

### Member source list and preview

`GET /domains/{domain_id}/sources` and `GET /domains/{domain_id}/sources/{source_id}/preview` are available to authenticated Members and Administrators. They use the same domain availability gate as P6 evidence (`require_current_session` + domain exists + `domain_available`). They do not mutate sources, preparation, index state, domain lifecycle, runtime settings, or diagnostics.

These routes are a separate non-admin route family. All `/admin/domains/{domain_id}/sources*` routes remain Administrator-only. Do not relax admin source authz to grant Members mutation or admin list/outline/operations access.

`GET /domains/{domain_id}/sources` returns `{ "sources": [SourceAdminSummary] }` ordered by newest first. The list DTO reuses the same safe source summary fields and forbidden-field bar as admin `SourceAdminSummary` / `safe_source()`. It does not include outline items, preparation operations, storage paths, download URLs, originals, or any admin-only mutation surface.

`GET /domains/{domain_id}/sources/{source_id}/preview` streams the stored original bytes once the original file is present in private source storage. Preview is not gated on preparation state or index eligibility. Concurrent readers of the same Source Document are allowed; the product must not serialize or lock preview to a single viewer.

Previewable content types:

```text
application/pdf
text/plain
text/markdown
```

Unsupported upload types such as `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (docx) and any other non-previewable type return a safe unsupported error and no body bytes. Missing original file, unknown source, unauthorized/unavailable domain, or deleted source fail closed with a safe error.

Successful preview response rules:

- HTTP `200` with the stored Source Document `contentType` as `Content-Type`
- Body is the full stored original up to the existing 25 MiB upload limit (no preview truncation)
- `Cache-Control: private, no-store`
- Do not set `Content-Disposition: attachment`
- Do not expose storage paths, runtime URLs, credentials, or private identities in headers, bodies, or logs

This route is the approved same-origin cookie-authenticated preview contract for F-009 Library wiring (PDF blob object URL or plain/markdown text panel). Do not copy old Context Engine flat `/documents/{id}/preview`.

### Member source list and preview errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Unauthenticated | 401 | `unauthenticated` |
| Unknown domain | 404 | `domain_not_found` |
| Domain is stopped, deleting, or has an active lifecycle operation | 409 | `domain_state_conflict` |
| Domain runtime unavailable or timed out | 502 | `domain_runtime_unavailable` |
| Unknown source in the selected domain | 404 | `source_not_found` |
| Content type is not previewable | 422 | `source_preview_unsupported` |
| Stored original is missing or unreadable | 404 | `source_preview_unavailable` |

All member source list and preview error messages are safe and bland. JSON error envelopes and response headers never include storage paths, runtime URLs, credentials, raw source text beyond the intentional preview body on success, provider payloads, stack traces, or private remote identities.

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

Conversation titles are optional user-provided labels. P7 does not auto-generate titles from prompts or answers. A missing, null, or blank title is stored as `null`; UI may render a local "Untitled conversation" fallback. A provided title is trimmed, must be 1-120 characters after trimming, and must not contain control characters. Unknown fields are rejected.

`GET /conversations` returns newest-updated first:

```json
{
  "conversations": [
    {
      "id": "conv_01",
      "title": "Manual startup",
      "createdAt": "2026-07-02T12:00:00Z",
      "updatedAt": "2026-07-02T12:05:00Z"
    }
  ]
}
```

`POST /conversations` accepts:

```json
{ "title": "Manual startup" }
```

The request body may be omitted. Response is `201 { "conversation": ConversationSummary }`.

`PATCH /conversations/{conversation_id}` accepts the same `title` field and returns `200 { "conversation": ConversationSummary }`. Setting `title` to null or blank clears the stored title. Other users' conversations return 404.

`GET /conversations/{conversation_id}` returns the conversation plus safe turn summaries owned by the caller:

```json
{
  "conversation": {
    "id": "conv_01",
    "title": "Manual startup",
    "createdAt": "2026-07-02T12:00:00Z",
    "updatedAt": "2026-07-02T12:05:00Z"
  },
  "turns": [
    {
      "id": "turn_01",
      "clientRequestId": "01J00000000000000000000000",
      "domainId": "manuals",
      "route": "domain_rag",
      "status": "completed",
      "stopReason": "grounded",
      "userMessage": "What startup sequence does the manual require?",
      "assistantAnswer": "The approved startup sequence is...",
      "safeError": null,
      "acceptedRefs": [
        {
          "id": "turnref_01",
          "kind": "source",
          "order": 1,
          "label": "manual.md",
          "description": "Source"
        }
      ],
      "evidence": [
        {
          "id": "evref_01",
          "citationLabel": "[1]",
          "sourceLabel": "manual.md",
          "excerpt": "Bounded evidence excerpt."
        }
      ],
      "citations": [
        { "evidenceRefId": "evref_01", "citationLabel": "[1]" }
      ],
      "budget": {
        "planStepCount": 1,
        "retrievalOperationCount": 1,
        "repairAttemptCount": 0
      },
      "createdAt": "2026-07-02T12:00:00Z",
      "startedAt": "2026-07-02T12:00:01Z",
      "completedAt": "2026-07-02T12:00:05Z",
      "updatedAt": "2026-07-02T12:00:05Z"
    }
  ]
}
```

Turn summary rules:

- `assistantAnswer` is null for running, failed, redacted, `no_grounded_context`, and `evidence_only` turns.
- `safeError` is either null or `{ "code": "safe_error_code", "message": "Safe message." }`.
- Direct LLM turns have `domainId: null`, `route: "direct_llm"`, `evidence: []`, and `citations: []`.
- Redacted turns keep `userMessage`, set `status: "redacted"`, `stopReason: "redacted"`, clear `assistantAnswer`, and return empty `acceptedRefs`, `evidence`, and `citations`. Server-side evidence and accepted-ref rows are retained with redaction/invalidation timestamps set and public fields cleared; they are omitted from all public responses and replays.
- Evidence items expose only the turn-scoped public evidence ref id, citation label, source label, and approved excerpt. They never expose Source Document ids, Source Block ids, paths, raw source text, raw LightRAG hits, or scores.
- Accepted refs expose only turn-scoped accepted-ref id, kind, order, safe label, and optional safe description. They never expose composer ref tokens, Source Document ids, Source Block ids, Wiki Revision ids, template bodies, prompt text, paths, raw source/wiki text, raw Evidence, raw LightRAG hits, provider payloads, or scores.

`DELETE /conversations/{conversation_id}` deletes only the caller's conversation and returns `204`.

`POST /conversations/{conversation_id}/turns:stream` accepts `application/json` and returns `text/event-stream`.

```json
{
  "clientRequestId": "01J00000000000000000000000",
  "message": "What startup sequence does the manual require?",
  "domainId": "manuals",
  "composerRefTokens": ["opaque_ref_token"]
}
```

`clientRequestId` is required, unique per conversation, 8-80 visible ASCII characters, and safe for logs. `message` is required, trimmed by validation, 1-4000 characters. `domainId` is optional. `composerRefTokens` is optional, max 10 tokens, each 16-256 visible ASCII characters. Domain-specific, source-specific, operational, or ambiguous knowledge questions require a selected available Knowledge Domain before a turn row is claimed.

If `domainId` is supplied, the API validates before claiming a turn that the domain exists, is available by backend rules, and is authorized for the caller, then runs the turn as `domain_rag` even when the message looks like a greeting or other general chat. Direct LLM turns persist `domainId: null` only when no `domainId` was supplied and the server intent gate classifies the message as non-domain general chat. Unknown or unavailable supplied domains fail before a turn row is created.

F-012 composer refs:

- Valid composer ref kinds are `source`, `evidence`, `wiki`, and `template`.
- Source, Evidence, and Wiki refs require a selected `domainId`; template-only direct LLM is allowed without a domain for non-domain general chat.
- Submitted tokens must have been issued to the caller by Context Engine discovery/catalog surfaces. The browser must not construct tokens from ids, paths, raw source text, prompt text, provider state, or host filesystem state.
- Every token is revalidated before turn claim: existence, caller authorization, effective-domain compatibility, source query eligibility, Evidence ownership and non-redaction, Wiki published/current eligibility, template approval, and delete/redaction invalidation.
- Invalid refs fail closed before SSE opens. Silent partial dropping is not allowed.
- Accepted refs influence only private server prompt assembly. They do not let the browser choose route, retrieval mode, model, provider, tools, or prompt text.

Forbidden request fields include `route`, `model`, `provider`, `embeddingModel`, `systemPrompt`, `topK`, `reranker`, `hiddenFilter`, `retrievalMode`, `toolChoice`, `apiKey`, `sourcePath`, raw prompt fragments, template bodies, ref target ids, source/wiki text, and provider payloads. Unknown or forbidden control fields return `422`.

The server classifies the turn:

| Route | Requirement | Behavior |
| --- | --- | --- |
| `direct_llm` | non-domain general chat | no retrieval, no Evidence, no citations |
| `domain_rag` | selected available Knowledge Domain | advanced agentic RAG through P6 RetrievalPort |

Missing Evidence in `domain_rag`, including a domain with no query-eligible sources, creates a completed turn with `stopReason: "no_grounded_context"` and does not retry as direct LLM. Provider failure after Evidence creates a completed turn with `stopReason: "evidence_only"` and returns the Evidence without answer tokens. Provider failure before Evidence or during direct LLM emits a safe terminal error.

SSE events follow EVT-001. Public payloads never expose prompts, raw answers before safe projection, raw LightRAG hits, provider payloads, private source/block IDs, runtime URLs, storage paths, stack traces, or tool reasoning.

The route must resolve pre-stream errors before returning `text/event-stream`. Validation, auth, missing/unknown conversation, missing required domain, unknown/unavailable supplied domain, request conflict, and one-running-turn errors return the canonical JSON error envelope instead of a half-open SSE stream.

### P7 idempotency and replay

For an incoming `clientRequestId`, the server checks the owner-scoped conversation before provider or retrieval calls:

| Condition | HTTP / stream behavior | Code / replay |
| --- | --- | --- |
| Same `clientRequestId`, same message, same effective domain, and same composer-ref fingerprint as a completed turn | `200 text/event-stream` replay from persisted safe data | `done.replay = true`; no provider/retrieval call |
| Same `clientRequestId` as a completed `no_grounded_context`, `evidence_only`, or redacted turn | `200 text/event-stream` replay from persisted safe terminal state | `done.replay = true`; no provider/retrieval call |
| Same `clientRequestId` as a failed turn | `200 text/event-stream` replay of persisted safe terminal `error` | `error.replay = true`; no provider/retrieval call |
| Same `clientRequestId` but different message, different effective domain, different route, or different composer-ref fingerprint | `409` JSON error | `client_request_conflict` |
| Same `clientRequestId` while the original turn is still running | `409` JSON error | `conversation_turn_in_progress` |
| Different `clientRequestId` while any turn in the conversation is running | `409` JSON error | `conversation_turn_in_progress` |

Replay streams use persisted `conversation_turn_evidence_refs`, `conversation_turn_composer_refs`, `assistant_answer`, `stop_reason`, safe counters, and safe error fields only. They do not revalidate expired composer tokens, reconstruct Evidence from rendered Markdown, rebuild prompt assembly, or call the provider, LightRAG, or P6 retriever.

### P7 safe errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Unknown conversation or another user's conversation | 404 | `conversation_not_found` |
| Bad title, message, request id, or forbidden field | 422 | `validation_error` |
| Domain-specific or ambiguous request has no selected domain | 422 | `domain_required` |
| Supplied domain does not exist | 404 | `domain_not_found` |
| Supplied domain is stopped, deleting, unavailable, or has active lifecycle operation | 409 | `domain_state_conflict` |
| Supplied domain runtime times out before turn claim | 502 | `domain_runtime_unavailable` |
| Existing running turn blocks submit or duplicate replay | 409 | `conversation_turn_in_progress` |
| Same request id with different message/effective domain | 409 | `client_request_conflict` |
| Composer ref is stale, redacted, deleted, unauthorized, expired, out-of-domain, not query-eligible, or not approved | 409 | `composer_ref_unavailable` |
| Active synthesis profile is missing or provider is not configured | 409 | `synthesis_profile_not_ready` |
| Provider fails before any Evidence can be returned | terminal SSE `error` | `provider_failure` |
| Client disconnect/cancel after stream starts | terminal persisted state | `turn_cancelled` |

Safe messages are bland and do not echo the submitted message, prompt text, source text, provider payload, runtime URL, storage path, stack trace, private ids, or route reasoning.

### P7 internal mapped evidence bridge

P7 must not widen the public P6 evidence endpoint. Chat uses an internal RetrievalPort result that includes private `source_document_id` and `source_block_id` alongside the safe excerpt/source label so the service can persist `conversation_turn_evidence_refs` for citation validation and redaction. Only the turn-scoped evidence ref id is returned to the browser.

## F-012 Composer Ref Discovery And Templates

`POST /composer-refs:discover` is available to authenticated Members and Administrators. It issues short-lived opaque composer ref tokens for the caller and returns safe metadata only.

Request:

```json
{
  "conversationId": "conv_01",
  "domainId": "manuals",
  "kinds": ["source", "evidence", "wiki", "template"],
  "query": "manual",
  "limit": 10
}
```

Rules:

- `conversationId` is optional but required to discover active-conversation Evidence refs.
- `domainId` is optional for template discovery and required for Source, Evidence, and Wiki discovery.
- `kinds` defaults to all four kinds and may contain only `source`, `evidence`, `wiki`, or `template`.
- `query` is optional safe filter text, max 120 characters, and is not persisted as product state.
- `limit` defaults to 10 and is capped at 25.

Response:

```json
{
  "refs": [
    {
      "refToken": "opaque_ref_token",
      "kind": "template",
      "label": "Grounded answer",
      "description": "Use the approved grounded-answer style.",
      "disabledReason": null
    }
  ]
}
```

`refToken` is opaque and must not encode readable private ids. Public discovery responses never include Source Document ids, Source Block ids, Wiki Revision ids, private Evidence ref ids, template bodies, prompt text, raw source/wiki text, Evidence excerpts beyond already approved Evidence DTOs, paths, provider payloads, raw LightRAG hits, runtime targets, stack traces, credentials, or raw request bodies.

Approved prompt templates are backend catalog records. Member discovery exposes safe names and descriptions only; template body, injection position, and interaction with Evidence are server-owned. Template authoring UI is not part of F-012.

## P8 Admin Observability Routes

P8 adds admin observability routes only. It does not change P1-P7 DTOs, SSE event names, retrieval behavior, redaction behavior, or lifecycle state machines. `conversation_turns.trace_id` is private operational metadata and is not returned by conversation APIs or SSE events. Operation `request_id` fields are backend correlation metadata and are not added to existing operation DTOs in P8.

All P8 admin routes are Administrator-only:

| Caller | Result |
| --- | --- |
| Public/no session | `401 unauthenticated` |
| Authenticated Member | `403 forbidden` and `security.admin_route_denied` audit event |
| Administrator | route-specific response |

Public unauthenticated auth failures remain safe-log only and do not create audit rows.

### Admin audit events

`GET /admin/audit-events` returns newest-first immutable audit rows with bounded filters. It is the only audit route in P8. There is no audit create, update, delete, export, or retention API.

The read itself is audited before returning. By default, list responses hide `audit_events.read` rows so the route does not fill its first page with self-read events.

Query parameters:

| Parameter | Rule |
| --- | --- |
| `limit` | Optional integer, default `50`, min `1`, max `100`. |
| `cursor` | Optional opaque pagination cursor. |
| `eventName` | Optional closed `AuditEventName`. |
| `actorKind` | Optional `public`, `member`, `administrator`, `worker`, or `system`. |
| `targetKind` | Optional safe target kind. |
| `targetId` | Optional safe target id. |
| `requestId` | Optional request id. |
| `traceId` | Optional trace id. |
| `createdFrom` | Optional ISO timestamp. |
| `createdTo` | Optional ISO timestamp. |
| `includeSelfReads` | Optional boolean, default `false`. When `false`, omit `audit_events.read` rows unless `eventName=audit_events.read` is supplied. When `true`, include self-read rows that match the other filters. |

Response:

```json
{
  "auditEvents": [
    {
      "id": "audit-event-id",
      "eventName": "domain.delete_queued",
      "actorKind": "administrator",
      "actorUserId": "user-id-or-null",
      "targetKind": "domain",
      "targetId": "domain-id",
      "requestId": "request-id-or-null",
      "traceId": "trace-id-or-null",
      "outcome": "succeeded",
      "safeErrorCode": null,
      "metadata": { "operationType": "delete" },
      "createdAt": "2026-07-06T12:00:00Z"
    }
  ],
  "nextCursor": null
}
```

Audit DTOs never include usernames, emails, filenames, titles, display names, user questions, assistant answers, prompts, source text, evidence excerpts, Source Block ids, private evidence ref ids, provider payloads, runtime targets, storage targets, stack traces, credentials, or raw request bodies.

Errors:

| Situation | HTTP | Code |
| --- | --- | --- |
| Unauthenticated | 401 | `unauthenticated` |
| Authenticated non-admin | 403 | `forbidden` |
| Bad filter, cursor, timestamp, enum, or limit | 422 | `validation_error` |
| Audit write/read unavailable | 503 | `audit_unavailable` |

### Admin LightRAG diagnostics

`GET /admin/domains/{domain_id}/diagnostics/lightrag` is an optional P8 route. If shipped, this is its only approved contract. If the private diagnostics boundary cannot be proven, do not implement a raw proxy; record deferred or blocked evidence in F-008 acceptance instead.

Query parameters:

| Parameter | Rule |
| --- | --- |
| `tail` | Optional integer, default `100`, min `1`, max `200`. |

The browser never supplies a path, URL, container id, provider target, runtime target, storage target, or credential. The server resolves the Knowledge Domain and private runtime boundary. Implementations may use a backend-owned redacted per-domain LightRAG runtime log/tail as the source material; raw host logs, container logs, paths, runtime URLs, and controller targets are never proxied to the browser.

Response:

```json
{
  "diagnostics": {
    "domainId": "domain-id",
    "kind": "lightrag",
    "capturedAt": "2026-07-06T12:00:00Z",
    "lineCount": 10,
    "truncated": false,
    "lines": [
      { "message": "redacted diagnostic line" }
    ]
  }
}
```

Caps:

```text
max tail lines: 200
max serialized diagnostics body: 64 KiB
```

Diagnostics lines are post-redaction safe strings only. They must not include raw provider payloads, raw LightRAG payloads, prompts, user questions, assistant answers, source text, evidence excerpts, credentials, runtime URLs, storage paths, private runtime targets, stack traces, filenames, titles, or display names.

Errors:

| Situation | HTTP | Code |
| --- | --- | --- |
| Unauthenticated | 401 | `unauthenticated` |
| Authenticated non-admin | 403 | `forbidden` |
| Unknown domain | 404 | `domain_not_found` |
| Domain state cannot support diagnostics | 409 | `domain_state_conflict` |
| Bad `tail` or path parameter | 422 | `validation_error` |
| Diagnostics boundary unavailable | 502 | `diagnostics_unavailable` |
| Audit write unavailable | 503 | `audit_unavailable` |

Diagnostics reads are audited as `diagnostics.read` with `outcome=succeeded` or `outcome=failed`. A failed diagnostics read uses `safe_error_code=diagnostics_unavailable` when the private boundary cannot answer safely.

## P11 Wiki And Smart Composer Routes

P11 adds manual Wiki Contribution and Wiki Page routes. Smart Composer v1 is a UI workflow over these JSON APIs. P11 does not add AI-assisted drafting, SSE streams, source apply, exports, attachments, archive/delete, or direct source navigation.

All `/wiki*` routes require an authenticated Member or Administrator. All `/admin/wiki*` routes are Administrator-only.

| Caller | Non-admin wiki routes | Admin wiki routes |
| --- | --- | --- |
| Public/no session | `401 unauthenticated` | `401 unauthenticated` |
| Authenticated Member | owner-scoped contribution routes and published Wiki Page reads | `403 forbidden` and `security.admin_route_denied` audit event |
| Administrator | owner-scoped contribution routes, published/admin Wiki Page reads, and admin review routes | route-specific response |

### Wiki Page reads

`GET /wiki/pages` returns published Wiki Pages for Members and Administrators ordered by newest update first:

```json
{
  "pages": [
    {
      "id": "wiki_page_01",
      "title": "Startup checklist",
      "state": "published",
      "currentRevisionId": "wiki_rev_01",
      "updatedAt": "2026-07-07T12:00:00Z"
    }
  ]
}
```

Members only receive pages where `state = "published"`. Administrators may filter by `state` after this contract captures the query shape; P11 v1 may implement an admin review route instead of widening the member page list.

`GET /wiki/pages/{page_id}` returns a published page and its current immutable revision:

```json
{
  "page": {
    "id": "wiki_page_01",
    "title": "Startup checklist",
    "state": "published",
    "currentRevisionId": "wiki_rev_01",
    "updatedAt": "2026-07-07T12:00:00Z"
  },
  "currentRevision": {
    "id": "wiki_rev_01",
    "wikiPageId": "wiki_page_01",
    "revisionNumber": 1,
    "title": "Startup checklist",
    "body": "Curated wiki text.",
    "publishedFromContributionId": "wiki_contrib_01",
    "publishedAt": "2026-07-07T12:00:00Z",
    "evidenceRefs": [
      {
        "id": "wiki_evref_01",
        "evidenceRefId": "evref_01",
        "citationLabel": "[1]",
        "sourceLabel": "manual.md",
        "state": "active"
      }
    ]
  }
}
```

`GET /wiki/pages/{page_id}/revisions` returns immutable revision summaries for a published page. Revision body is returned only by page detail in P11 v1. Members do not receive pages or revisions when the page state is `needs_review` or `archived`.

Wiki Page and Revision DTOs never include raw source text, raw Evidence, prompts, assistant answers, provider payloads, raw LightRAG hits, storage paths, runtime targets, Docker targets, stack traces, credentials, private Source Block ids, or private Source Document ids.

### Wiki Contribution owner routes

`GET /wiki/contributions` returns the caller's own contributions ordered by newest update first. It does not list another user's drafts or submitted contributions.

`POST /wiki/contributions` creates a draft contribution.

Request:

```json
{
  "targetPageId": null,
  "title": "Startup checklist",
  "body": "Draft curated text.",
  "evidenceRefIds": ["evref_01"]
}
```

Rules:

- `targetPageId` is optional. Null means publish will create a new Wiki Page.
- `title` is required, trimmed, 1-160 characters, and cannot contain control characters.
- `body` is required, trimmed, 1-20000 characters, and is curated wiki text, not raw source storage.
- `evidenceRefIds` is optional, max 50 ids. Each id must be an authorized, owner-scoped, non-redacted `conversation_turn_evidence_refs.id` from a completed domain-grounded Turn owned by the caller.
- Unknown fields are rejected.

Response: `201 { "contribution": WikiContributionDetail }`.

`GET /wiki/contributions/{contribution_id}` returns the caller's own contribution. Another user's contribution returns `404 wiki_contribution_not_found`.

`PATCH /wiki/contributions/{contribution_id}` updates only a draft contribution owned by the caller. It accepts `title`, `body`, and `evidenceRefIds`, each following the create rules. Updating evidence refs replaces the contribution evidence-ref set transactionally. Submitted, published, rejected, or blocked contributions return `409 wiki_contribution_state_conflict`.

`POST /wiki/contributions/{contribution_id}:submit` submits a caller-owned draft for review. It validates that stored evidence refs are still authorized and not redacted, then returns `200 { "contribution": WikiContributionDetail }` with `state = "submitted"`.

Safe contribution detail:

```json
{
  "id": "wiki_contrib_01",
  "targetPageId": null,
  "publishedPageId": null,
  "publishedRevisionId": null,
  "title": "Startup checklist",
  "body": "Draft curated text.",
  "state": "draft",
  "reviewerNote": null,
  "evidenceRefs": [
    {
      "id": "wiki_evref_01",
      "evidenceRefId": "evref_01",
      "citationLabel": "[1]",
      "sourceLabel": "manual.md",
      "state": "active"
    }
  ],
  "createdAt": "2026-07-07T11:00:00Z",
  "updatedAt": "2026-07-07T11:05:00Z",
  "submittedAt": null,
  "reviewedAt": null
}
```

Safe contribution DTOs never include another user's private draft, usernames, emails, raw user questions, raw assistant answers, raw source text, raw Evidence excerpts, private Source Document ids, private Source Block ids, provider payloads, prompts, storage paths, runtime targets, Docker targets, stack traces, credentials, or raw request bodies.

### Admin review routes

`GET /admin/wiki/contributions` returns submitted, blocked, published, or rejected contribution summaries for review. P11 v1 requires bounded pagination if implementation can return more than 100 rows; otherwise `limit` defaults to 50 and maxes at 100.

`GET /admin/wiki/contributions/{contribution_id}` returns a safe contribution detail for Administrator review. Draft contributions that have never been submitted remain owner-private in P11 v1 and return `404 wiki_contribution_not_found` to this admin route unless this contract is later patched.

`POST /admin/wiki/contributions/{contribution_id}:publish` publishes a submitted contribution in one backend transaction:

1. Validate Administrator role.
2. Validate contribution state is `submitted`.
3. Validate evidence refs are still active and authorized.
4. Lock or version-check the target Wiki Page/contribution.
5. Create one immutable Wiki Revision.
6. Create a Wiki Page if `targetPageId` is null, otherwise update the existing page's current revision pointer.
7. Mark the contribution `published`.
8. Write a safe audit row in the same transaction.

Request body may be omitted. Response is `200 { "page": WikiPageSummary, "revision": WikiRevisionDetail, "contribution": WikiContributionDetail }`.

Publishing an already published contribution returns the existing safe publish result and does not create a second revision. Publishing a rejected, draft, blocked, unauthorized, stale, or conflicting contribution fails safely.

`POST /admin/wiki/contributions/{contribution_id}:reject` rejects a submitted contribution.

Request:

```json
{ "reviewerNote": "Needs additional support." }
```

`reviewerNote` is optional, trimmed, max 500 characters, safe text only, and must not contain prompts, source text, provider payloads, stack traces, paths, or private ids. Response is `200 { "contribution": WikiContributionDetail }`.

Protected admin review mutations record audit rows. If audit write fails, the product mutation is rolled back and the API returns `503 audit_unavailable`.

### Redaction and invalidation behavior

When a Source Document or Knowledge Domain delete/redaction invalidates a `conversation_turn_evidence_refs` row referenced by P11:

- draft or submitted Wiki Contributions with that ref become `blocked` and cannot be submitted or published until a later contract defines repair behavior;
- published Wiki Revisions remain immutable;
- the affected Wiki Page state becomes `needs_review` when its current revision references invalidated context;
- Members no longer receive `needs_review` pages from `/wiki/pages` or `/wiki/pages/{page_id}`;
- Administrators can still inspect safe metadata through admin review surfaces after the admin route is implemented.

### P11 safe errors

| Situation | HTTP | Code |
| --- | --- | --- |
| Unauthenticated | 401 | `unauthenticated` |
| Authenticated Member on admin wiki route | 403 | `forbidden` |
| Unknown page, unavailable page, or page hidden by role/state | 404 | `wiki_page_not_found` |
| Unknown contribution, another user's contribution, or private draft on admin route | 404 | `wiki_contribution_not_found` |
| Invalid title, body, reviewer note, evidence ref list, filter, cursor, enum, or forbidden field | 422 | `validation_error` |
| Invalid contribution state transition | 409 | `wiki_contribution_state_conflict` |
| Evidence context is unavailable, redacted, unauthorized, stale, or not a completed domain-grounded evidence ref | 409 | `wiki_contribution_context_unavailable` |
| Concurrent/stale page publish conflict | 409 | `wiki_page_conflict` |
| Audit write unavailable for protected admin mutation | 503 | `audit_unavailable` |

All P11 messages are safe and bland. They never echo submitted body text, raw source text, user questions, assistant answers, prompts, provider payloads, runtime targets, storage targets, Docker targets, stack traces, private Source Block ids, credentials, or raw request bodies.
