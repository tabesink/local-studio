# P5 - LightRAG Indexing And Eligibility

Status: PLANNED

## Context Packet

Build deterministic handoff from prepared sources into private LightRAG runtimes. A source becomes query-eligible only after native LightRAG ready is verified.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p5-lightrag-indexing-plan.md`.

## Previous Slice Provides

P4 provides prepared source documents with stable block IDs, ordered canonical Markdown, and a worker that can be extended.

## This Slice Changes

- prove pinned LightRAG submit/readiness/delete/stable identity fixture;
- prove runtime provider-secret injection;
- add source index fields in migration `0005`;
- implement deterministic `render_lightrag_input`;
- implement one private LightRAG client;
- extend worker for queued submit, stale submit recovery, readiness sweep, cancellation, and remote cleanup;
- define and export one query eligibility predicate;
- extend source/domain delete to remove remote content before local row removal when indexed.

## This Slice Must Not Rework

- no local embeddings/vector/graph/BM25 fallback;
- no second index worker or status poller;
- no index history table;
- no embedding lock field;
- no browser LightRAG route;
- no retrieval UI/evidence/chat;
- no persisted provider secrets or runtime env files.

## Next Slice Can Assume

P6 can call one private retrieval method on the existing LightRAG client and can reuse `source_is_query_eligible()` without copying conditions.

## Acceptance Criteria

- contract fixture proves idempotent submit, timeout recovery, readiness, exact delete, stable source identity, delayed-ready-after-delete safety, and secret injection.
- prepared source queues one index request in the same transaction as P4 publish.
- native ready transitions source to `ready`.
- failed native status leaves source prepared with safe index error.
- retry uses a new generation and request ID only after old remote content is absent.
- cancel/delete fences late ready results.
- source/domain delete clears remote content before deleting local source rows.
- tests prove no duplicate remote content and no private IDs/secrets in API/logs.

