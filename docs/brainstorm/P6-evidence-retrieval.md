# P6 - Evidence Retrieval And Source Navigation

Status: PLANNED

## Context Packet

Build member evidence retrieval for one selected active domain. Return only evidence mapped to exact authorized source blocks. No answer synthesis.

Read first: `docs/backend/p0-shared-contract.md`, `docs/backend/p6-evidence-retrieval-plan.md`.

## Previous Slice Provides

P5 provides query-eligible sources, a private LightRAG client, and deterministic block markers in indexed content.

## This Slice Changes

- prove `CE_BLOCK` markers survive retrieval in pinned LightRAG fixture;
- add private `retrieve()` to LightRAG client;
- add query target resolver for selected domain;
- implement strict raw-hit marker parsing and exact block mapping;
- mint opaque source and asset refs;
- add focused source-view and safe image streaming routes;
- add member evidence query endpoint and minimal browser slice if frontend exists.

## This Slice Must Not Rework

- no answer generation;
- no chat history;
- no local semantic fallback or hybrid merge;
- no browser source/document selection;
- no raw original download;
- no evidence/query/source-ref persistence;
- no raw LightRAG hit in browser DTOs.

## Next Slice Can Assume

P7 can call an in-process mapped-evidence function that uses the exact same mapper as the public evidence route.

## Acceptance Criteria

- active domain with ready source returns mapped evidence.
- domain with multiple eligible sources can return evidence from multiple sources.
- zero eligible sources returns `409 no_query_eligible_source`.
- raw hits with missing, multiple, unknown, foreign, deleted, or ineligible markers are discarded.
- all hits discarded returns `no_grounded_context`.
- source refs expire, are opaque, and re-check eligibility on open.
- source view returns only focus block plus safe adjacent context and linked images.
- responses exclude source IDs, block IDs, asset IDs, storage paths, LightRAG IDs, raw scores, and raw payloads.

