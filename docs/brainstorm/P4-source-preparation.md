# P4 - Source Preparation

Status: PLANNED

## Context Packet

Build admin source upload and canonical preparation. Source documents keep immutable originals and publish flat ordered blocks/images after parser-neutral validation.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p4-source-preparation-plan.md`.

## Previous Slice Provides

P3 provides domains, private data roots, lifecycle fences, and the worker process that P4 extends.

## This Slice Changes

- add `source_documents`, `source_preparation_operations`, `source_blocks`, and `source_images`;
- add source storage paths under the domain instance;
- implement upload with original promotion cleanup;
- snapshot active parser kind at upload;
- implement Docling and Reducto parser adapters behind a parser-neutral DTO;
- implement prepared output validation and all-or-none publish;
- extend worker for claim, lease, cancel, retry, and stale generation guards;
- add safe admin source, outline, operation, retry, cancel, and delete routes.

## This Slice Must Not Rework

- no LightRAG calls;
- no embeddings, vectors, graph, retrieval, evidence, or chat;
- no persisted parser-native payload;
- no tree/source-node model;
- no original/image download;
- no Redis/RQ/Celery/generic jobs.

## Next Slice Can Assume

P5 can read stable source block UUIDs, ordered block content, source metadata, parser kind, and immutable original information.

## Acceptance Criteria

- migration `0004` runs after P3.
- admin upload stores immutable original and queues preparation.
- duplicate original hash in the same domain is rejected.
- parser output maps to valid flat blocks/images.
- failed parse leaves source pending with failed operation.
- retry reuses the same source and same frozen parser kind.
- cancel prevents stale worker publish.
- source hard delete removes rows/files.
- domain delete purges sources before domain row removal.
- no P4 API response/log exposes paths, parser secrets, native payloads, or raw parser errors.

