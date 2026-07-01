# ID-A - Preparation worker (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** What worker/concurrency pattern should P4 use?

### Decision

Use `source_preparation_operations` as the only P4 async operation table. A worker claims queued operations with lease fields, runs parser normalization outside long DB transactions, and publishes Source Blocks only when the source generation still matches.

No Redis, RQ, Celery, generic jobs table, event bus, or workflow framework in P4.

### Why

| Bad | Good |
| --- | --- |
| generic job queue copied from old code | source-owned operation rows |
| DB transaction held while parser runs | claim, commit, parse, then publish with fence |
| cancel flag ignored by publish | generation fence blocks stale publish |
| retry creates duplicate source row | retry creates operation for same source |
| partial blocks remain after crash | all-or-none publish |

### Operation Flow

```text
claim:
  queued op -> running
  set lease_owner, lease_expires_at, started_at

parse:
  read immutable original privately
  call adapter
  build PreparedSource

publish:
  reload source
  require source.state == pending
  require source.preparation_generation == op.generation_at_start
  delete previous unpublished rows for source if contract allows
  insert source_blocks + source_images
  set source.state = prepared
  set op.status = succeeded

fail:
  source.state stays pending
  op.status = failed
  op.error_code/message safe
```

### Cancel/Retry Fence

```text
retry:
  source.preparation_generation += 1
  enqueue new op with new generation

cancel:
  source.preparation_generation += 1
  active op -> cancelled when claim can observe it

stale worker:
  generation mismatch -> do not publish
```

### Implement Order

```text
1. Repository: active operation lookup.
2. Repository: claim next queued operation.
3. Repository: conditional publish by source id + generation.
4. Worker service with injected parser adapters.
5. Retry/cancel service methods.
6. Tests for crash, stale generation, cancel, retry.
```

### Red Flags In PR

- Worker imports LightRAG client in P4.
- Parser call happens inside an open DB transaction.
- Cancel only changes operation status but not generation.
- Retry creates a new Source Document.
- Failed operation sets source state to `failed`.
- Lease fields live in a generic table.

### Tests

- Worker claims one operation and sets lease fields.
- Second active operation for the same source is rejected.
- Parser failure leaves source pending and op failed.
- Stale worker publish writes zero Source Blocks.
- Cancel prevents later publish.
- Retry keeps same source id and parser kind.
- Publish is all-or-none.

### One-line Summary

P4 worker is a small source-prep worker with leases and generation fencing, not a generic queue system.
