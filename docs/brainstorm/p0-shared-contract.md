# Context Engine — P0: Shared Contract (caveman)

**Status:** Canonical cross-phase rules. One source of truth.
**Read first.** Every phase plan (P1–P5) points here. No phase re-defines these. Change here -> all phases follow.
**Style:** caveman. Terse. Tech exact. Fragments OK.

---

## 0. What this is

Reviews found cross-phase conflicts. Each phase doc had own copy of shared rules -> drift. Fix: one contract. Phases reference it.

Rules here win. Phase doc disagrees with P0 -> P0 right, phase wrong. Fix phase.

---

## 1. Target system

5–10 trusted users. Shared knowledge system. RAG over admin-curated domains.

```text
Browser
  -> TLS ingress
  -> Context Engine API
     -> PostgreSQL
     -> source storage (private files)
     -> source worker (one)
     -> private domain controller (one)
     -> private LightRAG runtime (one per domain)
     -> synthesis provider
Langfuse  <- optional masked trace metadata only (P7+)
```

Browser never touches: Docker, LightRAG, provider secrets, runtime ports, storage paths, controller.

---

## 2. One owner per concern

DRY. Each concern lives one place. No duplicate state.

| Concern | Owner | Never duplicate into |
|---|---|---|
| Identity, roles, sessions | CE DB/API | LightRAG, browser token storage |
| Provider secrets | encrypted CE config | domain.env, manifests, browser, runtime files |
| Domain lifecycle | CE domain row + private controller | browser, LightRAG status, generated files |
| Original file, prepared blocks, images | CE storage + CE DB | LightRAG |
| Embeddings, KG, semantic retrieval | LightRAG | CE local vector store (none) |
| Query eligibility, citations | CE API | browser, LightRAG |
| Runtime health | computed live check | durable mirror table |
| Source work progress | source row fields + operation row | jobs table + ops table + index table (no generic) |

---

## 3. Two state machines only

No separate persistent systems for lifecycle/health/availability/prep/index/jobs/ops.

### 3.1 Domain state

Persist only:

```text
stopped
running
deleting
```

Plus `control_generation: int` for stale-action fencing.

Compute, never persist: healthy, unhealthy, reachable, starting, degraded, available, ready.

Cut: provisioning, starting, stopping, failed, repairing, recreating, archived, manifest status, runtime-URL status, container-status mirror.

`failed` = API result + structured log. Retry start/stop/delete. No permanent failure-state machinery.

Domain queryable =

```text
domain.state == running
AND bounded LightRAG health succeeds
AND matching source.state == prepared
AND source.index_state == ready
```

### 3.2 Source state

One linear lifecycle. `source_documents.state` has exactly three values:

```text
pending -> prepared
prepared index_state: not_requested -> queued -> submitting -> accepted -> ready
any active -> deleting -> row gone
```

**No `source.state = failed`.** Failure lives on the work record, not the source state — avoids duplicate failure facts across source row + operation + index state:

```text
preparation failure -> source.state STAYS pending, latest source_preparation_operation.status = failed.
index failure        -> source.state STAYS prepared, source.index_state = failed.
```

Retry re-uses the same source row (new operation / new index generation). Store on source row only: state, parser_kind, preparation_generation, index_generation, index fields (index_state, index_error_code, etc — see P5). Per-attempt error codes live on the operation row / index fields, not a `failed_step`/`last_error` pair on the source.

Do not create: prep_jobs, index_jobs, operation_jobs, status_events, source_versions, handoff_history, eligibility tables, remote-status mirror.

Source row = durable work record. One worker claims via Postgres `FOR UPDATE SKIP LOCKED`. No Redis/RQ.

---

## 4. Private controller boundary (non-negotiable)

API process holds NO Docker socket. Private controller holds socket. Controller exposes narrow actions only:

```text
provision
start
stop
remove
inspect (health probe)
```

Controller must NOT run app.main routes, browser auth, admin routes, chat, provider-config routes.

Runtimes: no published host port. Private network only.

---

## 5. One source worker

Same codebase. One process. Does prep + index submit + readiness sweep + remote cleanup.

```text
Postgres source row
  -> worker claims (SELECT ... FOR UPDATE SKIP LOCKED)
  -> parse OR index
  -> update same row
```

No: Redis, RQ, Celery, status poller, separate index worker, workflow engine, event bus, scheduler.

One worker justified. More worker types not. Add lock/second worker only after measured need.

---

## 6. No runtime artifacts as config sources

Do NOT persist: domain.env, runtime manifest, generated compose file, runtime URL, published host port, workspace path, container name, runtime DB password, retrieval defaults.

Derive deterministic values from: domain.id + runtime_instance_id + app config + locked embedding profile + controller naming rules.

```text
workspace = <root>/domains/<domain_id>--<instance>/
container = ce-lr-<domain_id>-<short_instance>
runtime DB = ce_lr_<short_instance>
```

No DB column for these.

---

## 7. Provider-secret runtime injection (review blocker #4)

P3 starts empty health-only runtime: no provider creds. P5 indexing needs embedding/LLM config in runtime. Plans did not say how secret reaches runtime. Define once here.

**Warning: secrets in motion. Follow exactly.**

Narrow contract:

```text
1. API resolves typed provider config privately (TrustedRuntimeResolver).
2. API -> controller over private control network (token auth).
3. Controller accepts approved typed config fields ONLY.
4. Controller injects secret at runtime PROCESS START (env/stdin to container process).
```

Do NOT: write domain.env, generate compose, store plaintext secret in DB, expose to browser, log secret, accept arbitrary env map.

Credential rotation:

```text
admin rotates encrypted credential
running runtime keeps current process config
admin stop -> start applies new credential
```

No secret-sync worker. No runtime-config history.

**Gate:** P5 blocked until pinned LightRAG fixture proves this injection flow works.

---

## 8. Embedding lock (review blocker #2 — resolved)

Conflict: P3 said immutable at domain-create. P5 said changeable until first ready. **Use P3.**

```text
domain create -> pick embedding profile -> immutable immediately.
wrong profile -> hard-delete empty domain -> recreate.
```

Remove everywhere: `embedding_locked_at` field, pre-index embedding change, embedding revision logic, second embedding fingerprint.

P5 does NOT add embedding_locked_at. Embedding identity fixed from row creation. Referenced embedding profile cannot mutate/delete while any domain references it (Phase 2 guard).

---

## 9. Parser kind (review blocker #1 — resolved)

Conflict: P2 = one active parser kind. P4 stored parser_profile_id + parser_config_revision. **Drop profile + revision.**

```text
source_documents.parser_kind  ->  docling | reducto
```

```text
freeze parser_kind at upload (snapshot active parser then).
retry -> resolve current credential privately, same parser_kind.
```

Drop fields: parser_profile_id, parser_config_revision. Keep prepared_schema_version.

---

## 10. Deletion contract (review blocker #3 — resolved)

Conflict: P3 said domain delete = sync 204. P5 said worker-driven remote cleanup. Both can't hold. **One rule.**

### Domain delete

```text
DELETE domain
  -> state=deleting
  -> return 202 deletion_pending
  -> worker clears sources + remote LightRAG content
  -> controller removes runtime + runtime DB + workspace/logs
  -> domain row + domain_operations rows gone
GET domain after complete -> 404
```

Single-click delete stays. API stops claiming instant success.

### Source delete

```text
local-only source (not_requested/queued/failed/cancelled)
  -> remove folder -> delete row -> 204

indexed/indexing source
  -> state=deleting, index_state=cancelling
  -> return 202
  -> worker deletes remote content, verifies ack, removes folder+rows
```

No local row/file delete before remote delete ack.

### Hard delete = real

No archive, tombstone, restore, soft delete, retention. Success = every owned artifact gone. Partial fail -> stay deleting -> admin repeats DELETE -> resume.

### Chat-history vs delete (adopted in P7 — strict redaction, grounded-only)

P7 ships durable per-user conversation history (systems-slices-review §2 + final call). Hard delete + stored answers conflict: a deleted source's facts can live inside a stored answer. Hiding the citation is not enough. **Strict redaction is the contract** — but only for answers actually derived from domain documents.

P7 tags each turn `answer_kind = general | grounded`. **Redaction targets `grounded` turns only.** A `general` (direct-chat) turn has no source evidence; it must not be wiped just because the user had a domain selected while routing.

```text
source deleted -> block future retrieval. find GROUNDED turns with that source in cited_source_ids.
                  status=redacted, answer=null, citations stripped. keep user question.
domain deleted -> redact GROUNDED turns where turn.domain_id = deleted domain. conversation stays visible.
                  direct/general turns for that domain remain untouched.
```

```sql
-- source delete
UPDATE conversation_turns SET status='redacted', answer=NULL, citations_json=NULL
WHERE :source_id = ANY(cited_source_ids) AND answer_kind='grounded' AND status <> 'redacted';

-- domain delete
UPDATE conversation_turns SET status='redacted', answer=NULL, citations_json=NULL
WHERE domain_id=:domain_id AND answer_kind='grounded' AND status <> 'redacted';
```

Store `cited_source_ids` on the turn -> redaction is a cheap UPDATE, no citation-history subsystem.

Enforcement points (callers — one direct call into chat service, no event bus):

```text
P4/P5 source hard delete  -> ChatService.redact_for_source(source_id)
P3 domain hard delete     -> ChatService.redact_for_domain(domain_id)
```

Redaction runs as part of the delete flow, before the source/domain row is gone. Without this, "hard delete" = file storage only, not derived chat content. P7 owns the redaction logic + schema; see p7-grounded-chat-plan.md §5.

---

## 11. Fencing (keep)

Three lean controls protect against stale/delayed actions after ID reuse:

```text
1. runtime_instance_id   -> new create = new private resource identity.
2. control_generation    -> increments before each controller action; late finalizer can't overwrite newer truth.
3. one active operation  -> Postgres partial unique index serializes lifecycle work.
```

Controller targets only resources matching BOTH labels:

```text
context-engine.domain-id=<id>
context-engine.runtime-instance-id=<instance>
```

Old action cannot match new instance. Same for source: `preparation_generation` + `index_generation` fence stale worker publishes.

---

## 12. Upload-failure cleanup (review note)

```text
upload original promotion fails -> remove source row.
```

No orphan source row pointing at missing file. Worker never parses missing original.

---

## 13. Eligibility predicate (one scope — review note)

One function. P5 owns. P6 reuses. No copy.

```python
def source_is_query_eligible(source, domain) -> bool:
    return (
        domain.state == "running"
        and domain_available(domain)        # computed
        and source.state == "prepared"
        and source.index_state == "ready"
        and source.index_ready_at is not None
    )
```

Mapped-evidence rule: every LightRAG hit -> exact CE source_block. Unmapped/deleted/failed/wrong-domain hit -> discard. No approximate citation matching. No hit-map table; deterministic IDs + pure `map_hit()`.

---

## 14. Resource/admission limits (review blocker #6)

Server-owned. No admin UI sliders.

| Component | Caps |
|---|---|
| API | req timeout, max SSE streams, max body size |
| Source worker | CPU, memory, parser timeout, one active parse/index mutation initially |
| Each LightRAG runtime | CPU, memory, PID cap, max in-flight queries/domain, embedding/LLM async caps, upstream timeout |

Pin LightRAG async/concurrency/timeout at bootstrap. Browser req cannot change them. Use private HTTP runtime calls or async `a*` methods only — sync SDK wrappers not cross-thread safe under load.

---

## 15. Rate limiting (before shared browser)

| Endpoint | Limit |
|---|---|
| POST /auth/login | ingress login limit |
| POST source upload/retry | admin upload limit |
| POST retrieval/chat | authenticated user limit |
| per-domain query | runtime protection cap |

Return `429 rate_limited` + `Retry-After` + requestId. No Redis on one host. API replicas later -> move to ingress.

---

## 16. Structured log schema

```text
event, request_id, actor_kind, domain_id, source_id,
conversation_turn_id, operation_id, safe_error_code, elapsed_ms
```

Never log: provider secrets, session tokens, raw document text, raw parser payload, full prompt, full answer, raw LightRAG response, Docker errors, filesystem paths.

---

## 17. CI minimum (every PR)

```text
format/lint, type check, unit tests, Postgres integration tests,
Alembic fresh-upgrade test, OpenAPI snapshot test, secret scan
```

Pinned LightRAG image update -> real container contract fixture. Before pilot: full E2E (auth -> domain -> upload -> prepare -> index -> retrieve -> chat -> delete -> restore-proof). No auto DB downgrade in prod. Backup + test restore before prod migration.

---

## 18. Non-negotiable protections

Do not cut:

```text
private Docker-controller boundary
DB-backed durable source work
generation fencing on domain/source mutations
hard-delete verification
server-side authz on every read/write
no provider secrets in browser or runtime files
exact evidence-to-source-block mapping
no local retrieval fallback
```

---

## 19. Implementation order

```text
P1  auth/session + admin/member boundary
P2  encrypted credentials + immutable embedding-profile rule + parser_kind
P3  private controller + minimal domain lifecycle (delete=202 async)
P4  immutable source storage + flat prep output + one worker
P5  LightRAG handoff + secret injection + exact mapping + eligibility
```

Gates:

```text
no P4 until P2 embedding-lock + parser_kind rule exists.
no P5 until P4 emits stable block IDs usable by LightRAG mapping.
no P5 build until pinned-LightRAG fixture proves submit/readiness/delete + secret injection.
```

---

## 20. Don't add (whole project)

```text
Redis, Celery/RQ, generic workflow engine, chat-memory vector DB,
cross-domain retrieval, CDN, Kubernetes, provider failover, agent system,
second retrieval stack, microservices, multi-region, generic operations/jobs table
```

Everything else = optional complexity. Build one trusted API, one Postgres, one source worker, one private controller, one LightRAG runtime per domain.
