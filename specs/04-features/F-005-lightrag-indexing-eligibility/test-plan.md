---
id: F-005
title: LightRAG Indexing And Query Eligibility Test Plan
status: implemented
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-004]
supersedes: []
---


# F-005 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | P4 publish queues index in same DB transaction |
| AC-002 | automated or explicit manual | native ready transitions to ready |
| AC-003 | automated or explicit manual | native fail sets safe index error |
| AC-004 | automated or explicit manual | retry uses new generation after old remote absent |
| AC-005 | automated or explicit manual | cancel/delete blocks late ready |
| AC-006 | automated or explicit manual | source/domain delete clears remote before local row deletion |
| AC-007 | automated or explicit manual | no duplicate remote content after timeout/retry |

## Required Additional Checks

- Pinned LightRAG fixture imports from `vendor/lightrag/` and proves private runtime health, typed provider/embedding injection, deterministic submit, idempotent repeat submit, native readiness observation, remote delete, remote absence verification, `CE_BLOCK` marker preservation, and late-ready-after-delete/cancel fencing. Fixture evidence must be safe: no endpoint URLs, credentials, provider payloads, raw LightRAG payloads, rendered input, Source Block content, stack traces, or storage paths.
- Fresh migration creates approved `source_documents.index_*` fields with documented defaults/checks and no rendered-input, raw payload, provider payload, generic metadata/config JSON, index history, status mirror, query log, or generic jobs table.
- Golden render tests prove deterministic `CE_SOURCE`/`CE_BLOCK` output, stable hash, every Source Block id exactly once, rejection for non-prepared/zero-block sources, no parser/original-file reads, and no rendered-text persistence/logging.
- Worker tests prove queued claim/lease behavior, submit accepted, native ready only for current generation/request id, native failure stores safe index error details, timeout reconcile uses idempotent request id, retry does not duplicate remote content, cancel fences stale ready, and delete fences stale ready.
- Source delete tests prove accepted/ready remote content is deleted and verified absent before local Source Document rows/files/blocks/images are removed; remote delete failure keeps the source fenced and does not claim `204` success.
- Domain delete tests prove indexed remote content for all sources is cleared and absent before local P4 source purge and final Knowledge Domain hard delete.
- API tests prove index retry/cancel are Administrator-only, use safe source-summary responses, reject members, update OpenAPI snapshots, and return canonical safe errors.
- Eligibility unit tests prove `source_is_query_eligible()` is true only for an available Knowledge Domain with a prepared, ready, current-generation source and no delete/cancel fence; every missing condition returns false.

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.
- Safe DTO/log scans reject forbidden P5 fields/values: secret, credential, ciphertext, path, storage, url, runtime, remoteDocumentId, indexRequestId, indexContentHash, indexGeneration, indexLeaseOwner, parserPayload, providerPayload, lightragPayload, canonicalMarkdown, rawText, sourceText, rendered, prompt, stack, traceback.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner. If the pinned LightRAG fixture cannot prove `CE_BLOCK` preservation, idempotent submit, readiness, deletion/absence, delete-after-ready fencing, or typed secret injection, do not implement migration/service/worker code.
