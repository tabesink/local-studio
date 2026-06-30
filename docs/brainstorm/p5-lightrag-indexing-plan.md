# Context Engine — P5: Private LightRAG Indexing + Query Eligibility (caveman)

**Goal:** Prepared sources index into correct private LightRAG runtime. Source becomes query-eligible only after native LightRAG reports ready.
**Depends:** P1 auth, P2 config, P3 runtime, P4 prepared blocks.
**Reads:** P0 (one worker §5; provider-secret injection §7; embedding immutable §8 — NO lock field; deletion §10; eligibility §13; limits §14).
**Style:** caveman. P5 builds no retrieval UI/evidence/chat/citations/local vectors/BM25/graph/synthesis.

---

## 0. Flow

```text
P4: original -> parser -> PreparedSource -> flat blocks/images -> source state=prepared
P5: prepared source -> render deterministic LightRAG input -> private LightRAG submit
    -> native readiness check -> index_state=ready -> query eligible
P6: eligible source -> scoped retrieval -> mapped evidence -> authorized navigation
```

---

## 1. Final decisions

```text
LightRAG  = only semantic retrieval / vector / graph / native indexing-status owner.
CE        = source-doc / source-block / handoff / query-eligibility / deletion-fence owner.
One source worker = preparation + LightRAG submit + readiness polling + remote cleanup routing.
```

No: second index worker, source_index_handoffs table, status-mirror table, status-poller service, Redis, RQ, Celery, event bus, workflow engine, local embeddings/vectors/graph, semantic fallback, auto retry, auto repair, private bridge by default.

---

## 2. Scope

Build: one private LightRAG client, one pinned API contract, one deterministic render function, one current index state per source, stable submit idempotency key, native readiness polling, manual retry, cancel fence, remote-delete-before-local-delete, domain-delete routing, provider-secret injection (P0 §7), one query-eligibility predicate, safe admin index state.

Do not build: browser LightRAG access, WebUI access, second retrieval system, BM25, local vector/graph DB, custom graph/rerank, generic job framework, index-attempt history, remote status history/JSON storage, per-row poll schedules, auto retry/reindex, embedding migration, bulk reindex UI, multi-domain retrieval, chat, citations.

**Removed vs draft:** embedding_locked_at field + first-ready lock logic. Embedding profile is immutable from domain create (P0 §8). Nothing to lock at index time.

---

## 3. Core rule

```text
prepared source != query eligible.
LightRAG accepted != query eligible.

prepared source + current index request + native LightRAG ready + active domain + no delete/cancel fence
  -> query eligible.
```

```text
CE stores: current index intent, current receipt, final ready fact, safe failure code.
LightRAG stores: queue/pipeline/graph/vector state, native doc status, internal failures.
```

No duplicated remote status DB.

---

## 4. Terms

| Term | Meaning |
|---|---|
| LightRAG input | deterministic rendered text for one source. Not persisted entity. |
| Index request | current attempt to index one source generation. |
| Request ID | stable private idempotency key for one request. |
| Receipt | LightRAG acceptance identity (track ID + delete identity where upstream needs both). |
| Index generation | int blocking stale ready after retry. |
| Fence | state guard blocking late remote work from restoring access. |

```text
SourceBlock != LightRAG input != chunk != vector != graph node != evidence.
```

---

## 5. Runtime shape

```text
Admin -> CE API (require_admin, source APIs, safe index state)
  -> Postgres (domains, source_documents, source_blocks, prep operations)
  <- Source Worker (P4 prep + LightRAG submit + readiness sweep + remote delete)
       -> private network only -> Private LightRAG Runtime (one/domain, workspace/domain, graph/vector/index state)
```

Rules: browser -> CE API only. API -> no direct LightRAG submit/delete. Source worker = only CE process allowed to mutate LightRAG source content. LightRAG never mounts CE source folder. Worker: no public port, no Docker socket, no browser auth, no workspace mount.

---

## 6. Provider-secret injection gate (P0 §7) — do before business code

P3 starts the runtime health-only (no creds). P5 indexing needs embedding config — and, depending on the pinned LightRAG contract, an LLM config for graph/entity extraction — inside the runtime. **Warning: secrets in motion.** Use narrow contract:

```text
P3 start: runtime with NO provider config (health only).
P5 start: runtime with private typed bootstrap config.
  bootstrap config exists only in API/controller process memory.
  controller injects it at runtime PROCESS START.
  nothing about the bootstrap config is persisted.
```

```text
1. API/worker resolves typed provider config privately (TrustedRuntimeResolver).
2. -> domain controller over private control network (token auth).
3. Controller accepts approved typed fields ONLY (closed shape, not an env map).
4. Controller injects secret at runtime PROCESS START.
```

Private internal model (never serialized, logged, or returned):

```python
@dataclass(frozen=True)
class RuntimeBootstrapConfig:
    embedding: ResolvedModelProfile          # from domain.embedding_profile_id, immutable since create
    indexing_llm: ResolvedModelProfile | None  # active synthesis profile; only when pinned fixture proves it's required
```

```text
embedding:     domain.embedding_profile_id, immutable since domain creation (P0 §8).
indexing_llm:  current active synthesis profile; supply ONLY if the pinned LightRAG fixture proves graph/entity
               extraction needs it. Otherwise None.
credentials:   short-lived process memory only — never DB plaintext, domain.env, compose, manifest, or API response.
```

Never: domain.env, generated compose, DB plaintext secret, browser exposure, secret in logs, arbitrary env map. Rotation: rotate encrypted credential -> running runtime keeps current process config -> admin stop/start applies the new credential. No secret-sync worker, no runtime-config history, and **no `runtime_config_applied` DB field**.

Migration note: a runtime started under P3 (pre-P5, no provider config) must be manually stopped and started once before it can index. No auto-migration, no background re-inject.

**P5 blocked until the pinned LightRAG fixture proves this bootstrap injection + submit/readiness/delete.** The fixture determines the exact required provider fields (embedding only, or embedding + indexing LLM).

---

## 7. Step 0 — prove pinned LightRAG contract (before schema/business code)

```text
Pin exact image tag + digest. Run contract fixture against real container.
Fixture: one prepared source -> submit -> receive receipt -> poll native readiness
  -> retrieve native source identity/metadata -> delete indexed content -> verify absent.
```

Must prove:

```text
1. Submit accepts private stable request ID (safe idempotency key).
2. Timeout after submit -> resolve request ID -> same receipt -> no duplicate remote content.
3. Receipt supports native readiness polling.
4. Receipt supports exact source deletion.
5. Retrieval output preserves stable source identity for P6 mapping.
6. Delete then delayed ready -> deleted content NOT retrievable.
7. Provider-secret injection (§6) works at runtime start.
```

Contract missing -> P5 blocked. Do not add fallback endpoint, browser proxy, second status store, silent fork. Document exact upstream request/response fixture in test code.

---

## 8. LightRAG input contract

One source document -> one LightRAG submit. No persisted IndexUnit rows. No IndexUnitBuilder framework. One function:

```python
def render_lightrag_input(source: SourceDocument, blocks: list[SourceBlock]) -> str: ...
```

Output: stable source header + ordered block markers + block Markdown + page/section provenance.

```text
[CE_SOURCE id=source-uuid schema=1 sha256=...]

[CE_BLOCK id=block-uuid order=42 page=12 section="Results > Fatigue Test 3"]
Stress amplitude rose after cycle 3.
```

Rules: same prepared source -> same rendered text -> same SHA-256. Retry -> same text, new request ID. Source ID server-owned, never browser-supplied. Source-block IDs survive in markers (P6 mapping).

Size limit: one upstream-safe payload size. Exceed proven limit -> index_state=failed, index_error_code=source_too_large_for_index. No transport parts/batch/overlap/custom chunking now. Add only after real docs prove the limit blocks valid use.

---

## 9. DB — migration 0005_source_index_state

Extend source_documents:

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

States: not_requested, queued, submitting, accepted, ready, failed, cancelling, cancelled.

```sql
CHECK (index_generation >= 0);
CHECK (index_state <> 'ready' OR index_ready_at IS NOT NULL);
CREATE UNIQUE INDEX uq_source_index_request_id
  ON source_documents (index_request_id) WHERE index_request_id IS NOT NULL;
CREATE INDEX ix_source_index_work
  ON source_documents (index_state)
  WHERE index_state IN ('queued','submitting','accepted','cancelling');
```

No columns: remote_status, remote_progress, remote_status_json, remote_error_payload, remote_document_ids JSON, next_check_at, last_checked_at, handoff/request/poll history.

### No embedding lock field (corrected)

Draft P5 added `embedding_locked_at`. **Remove it.** Reviews resolved: embedding profile immutable from P3 domain create (P0 §8). No lock-at-first-ready. No second embedding fingerprint. Domain embedding config update already returns 409 from P2/P3 reference guard while any domain references the profile. 0005 does NOT add embedding_locked_at.

---

## 10. Source index lifecycle

```text
prepared -> (P4 publish) queued -> worker claims -> submitting -> LightRAG accepts -> accepted
  -> native readiness -> ready (query eligible)  |  failed (admin retry -> queued, next generation)
cancel/delete -> cancelling -> cancelled/deleted
```

| State | Meaning |
|---|---|
| not_requested | P4 source before P5 queue creation |
| queued | safe local request exists; worker may submit |
| submitting | worker may have called LightRAG; never blind-resubmit |
| accepted | receipt stored; await native terminal status |
| ready | native ready verified; query eligible |
| failed | safe terminal local failure; manual retry allowed |
| cancelling | query fence active; worker resolves/deletes remote receipt |
| cancelled | remote content absent or no remote submit happened |

### Eligibility predicate (one scope — P0 §13)

`source/indexing.py`:

```python
def source_is_query_eligible(source: SourceDocument, domain: Domain) -> bool:
    return (
        domain.state == "running"
        and domain_available(domain)        # computed, P3 resolver
        and source.state == "prepared"
        and source.index_state == "ready"
        and source.index_ready_at is not None
    )
```

P5: function exists, no member retrieval route yet. P6: retrieval scope uses same function — no copied logic.

---

## 11. P4 publish change

P4 prep worker currently ends: publish blocks/images -> source prepared -> prep op succeeded. P5 extends SAME DB transaction:

```text
publish blocks/images
-> source state=prepared
-> index_generation=1
-> index_state=queued
-> index_request_id=new UUID
-> index_content_sha256=rendered source hash
-> prep op succeeded
```

Prepared source always gets one queued index request. No event bus, no after-commit best-effort, no second queue.

---

## 12. Source worker (extend P4)

```text
source-worker -> prep work + queued index submit + accepted readiness sweep + cancelling/delete cleanup
```

One worker enough for 5–10 user target (P0 §5).

Loop:

```text
1. Recover stale prep lease (P4 behavior).
2. Resolve stale `submitting` source: request ID -> receipt/status. Never blind-resubmit.
3. Claim one queued prep op. Run P4 preparation.
4. Claim one source index_state=queued. Submit to LightRAG.
5. Sweep index_state=accepted. Poll native readiness.
6. Sweep index_state=cancelling. Resolve receipt then delete remote source.
7. Sleep 1s when no work.
```

Claim:

```sql
SELECT id FROM source_documents
WHERE index_state='queued' ORDER BY updated_at
FOR UPDATE SKIP LOCKED LIMIT 1;
```

queued -> submitting -> index_claimed_at=now. No Redis/advisory lock. One worker owns remote mutation order.

### Submit flow

```text
1. Lock source row.
2. Verify: source prepared, index_state=queued, domain not deleting, runtime available, embedding config present.
3. Render LightRAG input from ordered blocks.
4. Verify rendered SHA == index_content_sha256.
5. index_state=submitting.
6. Submit using index_request_id (idempotency key) + injected provider config (§6).
7. Persist receipt: lightrag_track_id, lightrag_document_id (when required), index_accepted_at, index_state=accepted.
```

### Native readiness sweep

```text
native pending/processing -> no local update.
native ready  -> guarded ready transition.
native failed -> index_state=failed, safe index_error_code only.
accepted > 30 min -> index_state=failed, index_error_code=lightrag_timeout.
```

No per-source schedule, no exponential backoff, no poll history. Fixed sweep interval = 5s.

---

## 13. Guarded ready transition

```sql
UPDATE source_documents
SET index_state='ready', index_ready_at=NOW(), index_error_code=NULL
WHERE id=:source_id AND state='prepared' AND index_state='accepted' AND index_generation=:generation;
```

No updated row -> source cancelled/deleted/retried/changed -> do NOT restore eligibility -> request remote delete using stored receipt.

**Embedding: no lock step.** Embedding profile immutable from domain create. Just verify rendered submit used the domain's embedding profile (assert match; mismatch = internal error, fail safely). Do NOT set embedding_locked_at. Do NOT allow/deny based on a lock field.

---

## 14. Retry

```text
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/retry
```

Allowed: source prepared + index_state IN (failed, cancelled) + no delete fence + domain active/startable + old remote content confirmed absent.

```text
1. Lock source.
2. index_generation += 1.
3. Set: index_state=queued, index_request_id=new UUID, lightrag_track_id=NULL, lightrag_document_id=NULL,
   index_claimed_at=NULL, index_accepted_at=NULL, index_ready_at=NULL, index_error_code=NULL.
4. Recompute rendered SHA.
5. Return safe summary.
```

No: auto retry, retry from accepted/submitting, retry while receipt unresolved, retry after source deletion starts. (Embedding can't change — immutable — so no "retry after embedding change" case.)

---

## 15. Cancel

```text
POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/index/cancel
```

Cancel = remove query eligibility first, route remote cleanup second.

```text
queued -> cancelled. No LightRAG call.
submitting/accepted:
  1. Lock source. 2. index_state=cancelling. 3. no longer query eligible.
  4. Worker resolves receipt (request ID -> receipt). 5. Worker deletes remote content. 6. Delete ok -> cancelled.
```

Late ready result: old remote job reports ready, local index_state != accepted, guarded update fails, worker deletes remote receipt, source stays cancelled/deleting.

Rule: cancel can't stop upstream CPU instantly. Cancel guarantees: source can't become eligible, remote delete routed, delayed ready can't restore access.

---

## 16. Source delete (extend P4, P0 §10)

```text
DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}
```

Local-only source:

```text
index_state IN (not_requested, queued, failed, cancelled) -> remove folder -> delete row -> 204.
queued -> first set index_state=cancelled, then delete.
```

Indexed/indexing source:

```text
1. Lock source. 2. Verify belongs to domain. 3. state=deleting. 4. index_state=cancelling.
5. Return 202 deletion_pending.
6. Worker: resolve receipt if needed -> delete remote content -> verify upstream ack
   -> remove source folder -> ChatService.redact_for_source(source_id) (P7 + P0 §10) -> delete source row.
```

Failure: stays deleting, query-ineligible, worker retries only when admin repeats DELETE. No local row/file delete before remote ack. Complete = source folder/row/blocks/images/prep rows absent + remote LightRAG content absent + cited GROUNDED chat turns redacted (general turns untouched). Redaction is idempotent — repeated DELETE re-applies harmlessly. Wired when P7 lands.

---

## 17. Domain delete (extend P3, P0 §10)

```text
DomainLifecycleService.delete()
  -> domain state=deleting -> 202
  -> reject new uploads/retries
  -> mark all source rows deleting
  -> worker deletes remote source content
  -> worker removes local source rows/files
  -> zero sources remain
  -> ChatService.redact_for_domain(domain_id) (P7 + P0 §10; grounded turns only)
  -> stop/remove private LightRAG runtime
  -> remove domain row
```

Rule: domain row never deletes while source rows/folders exist, remote receipts remain, or source state=deleting. No generic purge framework. Two direct calls (no event bus): `DomainLifecycleService -> SourceService.request_domain_delete()` and `ChatService.redact_for_domain(domain_id)`. Redaction wired when P7 lands.

---

## 18. Admin API

All require_admin.

```text
GET    /admin/domains/{id}/sources/{sid}               existing summary + safe index fields
POST   /admin/domains/{id}/sources/{sid}/index/retry   retry failed/cancelled
POST   /admin/domains/{id}/sources/{sid}/index/cancel  cancel/fence current index
DELETE /admin/domains/{id}/sources/{sid}               hard delete local + remote
```

Safe response:

```json
{"sourceDocumentId":"uuid","sourceState":"prepared","indexState":"accepted","queryEligible":false,
 "indexAcceptedAt":"...","indexReadyAt":null,"safeIndexErrorCode":null}
```

Never return: lightrag_track_id, lightrag_document_id, LightRAG URL, raw upstream response, stack trace, runtime path, provider secret, embedding secret. No member index routes. No LightRAG proxy. No browser runtime access.

---

## 19. Repo layout

```text
backend/
├── alembic/versions/0005_source_index_state.py
├── app/
│   ├── api/v1/admin_sources.py
│   ├── source/{models.py, repository.py, service.py, store.py, worker.py, indexing.py, lightrag_client.py}
│   ├── domains/{repository.py, lifecycle_service.py}
│   └── tests/{unit/, integration/, compose/}
└── docker-compose.yml
```

`indexing.py` owns: render_lightrag_input(), source_is_query_eligible(), guarded ready transition, safe index error mapping. `lightrag_client.py` owns: submit(), resolve_submission(), readiness(), delete().

No: lightrag_indexing/, adapter protocol/fake, index repository/service/worker, delete service, eligibility service, embedding lock module, status poller.

---

## 20. Compose

Static: postgres, migrate, api, domain-controller, source-worker. Remove from greenfield: redis, rq-worker, lightrag-status-poller, lightrag-index-worker.

source-worker access: Postgres, source storage, private LightRAG network, parser egress only when parser requires. No access: browser port, Docker socket, LightRAG workspace folder, LightRAG logs folder, provider-secret API response.

---

## 21. Config

```dotenv
LIGHTRAG_SUBMIT_TIMEOUT_SECONDS=30
LIGHTRAG_READINESS_TIMEOUT_SECONDS=1800
LIGHTRAG_READINESS_SWEEP_SECONDS=5
```

Keep source-size limit in P4 config. Do not add: backoff settings, poll scheduler, index lease settings, index-unit settings, dynamic chunk settings, endpoint fallback flags, feature flags, retry counts.

---

## 22. Build order

```text
Step 0 upstream contract proof: pin image, real container fixture — idempotent submit, submit recovery,
  native readiness, stable identity, precise delete, delayed-ready-after-delete, secret injection (§6).
Step 1 migration: 0005 source index fields, indexes/checks. (NO embedding_locked_at.)
Step 2 local indexing functions: render_lightrag_input(), content hash, source_is_query_eligible(), guarded updates.
Step 3 concrete private client: submit, resolve_submission, readiness, delete, safe upstream-error mapping.
Step 4 extend source worker: queued submit, stale submitting recovery, accepted readiness sweep, cancelling cleanup.
Step 5 extend P4 publish: prepared source -> first queued index request -> one DB transaction.
Step 6 admin actions: safe index fields, retry, cancel, delete extension.
Step 7 domain delete: deleting fence, remote cleanup, local purge, runtime removal after sources absent.
Step 8 remove legacy paths: no Redis/RQ, no status poller, no metadata status mirror, no browser runtime URL, no fallback endpoint.
Step 9 proof: unit, Postgres integration, real LightRAG contract test, compose smoke, manual recovery runbook.
```

---

## 23. Test gate

```text
Prepared -> queued -> submitted once -> accepted -> native ready -> query eligible.
Same queued source twice -> one accepted remote source, no duplicate content.
Submit timeout -> resolve same request ID, no blind re-submit, no duplicate content.
LightRAG pending -> source query-ineligible.
LightRAG failed -> source prepared, index_state=failed, admin can retry.
Retry -> next generation, new request ID, old remote content absent first.
Cancel queued -> no remote submit. Cancel accepted -> immediately ineligible, remote delete routed.
Delete indexed source -> remote content removed, local folder/rows removed.
Delete source while delayed ready arrives -> never becomes ready, remote content removed.
Delete domain with accepted/ready sources -> remote cleanup before runtime/domain removal.
Domain embedding update while referenced -> 409 (P2/P3 reference guard; no separate lock field).
Cross-domain source ID -> rejected server-side.
API/log output -> no source paths, no track IDs, no remote IDs, no raw LightRAG payload, no secrets.
No local embeddings/vector DB/graph DB. No Redis/RQ/status-poller/index-worker service.
Provider-secret injection proven; secret never in domain.env/compose/DB plaintext/logs/browser.
```

---

## 24. Definition of done

```text
P4 prepared source automatically gets one queued index request.
One source worker renders + submits deterministic source content.
One concrete private LightRAG client handles submit/readiness/delete.
Native ready required before query eligibility.
Source row stores current request state only. No remote status mirror. No handoff-history table.
Retry can't duplicate remote content. Cancel/delete fence stale ready results.
Deleted source/domain can't later become query eligible.
Domain embedding immutable from create (no index-time lock field).
Provider secret injected at runtime start, never persisted in artifacts.
Browser never talks to LightRAG. P6 reuses one eligibility predicate.
```

## Final boundary

```text
P4: source file -> parser -> flat blocks/images.
P5: prepared source -> deterministic rendered input -> private LightRAG submit -> native readiness -> query eligible.
P6: eligible source -> scoped retrieval -> mapped evidence -> source navigation.
```
