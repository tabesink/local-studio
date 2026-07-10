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
---

# Backend-Owned Lifecycle

Why Context Engine uses **Postgres rows + worker leases** instead of Redis/Celery/RQ.

Parent: [[Lessons Index]].

---

## Goal

After this lesson you can explain:

- what “backend-owned lifecycle” means in CE;
- why the browser never starts background jobs;
- how `SourcePreparationWorker`, `SourceIndexWorker`, and `DomainDeleteWorker` fit together;
- why Slice 0 adds **one `worker` service** to the runnable stack.

---

## Why this matters

Without workers, the app is a **login shell**. Uploads sit in `queued` forever. Index never runs. Chat has no eligible domain evidence.

CE product identity:

| CE is | CE is not |
| --- | --- |
| Admin-curated domains, source prep, LightRAG index, query eligibility | A generic job platform |
| Server decides when a source/domain is ready | Browser enqueueing tasks |
| Postgres rows + leases as the queue | Redis/RQ/Celery workers |

Specs explicitly reject Redis/RQ/Celery for the runnable stack. The queue **is your product tables**.

---

## Mental model

```text
User action (API)
  → write row: status = queued
  → return safe DTO immediately

Worker loop (backend process)
  → ask Postgres: any claimable work?
  → lock one row (lease)
  → do work (parse / index / delete)
  → update status
  → repeat

Browser
  → polls safe status DTOs only
  → never talks to worker, Docker, LightRAG, or storage paths
```

**Lease** = temporary lock on a row. If the worker crashes, the lease expires and another `run_once` can reclaim the job.

---

## Walkthrough — upload to chat

**1. Admin uploads a Source Document**

```text
POST /admin/domains/{id}/sources
  → inserts source_documents
  → inserts source_preparation_operations (status=queued)
  → API returns 201 with safe status fields
```

**2. Worker prepares the source**

```text
SourcePreparationWorker.run_once(db)
  → claims queued prep operation (Postgres row lock)
  → parses file → Canonical Source + Source Blocks
  → marks prepared / failed / cancelled
```

**3. Worker indexes into LightRAG**

```text
SourceIndexWorker.run_once(db)   # submit pass
SourceIndexWorker.run_once(db)   # completion pass
  → domain must be running + query eligibility checks pass
  → index_state moves toward ready
```

**4. Member chats (domain RAG)**

```text
POST /conversations/{id}/turns:stream
  → server checks query eligibility (not just “index finished”)
  → retrieves Evidence → streams answer + citations
```

**5. Admin deletes source or domain**

```text
DomainDeleteWorker.run_once(db)  # when domain delete is queued
  → tears down runtime/storage safely
  → redaction hook clears affected turn answer/citations
```

Reference flow in tests: `scripts/pilot_gate.py` (`_run_source_workers`, full pilot path).

---

## One worker service (Slice 0)

For pilot, **one compose `worker` service** round-robins:

```text
while running:
  SourcePreparationWorker.run_once()
  SourceIndexWorker.run_once()
  DomainDeleteWorker.run_once()
  sleep(poll_interval)
```

Why one service, not three:

- Same product concern: move domain/source lifecycle forward.
- Pilot assumes single worker process + isolated API port.
- Split only when evidence shows lease contention or crash blast-radius problems.

---

## Golden rules (do not break)

```text
Browser NEVER: enqueue jobs, call worker URLs, pass storage/runtime paths
Browser ONLY:   call CE API; read safe status DTOs

API NEVER:      do long parse/index/delete inline on the request thread
API ONLY:       enqueue rows; return safe status

Worker NEVER:   expose secrets, raw source text, or LightRAG payloads to clients
Worker ONLY:    claim leases; update product tables; call private services
```

---

## Checkpoint questions

1. Where does “work waiting to happen” live — Redis or Postgres?
2. Who claims a queued source preparation job — the browser or `SourcePreparationWorker`?
3. Why can chat still fail after upload if index is not `ready`?
4. What happens if a worker dies mid-job?
5. Why is one `worker` container enough for pilot?

---

## Mini exercise

Trace this scenario in your own words (5–8 sentences):

> Admin uploads `manual.pdf` to domain `safety-docs`. Member opens `/chat`, selects that domain, asks “What PPE is required?” — but gets no grounded evidence.

List:

- which table/operation rows are involved;
- which worker(s) must have run;
- one API check that blocks the turn even if upload returned 201.

---

## Expected answer

- Upload creates `source_documents` + a **queued** `source_preparation_operations` row (and later index fields on the source).
- **`SourcePreparationWorker`** must run (parse → blocks). Then **`SourceIndexWorker`** must run twice (submit + complete) until `index_state = ready` and query eligibility passes.
- Upload 201 only means “accepted,” not “searchable.” Chat needs **query eligibility** — domain running, index ready, no delete fence, authz OK.
- If a worker dies, the **lease expires**; the next `run_once` can reclaim the same queued/running row.
- One worker service is enough because prep/index/delete share the same Postgres lease pattern and pilot load is small.

---

## Common mistakes

| Mistake | Reality |
| --- | --- |
| “Upload finished, so RAG works” | Upload queues prep; workers + index must finish |
| “Add Redis so jobs are faster” | Rejected architecture; use Postgres leases |
| “Frontend polls worker port” | Browser only calls `/api/v1`; workers are private |
| “API should parse PDF inline” | Long work belongs on worker loop, not request thread |
| “Three worker containers day one” | Over-ops for pilot; split when proven necessary |

---

## Related

- [[Lessons Index]]
- [[Job Platform vs Backend-Owned Lifecycle]] — contrast and multi-user tradeoffs
- [[F-012 Junior Dev Cheat Sheet]] — chat/ref rules (browser vs server)
- [[F-012 Scope Boundaries]] — what CE does not port from Local Studio
- [[Build Order Index]] — P4 prep, P5 index, P7 chat phases
- [[Architecture Index]] — component boundaries (when restored)

## Repo sources

- `context_engine/services/sources.py` — `SourcePreparationWorker`
- `context_engine/services/indexing.py` — `SourceIndexWorker`
- `context_engine/services/domains.py` — `DomainDeleteWorker`
- `scripts/pilot_gate.py` — full in-process worker + chat proof
- `specs/04-features/F-010-shared-node-operations/spec.md` — runnable stack; worker deferral being closed in Slice 0
- `specs/03-contracts/data/context-engine-data.md` — operation statuses, leases, claim rules
- `AGENTS.md` — backend owns lifecycle; browser never talks to LightRAG/Docker directly
