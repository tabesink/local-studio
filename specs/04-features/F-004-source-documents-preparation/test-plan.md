---
id: F-004
title: Source Documents And Canonical Preparation Test Plan
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-06-30
depends_on: [F-003]
supersedes: []
---


# F-004 - Test Plan

## Required Evidence

| Acceptance | Test type | Scenario |
| --- | --- | --- |
| AC-001 | automated or explicit manual | upload stores immutable original |
| AC-002 | automated or explicit manual | same file hash in same domain rejected |
| AC-003 | automated or explicit manual | Docling and Reducto return same PreparedSource shape |
| AC-004 | automated or explicit manual | failed parse leaves source pending with failed operation |
| AC-005 | automated or explicit manual | retry keeps same frozen parser kind |
| AC-006 | automated or explicit manual | source/domain delete removes rows/files |
| AC-007 | automated or explicit manual | no LightRAG call |

## Regression Checks

- API errors use the canonical safe envelope.
- Authz failures return 401/403 behavior defined by API-001 and PROD-004.
- Safe DTO/log snapshots do not contain forbidden data.
- Migrations, OpenAPI snapshots, SSE fixtures, and visual screenshots are updated when affected.

## Blocked Evidence

If any test cannot be run, mark the feature blocked in `acceptance.md` with the missing dependency and owner.

## Required Additional Checks

- Fresh migration creates `source_documents`, `source_preparation_operations`, `source_blocks`, and `source_images` with documented constraints and without forbidden JSON/path/payload columns.
- Source API safe DTO scan covers upload/list/detail/outline/operations/retry/cancel responses and the OpenAPI snapshot for forbidden fields/values: secret, credential, ciphertext, path, storage, url, runtime, port, container, parserPayload, providerPayload, taskId, jobId, canonicalMarkdown, rawText, sourceText, stack, traceback, and lightrag.
- Storage cleanup tests use a temp `CE_SOURCE_STORAGE_ROOT` and prove duplicate upload rollback, source delete cleanup, and domain delete source purge cleanup.
- Worker tests prove claim/lease, failed parse leaves Source Document `pending` with a failed operation, retry preserves frozen parser kind, cancel fences stale publish, stale workers publish zero rows, and successful publish is all-or-none.
- Parser adapter tests use synthetic non-sensitive fixtures for Docling and Reducto and assert the same `PreparedSource` semantics.
- No-LightRAG proof uses an import/call audit or injected test trap in P4 source services/workers.
