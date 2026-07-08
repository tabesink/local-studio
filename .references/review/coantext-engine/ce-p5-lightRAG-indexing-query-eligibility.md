# Context Engine — Phase 5: Private LightRAG Indexing + Query Eligibility

**Status:** Greenfield implementation plan
**Build style:** API-first. One PostgreSQL worker. Low entropy.
**Depends on:** Phase 1 auth; Phase 2 trusted provider/model config; Phase 3 private domain runtime; Phase 4 prepared source blocks.

---

# 0. Goal

Prepared source documents index into correct private LightRAG domain runtime.

Source becomes query-eligible only after native LightRAG reports ready.

```text
Phase 4

original
  -> parser
  -> PreparedSource
  -> flat SourceBlocks + SourceImages
  -> source state=prepared

Phase 5

prepared source
  -> render deterministic LightRAG input
  -> private LightRAG submit
  -> native readiness check
  -> source index_state=ready
  -> query eligible

Later Phase 6

eligible source
  -> scoped LightRAG retrieval
  -> mapped evidence
  -> authorized source navigation
```

Phase 5 does not build retrieval UI, evidence cards, chat, citations, local vectors, local BM25, local graph processing, or synthesis.

---

# 1. Final Decisions

```text
LightRAG
  = only semantic retrieval owner.
  = only vector owner.
  = only graph owner.
  = only native indexing-status owner.

Context Engine
  = source-document owner.
  = source-block owner.
  = handoff owner.
  = query-eligibility owner.
  = deletion-fence owner.

One source worker
  = preparation.
  = LightRAG submit.
  = LightRAG readiness polling.
  = remote cleanup routing.
```

No:

```text
second index worker
source_index_handoffs table
status-mirroring table
status-poller service
Redis
RQ
Celery
event bus
workflow engine
local embeddings
local vectors
local graph entities
semantic fallback
automatic retry
automatic repair
private LightRAG bridge by default
```

---

# 2. Scope

## Build

```text
one private LightRAG client
one pinned LightRAG API contract
one deterministic source-to-LightRAG render function
one current index state per source
stable submit idempotency key
native LightRAG readiness polling
manual retry
cancel fence
remote delete before local delete
domain-delete routing
embedding lock after first ready source
one query-eligibility predicate
safe admin index state
```

## Do not build

```text
browser LightRAG access
LightRAG WebUI access
second retrieval system
BM25
local vector DB
local graph DB
custom graph processing
custom reranking
generic job framework
index-attempt history
remote status history
remote status JSON storage
per-row polling schedules
automatic retry
automatic reindex
embedding migration
bulk reindex UI
multi-domain retrieval
chat
citations
```

---

# 3. Core Rule

```text
Prepared source
  != query eligible.

LightRAG accepted
  != query eligible.

Only:

prepared source
  + current index request
  + native LightRAG ready
  + active domain
  + no delete/cancel fence

  -> query eligible.
```

Context Engine stores local safety facts.

LightRAG stores indexing internals.

```text
Context Engine stores:
  current index intent
  current receipt
  final ready fact
  safe failure code

LightRAG stores:
  queue state
  pipeline state
  graph/vector state
  native document status
  internal failures
```

No duplicated remote status database.

---

# 4. Simple Terms

| Term             | Meaning                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------- |
| Source document  | Phase 4 immutable uploaded source.                                                       |
| Source block     | Phase 4 canonical flat source content unit.                                              |
| LightRAG input   | Deterministic rendered text sent for one source. Not persisted as entity.                |
| Index request    | Current attempt to index one source generation.                                          |
| Request ID       | Stable private idempotency key for one index request.                                    |
| Receipt          | LightRAG acceptance identity. Track ID and delete identity where upstream requires both. |
| Index generation | Integer blocking stale ready results after retry.                                        |
| Query eligible   | Source may later enter Phase 6 retrieval scope.                                          |
| Fence            | State guard blocking late remote work from restoring access.                             |

Critical distinction:

```text
SourceBlock
  != LightRAG input
  != LightRAG chunk
  != vector
  != graph node
  != retrieval evidence
```

---

# 5. Runtime Shape

```text
+---------+
|  Admin  |
+---------+
     |
     | upload / retry / cancel / delete
     v
+--------------------------+
| Context Engine API       |
| - require_admin          |
| - source APIs            |
| - safe index state       |
+--------------------------+
          |
          v
+----------------------------+
| PostgreSQL                 |
| - domains                  |
| - source_documents         |
| - source_blocks            |
| - prep operations          |
+----------------------------+
          ^
          |
          | claim / settle
          |
+----------------------------+
| Source Worker              |
| - Phase 4 preparation      |
| - LightRAG submit          |
| - readiness sweep          |
| - remote delete            |
+----------------------------+
          |
          | private network only
          v
+----------------------------+
| Private LightRAG Runtime   |
| - one runtime/domain       |
| - workspace/domain         |
| - graph/vector/index state |
+----------------------------+
```

Rules:

```text
Browser
  -> Context Engine API only.

API
  -> no direct LightRAG submit/delete.

Source worker
  -> only Context Engine process allowed to mutate LightRAG source content.

LightRAG
  -> never mounts Context Engine source folder.

Source worker
  -> no public port.
  -> no Docker socket.
  -> no browser auth.
  -> no workspace mount.
```

---

# 6. Current-to-Target Map

| Current concern                             | Phase 5 target                                                           |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| Mixed parser/chunk/index worker             | Phase 4 owns parsing. Phase 5 indexes prepared blocks only.              |
| Redis/RQ ingest path                        | PostgreSQL worker from Phase 4.                                          |
| Separate index worker                       | Extend existing source worker.                                           |
| Separate status poller                      | Source worker sweeps accepted sources.                                   |
| LightRAG status stored in document metadata | Small current index fields on source row.                                |
| Multiple handoff models/states              | One source row owns current request state.                               |
| Domain locks                                | One worker serializes remote mutations. Add lock only after proven need. |
| Fallback LightRAG endpoint behavior         | One pinned upstream contract. No silent fallback.                        |
| Local retrieval/chunk fallback              | None. LightRAG only.                                                     |

---

# 7. Step 0 — Prove Pinned LightRAG Contract

Do this before Phase 5 schema/business code.

```text
Pin exact LightRAG image tag + digest.

Run contract fixture against real container.

Fixture:
  one prepared source
  -> submit
  -> receive receipt
  -> poll native readiness
  -> retrieve native source identity/metadata
  -> delete indexed content
  -> verify absent
```

Must prove:

```text
1. Submit accepts private stable request ID or equivalent safe idempotency key.

2. Timeout after submit can resolve:
   request ID
   -> same receipt
   -> no duplicate remote content.

3. Receipt supports native readiness polling.

4. Receipt supports exact source deletion.

5. Retrieval output preserves enough stable source identity
   for Phase 6 mapping.

6. Delete followed by delayed ready
   cannot make deleted content retrievable.
```

Failure:

```text
Contract missing
  -> Phase 5 blocked.

Do not:
  add fallback endpoint.
  add browser proxy.
  add second status store.
  silently fork LightRAG.
```

Document exact upstream request/response fixture in test code.

---

# 8. LightRAG Input Contract

## 8.1 One logical source input

Default:

```text
one source document
  -> one LightRAG submit.
```

Do not create persisted `IndexUnit` rows.

Do not create an `IndexUnitBuilder` framework.

Use one function:

```python
def render_lightrag_input(
    source: SourceDocument,
    blocks: list[SourceBlock],
) -> str:
    ...
```

Output:

```text
stable source header
  + ordered block markers
  + block Markdown
  + page/section provenance
```

Example:

```text
[CE_SOURCE id=source-uuid schema=1 sha256=...]

[CE_BLOCK id=block-uuid order=42 page=12 section="Results > Fatigue Test 3"]
Stress amplitude rose after cycle 3.

[CE_BLOCK id=block-uuid order=43 page=12 section="Results > Fatigue Test 3"]
...
```

Rules:

```text
Same prepared source
  -> same rendered text.
  -> same content SHA-256.

Retry
  -> same rendered text.
  -> new index request ID.

Source ID
  -> server-owned.
  -> never browser supplied.

Source-block IDs
  -> survive in rendered markers.
```

## 8.2 Size limit

Phase 5 supports one upstream-safe source payload size.

```text
Prepared source exceeds proven LightRAG request limit
  -> index_state=failed
  -> index_error_code=source_too_large_for_index
```

Do not add transport parts, batch units, overlap rules, or custom chunking now.

Add only after real documents prove this limit blocks valid usage.

---

# 9. Database

Create migration:

```text
0005_source_index_state
```

Extend `source_documents`.

```text
index_generation INTEGER NOT NULL DEFAULT 0

index_state TEXT NOT NULL DEFAULT 'not_requested'
index_request_id UUID NULL

index_content_sha256 TEXT NULL

lightrag_track_id TEXT NULL
lightrag_document_id TEXT NULL

index_claimed_at TIMESTAMPTZ NULL
index_accepted_at TIMESTAMPTZ NULL
index_ready_at TIMESTAMPTZ NULL

index_error_code TEXT NULL
```

States:

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

Constraints:

```sql
CHECK (index_generation >= 0);

CHECK (
  index_state <> 'ready'
  OR index_ready_at IS NOT NULL
);

CREATE UNIQUE INDEX uq_source_index_request_id
ON source_documents (index_request_id)
WHERE index_request_id IS NOT NULL;

CREATE INDEX ix_source_index_work
ON source_documents (index_state)
WHERE index_state IN ('queued', 'submitting', 'accepted', 'cancelling');
```

No columns:

```text
remote_status
remote_progress
remote_status_json
remote_error_payload
remote_document_ids JSON
next_check_at
last_checked_at
handoff history
request history
poll history
```

## 9.1 Domain embedding lock

Use Phase 2 domain embedding-profile revision.

Add one field:

```text
embedding_locked_at TIMESTAMPTZ NULL
```

Rule:

```text
embedding_locked_at IS NULL
  -> admin may update domain embedding config.

first source index_state=ready
  -> set embedding_locked_at.

embedding_locked_at IS NOT NULL
  -> embedding config update returns 409 embedding_profile_locked.
```

Do not add a second embedding fingerprint system.

Phase 2 domain embedding configuration must already store immutable selected profile/model revision.

---

# 10. Source Index Lifecycle

```text
prepared
  |
  | Phase 4 publish completes
  v
queued
  |
  | worker claims
  v
submitting
  |
  | LightRAG accepts
  v
accepted
  |
  | native readiness
  +----------------------+
  |                      |
  v                      v
ready                  failed
  |                      |
  |                      | admin retry
  |                      v
  |                 queued, next generation
  |
  +-- cancel/delete --> cancelling --> cancelled/deleted
```

## 10.1 State meaning

| State           | Meaning                                                     |
| --------------- | ----------------------------------------------------------- |
| `not_requested` | Phase 4 source exists before Phase 5 queue creation.        |
| `queued`        | Safe local request exists. Worker may submit.               |
| `submitting`    | Worker may have called LightRAG. Never blind-resubmit.      |
| `accepted`      | LightRAG receipt stored. Await native terminal status.      |
| `ready`         | Native ready verified. Source query eligible.               |
| `failed`        | Safe terminal local failure. Manual retry allowed.          |
| `cancelling`    | Query fence active. Worker resolves/deletes remote receipt. |
| `cancelled`     | Remote content absent or no remote submit happened.         |

## 10.2 Eligibility predicate

Keep one function in `source/indexing.py`.

```python
def source_is_query_eligible(
    source: SourceDocument,
    domain: Domain,
) -> bool:
    return (
        domain.state == "running"
        and domain.available
        and source.state == "prepared"
        and source.index_state == "ready"
        and source.index_ready_at is not None
    )
```

Phase 5:

```text
Function exists.
No member retrieval route yet.
```

Phase 6:

```text
Retrieval scope uses same function.
No copied eligibility logic.
```

---

# 11. Phase 4 Publish Change

Phase 4 preparation worker currently ends:

```text
publish blocks/images
-> source state=prepared
-> preparation operation=succeeded
```

Phase 5 extends same DB transaction:

```text
publish blocks/images
-> source state=prepared
-> index_generation=1
-> index_state=queued
-> index_request_id=new UUID
-> index_content_sha256=rendered source hash
-> preparation operation=succeeded
```

Rule:

```text
Prepared source
  -> always gets one queued index request.

No event bus.
No after-commit best effort.
No second queue.
```

---

# 12. Source Worker

Extend Phase 4 worker.

```text
source-worker
  -> preparation work
  -> queued index submit
  -> accepted readiness sweep
  -> cancelling/delete cleanup
```

One worker is enough for current 5–10 user target.

## 12.1 Worker loop

```text
1. Recover stale preparation lease. Phase 4 behavior.

2. Resolve stale `submitting` source:
   request ID -> LightRAG receipt/status.
   Never blind-resubmit.

3. Claim one queued preparation operation.
   Run Phase 4 preparation.

4. Claim one source where index_state=queued.
   Submit to LightRAG.

5. Sweep sources where index_state=accepted.
   Poll native LightRAG readiness.

6. Sweep sources where index_state=cancelling.
   Resolve receipt then delete remote source.

7. Sleep one second when no work exists.
```

Use Phase 4 PostgreSQL claim pattern:

```sql
SELECT id
FROM source_documents
WHERE index_state = 'queued'
ORDER BY updated_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

Worker claim:

```text
queued
  -> submitting
  -> index_claimed_at=now
```

No Redis lock.

No advisory lock.

One worker owns remote mutation order.

## 12.2 Submit flow

```text
1. Lock source row.

2. Verify:
   source state=prepared
   index_state=queued
   domain not deleting
   runtime available
   embedding config allowed

3. Render LightRAG input from ordered blocks.

4. Verify rendered SHA equals index_content_sha256.

5. Set index_state=submitting.

6. Submit using index_request_id.

7. Persist receipt:
   lightrag_track_id
   lightrag_document_id when required
   index_accepted_at
   index_state=accepted
```

## 12.3 Native readiness sweep

Every accepted source checks native LightRAG status.

```text
native pending/processing
  -> no local status update.

native ready
  -> guarded ready transition.

native failed
  -> index_state=failed.
  -> safe index_error_code only.

accepted longer than 30 minutes
  -> index_state=failed.
  -> index_error_code=lightrag_timeout.
```

No per-source schedule.

No exponential backoff.

No poll history.

Use fixed sweep interval:

```text
5 seconds.
```

---

# 13. Guarded Ready Transition

Ready transition must be one guarded update.

```sql
UPDATE source_documents
SET
  index_state = 'ready',
  index_ready_at = NOW(),
  index_error_code = NULL
WHERE
  id = :source_id
  AND state = 'prepared'
  AND index_state = 'accepted'
  AND index_generation = :generation;
```

No updated row:

```text
Source was cancelled, deleted, retried, or changed.

Do not restore eligibility.

Request remote delete using stored receipt.
```

First successful ready source:

```text
1. Lock domain row.

2. Confirm domain embedding config still matches source submit config.

3. If embedding_locked_at IS NULL:
   set embedding_locked_at=now.

4. If locked:
   allow only same domain embedding revision.

5. Complete guarded source ready update.
```

---

# 14. Retry

Retry route:

```text
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/retry
```

Allowed:

```text
source state=prepared
index_state IN (failed, cancelled)
no delete fence
domain active or startable
old remote content confirmed absent
```

Action:

```text
1. Lock source.

2. Increment index_generation.

3. Set:
   index_state=queued
   index_request_id=new UUID
   lightrag_track_id=NULL
   lightrag_document_id=NULL
   index_claimed_at=NULL
   index_accepted_at=NULL
   index_ready_at=NULL
   index_error_code=NULL

4. Recompute rendered source SHA.

5. Return safe source summary.
```

No:

```text
automatic retry
retry from accepted
retry from submitting
retry while receipt unresolved
retry after embedding config change
retry after source deletion starts
```

---

# 15. Cancel

Cancel route:

```text
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/cancel
```

Cancel means:

```text
remove query eligibility first.
route remote cleanup second.
```

## 15.1 Queued

```text
queued
  -> cancelled.

No LightRAG call.
```

## 15.2 Submitting or accepted

```text
1. Lock source.

2. Set index_state=cancelling.

3. Source no longer query eligible.

4. Worker resolves receipt:
   request ID -> receipt.

5. Worker deletes remote content.

6. Delete success:
   index_state=cancelled.
```

## 15.3 Late ready result

```text
Old remote job reports ready.

Local source index_state != accepted.

Guarded ready update fails.

Worker deletes remote receipt.

Source remains cancelled/deleting.
```

Rule:

```text
Cancel cannot guarantee upstream CPU work stops instantly.

Cancel guarantees:
  source cannot become query eligible.
  remote delete gets routed.
  delayed ready cannot restore access.
```

---

# 16. Source Delete

Extend Phase 4 hard-delete flow.

Route:

```text
DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}
```

## 16.1 Local-only source

```text
index_state IN (not_requested, queued, failed, cancelled)
  -> remove source folder.
  -> delete source row.
  -> return 204.
```

Queued source:

```text
first set index_state=cancelled.
then delete.
```

## 16.2 Indexed or indexing source

```text
1. Lock source.

2. Verify source belongs to domain.

3. Set source.state=deleting.

4. Set index_state=cancelling.

5. Return 202 deletion_pending.

6. Source worker:
   resolve receipt if needed
   delete remote indexed content
   verify upstream delete acknowledgement
   remove source folder
   delete source row
```

Failure:

```text
remote delete fails
  -> source remains deleting.
  -> source remains query-ineligible.
  -> worker retries only when admin repeats DELETE.
```

No local row/file deletion before remote delete acknowledgement.

Hard delete complete:

```text
source folder absent
source row absent
source blocks absent
source images absent
preparation rows absent
remote LightRAG content absent
```

---

# 17. Domain Delete

Phase 3 domain delete extends:

```text
DomainLifecycleService.delete()
  -> domain state=deleting
  -> reject new uploads/retries
  -> mark all source rows deleting
  -> source worker deletes remote source content
  -> source worker removes local source rows/files
  -> zero sources remain
  -> stop/remove private LightRAG runtime
  -> remove domain row
```

Rule:

```text
Domain row never deletes while:
  source rows exist
  source folders exist
  remote source receipts remain
  source state=deleting
```

No generic purge framework.

One direct call:

```text
DomainLifecycleService
  -> SourceService.request_domain_delete()
```

---

# 18. Admin API

All routes:

```python
AdminUser = Depends(require_admin)
```

| Method   | Route                                                                | Purpose                                         |
| -------- | -------------------------------------------------------------------- | ----------------------------------------------- |
| `GET`    | `/api/v1/admin/domains/{domain_id}/sources/{source_id}`              | Existing source summary. Add safe index fields. |
| `POST`   | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/index/retry`  | Retry failed/cancelled index.                   |
| `POST`   | `/api/v1/admin/domains/{domain_id}/sources/{source_id}/index/cancel` | Cancel/fence current index.                     |
| `DELETE` | `/api/v1/admin/domains/{domain_id}/sources/{source_id}`              | Hard delete local + remote content.             |

Safe response:

```json
{
  "sourceDocumentId": "uuid",
  "sourceState": "prepared",
  "indexState": "accepted",
  "queryEligible": false,
  "indexAcceptedAt": "2026-06-26T12:00:00Z",
  "indexReadyAt": null,
  "safeIndexErrorCode": null
}
```

Never return:

```text
lightrag_track_id
lightrag_document_id
LightRAG URL
raw upstream response
upstream stack trace
runtime filesystem path
provider secret
embedding secret
```

No member index routes.

No LightRAG proxy routes.

No browser access to runtime.

---

# 19. Repository Layout

```text
backend/
├── alembic/
│   └── versions/
│       └── 0005_source_index_state.py
│
├── app/
│   ├── api/v1/
│   │   └── admin_sources.py
│   │
│   ├── source/
│   │   ├── models.py
│   │   ├── repository.py
│   │   ├── service.py
│   │   ├── store.py
│   │   ├── worker.py
│   │   ├── indexing.py
│   │   └── lightrag_client.py
│   │
│   ├── domains/
│   │   ├── repository.py
│   │   └── lifecycle_service.py
│   │
│   └── tests/
│       ├── unit/
│       ├── integration/
│       └── compose/
│
└── docker-compose.yml
```

`indexing.py` owns:

```text
render_lightrag_input()
source_is_query_eligible()
guarded ready transition
safe index error mapping
```

`lightrag_client.py` owns:

```text
submit()
resolve_submission()
readiness()
delete()
```

No:

```text
lightrag_indexing/
adapter protocol
adapter fake
index repository
index service
index worker
delete service
eligibility service
embedding lock module
status poller
```

---

# 20. Compose

Static services:

```text
postgres
migrate
api
domain-controller
source-worker
```

Remove from greenfield Phase 5:

```text
redis
rq-worker
lightrag-status-poller
lightrag-index-worker
```

`source-worker` access:

```text
PostgreSQL
source storage
private LightRAG network
parser egress only when parser requires it
```

`source-worker` does not access:

```text
browser port
Docker socket
LightRAG workspace folder
LightRAG logs folder
provider-secret API response
```

---

# 21. Configuration

Add only:

```dotenv
LIGHTRAG_SUBMIT_TIMEOUT_SECONDS=30
LIGHTRAG_READINESS_TIMEOUT_SECONDS=1800
LIGHTRAG_READINESS_SWEEP_SECONDS=5
```

Keep source-size limit in Phase 4 configuration.

Do not add:

```text
backoff settings
poll scheduler settings
worker lease settings for indexing
index-unit settings
dynamic chunk settings
LightRAG endpoint fallback flags
feature flags
retry counts
```

---

# 22. Build Order

## Step 0 — Upstream contract proof

```text
Pin LightRAG image.

Run real container fixture.

Prove:
  idempotent submit
  submit recovery after timeout
  native readiness
  stable source identity retained
  precise delete
  delayed ready after delete
```

## Step 1 — Migration

```text
0005_source_index_state

source index fields
domain.embedding_locked_at
indexes/checks
```

## Step 2 — Local indexing functions

```text
render_lightrag_input()
content hash
source_is_query_eligible()
guarded state updates
```

## Step 3 — Concrete private client

```text
submit
resolve_submission
readiness
delete
safe upstream-error mapping
```

## Step 4 — Extend source worker

```text
queued submit
stale submitting recovery
accepted readiness sweep
cancelling cleanup
```

## Step 5 — Extend Phase 4 publish

```text
prepared source
  -> first queued index request
  -> one DB transaction
```

## Step 6 — Admin actions

```text
safe index fields in summary
retry
cancel
delete extension
```

## Step 7 — Domain delete

```text
domain deleting fence
source remote cleanup
local source purge
runtime removal after sources absent
```

## Step 8 — Remove legacy paths

```text
no Redis/RQ
no status poller
no document metadata status mirror
no direct browser runtime URL
no fallback endpoint behavior
```

## Step 9 — Proof

```text
unit tests
PostgreSQL integration tests
real LightRAG contract test
Compose smoke test
manual recovery runbook
```

---

# 23. Test Gate

Must pass:

```text
Prepared source
  -> queued
  -> submitted once
  -> accepted
  -> native ready
  -> query eligible.

Same queued source processed twice
  -> one accepted remote source.
  -> no duplicate indexed content.

Submit timeout
  -> resolve same request ID.
  -> no blind re-submit.
  -> no duplicate indexed content.

LightRAG pending
  -> source remains query-ineligible.

LightRAG failed
  -> source remains prepared.
  -> index_state=failed.
  -> admin can retry.

Retry
  -> next generation.
  -> new request ID.
  -> old remote content absent first.

Cancel queued
  -> no remote submit.

Cancel accepted
  -> source immediately query-ineligible.
  -> remote delete routed.

Delete indexed source
  -> remote content removed.
  -> local source folder/rows removed.

Delete source while delayed LightRAG ready arrives
  -> source never becomes ready.
  -> remote content removed.

Delete domain with accepted/ready sources
  -> remote source cleanup before runtime/domain removal.

First successful source index
  -> domain embedding lock set.

Locked domain embedding update
  -> 409 embedding_profile_locked.

Cross-domain source ID
  -> rejected server-side.

API/log output
  -> no source paths.
  -> no track IDs.
  -> no remote IDs.
  -> no raw LightRAG payload.
  -> no secrets.

No local embeddings.
No local vector DB.
No local graph DB.
No Redis/RQ/status-poller/index-worker service.
```

---

# 24. Definition of Done

```text
Phase 4 prepared source automatically gets one queued index request.

One source worker renders and submits deterministic source content.

One concrete private LightRAG client handles submit/readiness/delete.

Native LightRAG ready is required before query eligibility.

Current source row stores current request state only.
No remote status mirror.
No handoff-history table.

Retry cannot duplicate remote indexed content.

Cancel/delete fences stale ready results.

Deleted source/domain cannot later become query eligible.

First successful index locks domain embedding configuration.

Browser never talks to LightRAG.

Phase 6 reuses one eligibility predicate.
```

## Final Boundary

```text
Phase 4:
source file
  -> parser
  -> flat blocks/images

Phase 5:
prepared source
  -> deterministic rendered input
  -> private LightRAG submit
  -> native readiness
  -> query eligible

Phase 6:
eligible source
  -> scoped retrieval
  -> mapped evidence
  -> source navigation
```
