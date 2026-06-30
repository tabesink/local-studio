# P5 - LightRAG Indexing And Query Eligibility

Goal: prepared Source Documents enter private LightRAG runtime. Source becomes query-eligible only after native ready proof.

## Build

- pinned LightRAG contract fixture.
- typed provider-secret injection proof.
- `source_documents.index_*` fields.
- deterministic `render_lightrag_input()`.
- one concrete private LightRAG client.
- source worker submit/readiness/delete paths.
- idempotent index request ID.
- native readiness polling.
- manual retry.
- cancel/delete fencing.
- remote delete before local delete.
- one query eligibility predicate.

## Blocking Fixture

Before business code, prove against real pinned LightRAG:

1. provider-free health runtime works.
2. typed runtime bootstrap config can inject provider secrets at process start.
3. submit accepts stable idempotency key or equivalent.
4. timeout after submit can reconcile without duplicate content.
5. receipt supports native readiness.
6. receipt supports exact source deletion.
7. retrieval output preserves `CE_BLOCK` identity for P6.
8. delayed ready after delete cannot restore content.

If any fail, stop and lock direction with human.

## LightRAG Input

Render one Source Document as deterministic text:

```text
[CE_SOURCE id=<source-id> schema=1 sha256=<hash>]

[CE_BLOCK id=<source-block-id> order=42 page=12 section="Results > Fatigue"]
canonical block Markdown
```

Same prepared source -> same rendered text and hash.

Do not persist rendered input as a product entity.

## Index State

```text
not_requested
queued
submitting
accepted
ready
failed
cancelling
cancelled
```

Ready only when:

```text
source.state == prepared
AND source.index_state == accepted
AND index_generation matches
AND native LightRAG ready
```

## Query Eligibility

One function:

```python
source_is_query_eligible(source, domain)
```

True only when:

```text
domain running and available
source prepared
index_state ready
index_ready_at present
no delete/cancel fence
```

P6 must call this function, not copy conditions.

## Do Not Build

- retrieval UI
- evidence cards
- chat
- local embeddings/vector/BM25
- custom graph processing
- second index worker
- status mirror table
- index history table
- auto retry/repair
- embedding migration
- browser LightRAG access
- runtime env/config files

## API Contract

Admin source API from P4 extends with:

```text
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/retry
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/cancel
```

Source delete becomes:

- local-only source -> `204` after row/file removal.
- indexed/indexing source -> `202`, fence first, worker deletes remote content, then removes local rows/files.

## Test Gate

- P4 publish queues index in same DB transaction.
- worker submits deterministic payload.
- native ready transitions to `ready`.
- native fail sets safe index error.
- retry uses new generation/request ID after old remote absent.
- cancel/delete blocks late ready.
- source/domain delete clears remote content before local row deletion.
- no duplicate remote content after retry/timeouts.
- no private IDs/secrets/runtime URLs/raw LightRAG payload in API/logs.

## Handoff

P6 can retrieve from selected domain runtime and map hits back to exact eligible Source Blocks.

