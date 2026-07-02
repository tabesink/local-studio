# ID-A - Index worker and delete fences (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** How should submit, readiness, retry, cancel, and delete avoid stale or duplicate indexed content?

### Decision

Use source-owned index state plus generation/request-id fences. A worker may submit or mark ready only when the Source Document is still prepared, the generation still matches, and the request id still matches. Retry must prove old remote content is absent before a new generation is queued. Delete must clear remote content before local row removal when a source has accepted/ready indexed content.

### Why

| Bad | Good |
| --- | --- |
| timeout retry blindly submits again | retry reconciles by idempotent request id |
| ready poll updates source after cancel | generation mismatch no-ops |
| source delete removes local row first | remote delete before local delete |
| one domain-wide pipeline lock | source-scoped fences |
| new generic jobs table | fields on `source_documents` |

### State Flow

```text
not_requested
  -> queued        after P4 publish
  -> submitting    worker claimed/submitting
  -> accepted      remote accepted request
  -> ready         native ready and generation matches

accepted/ready/failed/cancelled
  -> queued        retry after remote absence proof

queued/submitting/accepted/ready
  -> cancelling    cancel/delete fence
  -> cancelled     remote absent or submit never happened
```

Use DATA-001 enum names exactly after patch.

### Fence Formula

```text
worker_result_is_current =
  source.index_generation == worker_generation
  AND source.index_request_id == worker_request_id
  AND source.state == "prepared"

if false:
  write zero readiness/ready rows
```

### Delete Flow

```text
DELETE source or domain
  -> set local delete/cancel fence
  -> if remote content may exist:
       call private LightRAG delete
       verify absence
  -> remove source files, Source Blocks, Source Document row
```

If remote delete fails, keep the source fenced and record a safe failure. Do not claim completion.

### Implement Order

```text
1. Add state transition helpers.
2. Add claim/lease helper for queued/stale submitting sources.
3. Add submit path with idempotent request id.
4. Add readiness reconcile path.
5. Add retry path with remote absence proof.
6. Add cancel path with stale-ready fence.
7. Extend source/domain delete before local purge.
```

### Red Flags In PR

- Worker updates ready without matching generation/request id.
- Retry creates a new request while old remote content may still exist.
- Delete swallows remote delete failure and removes local rows.
- API route performs long LightRAG calls inside a DB transaction.
- Test fake cannot simulate late ready after cancel/delete.

### Tests

- P4 publish queues index atomically.
- Worker submit marks accepted with request id/hash.
- Native ready transitions only current generation.
- Native failure records safe code/message.
- Retry after timeout does not duplicate remote content.
- Cancel/delete blocks late ready.
- Source/domain delete clears remote before local row deletion.

### One-line Summary

Indexing is a fenced Source Document state machine; stale remote results must be harmless and remote delete must precede local disappearance.
