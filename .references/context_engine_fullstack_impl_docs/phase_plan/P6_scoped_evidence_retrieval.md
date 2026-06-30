# P6 - Scoped Evidence Retrieval

Goal: user asks one Knowledge Domain question and gets safe evidence cards. No answer synthesis.

## Build

- one member evidence endpoint.
- query target resolver.
- private `LightRAGClient.retrieve()`.
- strict `CE_BLOCK` marker parser.
- exact Source Block mapper.
- safe evidence DTO.
- minimal evidence UI if frontend exists.
- safe retrieval diagnostics/logs.

## Resolved Tensions

- P6 does **not** build source navigation, source refs, asset refs, or source-view route.
- Query target is selected domain, not active source.
- A domain may have many Source Documents. Any returned block can map only if its owning source is currently query-eligible.

## Flow

```text
question
-> auth
-> load selected domain
-> verify domain available
-> verify at least one query-eligible source exists
-> private LightRAG retrieve
-> parse exact CE_BLOCK marker in each raw hit
-> load SourceBlock
-> load owning Source Document
-> verify source.domain_id == selected domain
-> call source_is_query_eligible(source, domain)
-> build safe evidence card from canonical block text
```

Raw LightRAG hit is not evidence.

Discard hit when:

- no marker
- multiple markers
- marker unknown
- block belongs to other domain
- owning source not query-eligible
- source/domain deleting
- mapping needs fuzzy/nearest match

## API Contract

```text
POST /api/v1/domains/{domain_id}/evidence
```

Request:

```json
{ "question": "What inspection interval applies?" }
```

Extra fields rejected with `422`.

Response:

```json
{
  "kind": "evidence",
  "evidence": [
    {
      "evidenceId": "e1",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceLabel": "Fatigue Manual - Inspection - Page 12"
    }
  ]
}
```

No grounded context:

```json
{ "kind": "no_grounded_context", "evidence": [] }
```

Never return source ID, block ID, document ID, asset ID, path, raw score, raw hit, runtime URL, LightRAG ID, provider config.

## Server Constants

Server-owned. No browser override.

```text
QUESTION_MAX_CHARS = 4000
RAW_HIT_LIMIT = 12
EVIDENCE_LIMIT = 8
EVIDENCE_EXCERPT_MAX_CHARS = 1200
LIGHTRAG_RETRIEVAL_TIMEOUT_SECONDS = 15
```

## Do Not Build

- synthesis
- SSE
- chat history
- query persistence
- source navigation
- source/document selector
- retrieval config UI
- browser top-k/reranker/mode
- local fallback retrieval
- automatic retry
- durable evidence/citation table

## Test Gate

- fixture proves `CE_BLOCK` survives retrieval.
- active domain with ready sources returns evidence.
- no eligible source -> `409 no_query_eligible_source`.
- all hits discarded -> `200 no_grounded_context`.
- foreign/deleted/ineligible markers discarded.
- response shape excludes private IDs/paths/raw payloads.
- P7 private callable uses same mapper as public evidence route.

## Handoff

P7 can call `query_evidence()` and trust every returned item maps to current eligible Source Blocks.

