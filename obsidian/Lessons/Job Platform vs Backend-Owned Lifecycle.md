---
type: lesson
status: active
audience:
  - junior-dev
layer:
  - api
  - worker
  - storage
lifecycle: building
tags:
  - type/lesson
  - layer/api
  - layer/worker
  - layer/storage
  - status/active
  - architecture
---

# Job Platform vs Backend-Owned Lifecycle

What a **job platform** is, why Context Engine avoids it for core domain work, and when each pattern fits a **multi-user** app.

Pair with: [[Backend-Owned Lifecycle]] (CE’s chosen model).

Parent: [[Lessons Index]].

---

## Goal

After this lesson you can explain:

- how a Redis/Celery-style **job platform** works;
- how that differs from CE’s **Postgres lease** model;
- why “multi-user” alone does not force Redis;
- when to pick one pattern over the other (and when a hybrid is OK).

---

## Why this matters

Junior devs often reach for “add a queue” when uploads feel slow or workers feel missing. That can be right — but for the **wrong layer**.

CE’s core product is **Knowledge Domain + Source Document lifecycle** (prep → index → eligibility → redaction). Those states are the feature. Specs reject Redis/RQ/Celery for the runnable stack because the **product tables are the queue**.

Peripheral work (bulk export, email digests, one-off ML batch) may someday belong on a queue — but that is a **new spec slice**, not a casual refactor of prep/index/delete.

---

## Mental model — job platform

```text
API receives request
  → push opaque task JSON to Redis queue
     { "type": "parse_pdf", "sourceId": "abc", "retry": 0 }
  → return 202 Accepted (or job id)

Worker pool (any N processes)
  → BRPOP / consume from queue
  → dispatch by task type
  → run handler (maybe update DB at end)

Product truth
  → may live in a separate jobs table, cache, or only in worker memory
  → “source ready?” might require joining queue state + DB + object store
```

**Opaque task** = worker knows a handler name + ids, not necessarily your full domain schema. **Random worker** = any idle consumer can pick the next message.

---

## Mental model — backend-owned lifecycle (CE)

```text
API receives request
  → INSERT/UPDATE product row (status = queued)
  → return safe DTO (201/200)

Worker loop
  → SELECT … FOR UPDATE SKIP LOCKED (claim lease on that row)
  → transition same row (preparing → ready → indexed / failed)
  → repeat

Product truth
  → always in Postgres: source_documents, *_operations, index_state
  → GET /sources answers “where is my upload?” directly
```

See [[Backend-Owned Lifecycle]] for CE walkthrough (upload → chat → delete).

---

## Side-by-side

| | **Job platform** | **Backend-owned lifecycle (CE)** |
| --- | --- | --- |
| Queue store | Redis, SQS, RabbitMQ | Product tables + lease columns |
| Work unit | Message / task type | Row with FKs (`domain_id`, `source_id`) |
| Worker knowledge | Generic handlers | Domain workers (`SourcePreparationWorker`, …) |
| Source of truth | Often split (queue + DB + cache) | Postgres rows |
| Scale workers | Add consumers; queue absorbs burst | Add worker processes; watch DB lock contention |
| Debug “stuck?” | Trace queue depth + job id + logs | `SELECT status FROM … WHERE id = ?` |
| Multi-user isolation | You encode in handlers | FK + authz on same rows |
| CE pilot fit | Rejected for core lifecycle | Current architecture |

---

## Walkthrough — same upload, two designs

**Job platform style (not CE):**

```text
POST /upload
  → LPUSH jobs '{"job":"prepare_source","sourceId":"s1"}'
  → 202 { "jobId": "j-99" }

Worker 7 pops job
  → parses PDF, writes blocks somewhere
  → LPUSH jobs '{"job":"index_source","sourceId":"s1"}'

Frontend
  → GET /jobs/j-99  (separate status API)
```

**CE style:**

```text
POST /admin/domains/{id}/sources
  → source_documents + source_preparation_operations (queued)
  → 201 { safe source DTO }

SourcePreparationWorker.run_once()
  → claims prep row → prepared

SourceIndexWorker.run_once() × 2
  → index_state → ready

Frontend
  → GET /admin/domains/{id}/sources  (product DTO, no job id)
```

---

## Multi-user apps — what actually changes?

Both patterns support many users. The choice is **what you optimize for**.

| Concern | Job platform | CE lifecycle |
| --- | --- | --- |
| 50 users upload at once | Queue buffers spike; scale worker count | More `run_once` loops; monitor DB locks |
| User A vs User B | Must enforce in every handler | `domain_id` / authz on rows |
| “Where is my file?” | Job id + status endpoint | Source list / operation status on entity |
| Audit trail | Separate job log + maybe DB | Operation rows + audit events |
| Ops surface | Redis + workers + DB | Postgres + workers |
| When CE might outgrow leases | — | Sustained high contention, worker fleet >> 10, many unrelated async job types |

**Rule of thumb:**

```text
If the question is "what state is this entity in?"
  → product tables (CE way)

If the question is "run this side effect sometime"
  → queue may be fine (job platform way)
```

---

## When to prefer a job platform

Choose Redis/SQS/Celery-style queues when:

1. **Many unrelated job types** — email, thumbnails, webhooks, reports, ETL — not one cohesive domain workflow.
2. **Burst scaling** — need 50 workers for 10 minutes, then 2; scale independently of API.
3. **Fire-and-forget side effects** — failure of job #47 does not define product truth for entity #12.
4. **Large horizontal worker fleet** — hundreds of consumers; DB-as-queue becomes a hot spot.
5. **Cross-service choreography** — Service A enqueues; B/C consume; no single DB owns the story.
6. **Strict API latency** — enqueue is O(1); request thread never touches heavy work.

Examples: image resize pipelines, “send 10k emails”, video transcoding, webhook delivery.

---

## When to prefer backend-owned lifecycle (CE)

Choose Postgres leases when:

1. **Workflow is the product** — prep, index, query eligibility, redaction on delete.
2. **Strong consistency** — “Is this source searchable?” must be one query, not queue + DB + cache.
3. **Pilot / small–medium scale** — single-digit workers, simpler ops.
4. **Compliance & audit** — every transition is a row with timestamps and safe metadata.
5. **Row-scoped authorization** — member/admin/domain on the same tables workers touch.
6. **Explicit product decision** — CE specs reject generic job infrastructure for core paths.

---

## Hybrid (future, not default)

Common mature pattern:

```text
Postgres leases  →  domain/source prep, index, delete (CE core)
Job queue        →  bulk reindex-all, exports, email digests, ML batch
```

Adding a queue for **peripheral** jobs does not require moving prep/index off Postgres. Requires new contracts — do not implement without a spec slice.

---

## Golden rules for CE juniors

```text
Do NOT add Redis for "multi-user" alone — pilot uses Postgres leases + one worker service.

Do NOT treat upload 201 as "RAG works" — lifecycle rows must reach eligible states.

DO ask: is this work defining product state, or a side effect?

DO read specs before introducing queue infrastructure — F-010 rejects Redis/RQ/Celery for runnable stack.
```

---

## Checkpoint questions

1. In a job platform, where might “job is running” live if not on the product row?
2. Why can CE answer “is source s1 indexed?” without a separate `/jobs` API?
3. Name two workloads that fit a queue well but are **not** CE core lifecycle.
4. What happens if two workers pop the same Redis message vs two CE workers claim the same row?
5. At what scale might CE reconsider DB-as-queue for prep/index?

---

## Mini exercise

Your teammate says: *“We have 20 users now — we need Redis and Celery like every real app.”*

Write 6–8 sentences arguing **for CE’s current model** or **for adding a queue**, using:

- whether prep/index state is product truth;
- ops cost (Redis + monitoring);
- what breaks if product state lives “outside your tables”;
- one example job that **should** stay on Postgres leases in CE.

---

## Expected answer (sketch)

- CE prep/index/delete **is** product state — `index_state`, operation status, query eligibility are the feature; splitting to opaque Redis tasks would duplicate truth and complicate audit/redaction.
- 20 users does not by itself require Redis; CE pilot assumes one worker + Postgres leases; bottleneck evidence comes first (lock contention, queue depth on tables).
- Job platform shines for **side effects** (export all domains, send digest email) where failure does not leave “what state is this source in?” ambiguous.
- Two Redis consumers usually get different messages (with ack); two CE workers use `FOR UPDATE SKIP LOCKED` so only one claims a given row.
- Revisit when sustained concurrency on same tables or many unrelated async types justify hybrid — not as default junior fix.
- **Stay on leases:** source preparation, LightRAG index submit/complete, domain delete + redaction.

---

## Common mistakes

| Mistake | Reality |
| --- | --- |
| “Multi-user ⇒ Redis” | Both patterns scale users; choose by workflow shape |
| “Queue = faster” | Queue decouples latency; does not replace domain model |
| “Job id is enough for UI” | CE UI reads source/domain DTOs, not worker internals |
| “Move everything to Celery” | Violates CE architecture; specs reject for core stack |
| “Hybrid without spec” | Peripheral queue OK later; core lifecycle needs contract |

---

## Related

- [[Lessons Index]]
- [[Backend-Owned Lifecycle]] — CE model in depth
- [[Build Order Index]] — P4 prep, P5 index, P10 runnable stack
- [[F-012 Scope Boundaries]] — what CE does not port (Local Studio agent runtime)

## Repo sources

- `specs/04-features/F-010-shared-node-operations/spec.md` — no Redis/RQ/Celery for runnable stack
- `specs/04-features/F-010-shared-node-operations/acceptance.md` — AC-006 compose audit
- `specs/03-contracts/data/context-engine-data.md` — operation leases, claim rules
- `scripts/p10_safety_scan.py` — rejects stale worker/Redis patterns in compose
- `AGENTS.md` — backend owns lifecycle; no invented infrastructure
- `CONTEXT.md` — Knowledge Domain, Source Document, Query Eligibility vocabulary
