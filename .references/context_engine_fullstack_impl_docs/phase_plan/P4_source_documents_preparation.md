# P4 - Source Documents And Canonical Preparation

Goal: admin uploads Source Documents into a Knowledge Domain. Worker normalizes parser output into flat canonical Source Blocks.

## Build

- multiple Source Documents per Knowledge Domain.
- immutable original file.
- frozen `parser_kind` on upload.
- `source_documents`.
- `source_preparation_operations`.
- `source_blocks`.
- `source_images`.
- `PreparedSource` temporary DTO.
- Docling adapter.
- Reducto adapter.
- canonical validator.
- Postgres worker claim/lease/cancel/retry.
- all-or-none publish.
- safe admin source APIs.
- domain delete purges sources first.

## Canonical Model

No persisted document tree.

`SourceDocument` is root.

`SourceBlock` stores:

- stable UUID.
- `source_document_id`.
- `source_order`.
- `kind = text | table | figure`.
- canonical Markdown.
- optional heading level.
- optional page range.
- `section_path`.

`SourceImage` links to figure block only.

Do not store Docling JSON, Reducto JSON, parser task ID, parser URL, raw parser error, native payload, credential, or parser config JSON.

## State

Source:

```text
pending | prepared | deleting
```

Preparation operation:

```text
queued | running | succeeded | failed | cancelled
```

Generation fences stale worker publish:

```text
preparation_generation
```

## Do Not Build

- LightRAG calls
- embeddings/vector/graph/retrieval
- chat/evidence/citations
- member source viewer
- original download
- image download
- source replace/version UI
- folders/annotations/archive
- Redis/RQ/Celery/workflow engine
- parser-native API output

## API Contract

```text
POST   /api/v1/admin/domains/{domain_id}/sources
GET    /api/v1/admin/domains/{domain_id}/sources
GET    /api/v1/admin/domains/{domain_id}/sources/{source_id}
GET    /api/v1/admin/domains/{domain_id}/sources/{source_id}/outline
GET    /api/v1/admin/domains/{domain_id}/sources/{source_id}/operations
POST   /api/v1/admin/domains/{domain_id}/sources/{source_id}/retry
POST   /api/v1/admin/domains/{domain_id}/sources/{source_id}/cancel
DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}
```

No member source-content routes in P4.

## Resolved Tension

Old P4/P5 text says `IndexUnitBuilder`. Use P5 `render_lightrag_input()` instead. No persisted IndexUnit rows or builder framework.

## Test Gate

- upload stores immutable original.
- same file hash in same domain rejected.
- Docling and Reducto both return same `PreparedSource` shape.
- validator rejects unsafe/invalid output.
- failed parse leaves source `pending` with failed operation.
- retry keeps same Source Document and same frozen parser kind.
- cancel blocks stale publish.
- worker crash becomes safe failed/cancelled operation.
- source delete removes rows/files.
- domain delete removes sources before domain row disappears.
- no LightRAG call.
- no path/secret/native parser payload/raw parser error in API/logs.

## Handoff

P5 can read stable Source Block IDs and ordered canonical Markdown for deterministic LightRAG handoff.

