# Context Engine — Independent Systems-Slices Review

**Scope:** Design review of current greenfield plans, including agreed additions: user-owned conversation history, domain switching per turn, admin uploads during user queries, runtime limits, and Langfuse observability.

**Review type:** Architecture and implementation-plan review, not a code audit.

---

## Overall verdict — Conditional Go

**5–10 concurrent users:** Architecture fits.

**Admin uploads while members query:** Fits, provided slow preparation/indexing remains in one worker and the API only handles short authenticated request work.

**50 users:** Possible later, but not proven. Primary limits will likely be active LightRAG containers, provider quotas, RAM, document-processing throughput, and streamed chat—not PostgreSQL session storage.

Do not redesign into microservices, Redis, Kubernetes, distributed queues, CDNs, or multi-region infrastructure now.

### Six decisions blocking a clean pilot

```text
1. P2/P4 parser snapshot mismatch.
2. P3/P5 embedding-lock mismatch.
3. P3 synchronous delete conflicts with P5 worker-driven remote cleanup.
4. Provider-secret delivery into LightRAG runtime is undefined.
5. Conversation-history retention conflicts with strict source/domain hard delete.
6. Runtime admission/resource limits are absent.
```

---

## Slice scorecard

| Slice | Status | Verdict |
|---|---|---|
| System design | Yellow | Strong core. Cross-phase rules need consolidation. |
| System architecture | Yellow | Isolation strong. Provider-secret runtime path missing. |
| Frontend | Grey | Deferred correctly. Must later expose domain-at-turn, evidence, history, and stream state. |
| APIs & backend logic | Yellow | Good ownership. Need idempotency, cancellation, and query admission. |
| Databases & storage | Yellow | Canonical source model good. Conversation/deletion contract missing. |
| Auth & permissions | Green / Yellow | Opaque DB-backed session design strong. Add conversation ownership and browser CSRF gate. |
| Hosting & cloud | Yellow | Single-host Compose fits. Need ingress TLS, resource caps, and disk policy. |
| CI/CD & version control | Red | Test gates exist; CI/release pipeline not yet specified. |
| Security | Yellow | Controller boundary strong. Parser sandbox, secret injection, and deletion semantics need decisions. |
| Rate limiting | Yellow | Needed before shared browser deployment. No Redis required. |
| Caching & CDN | Green | Do not add now. |
| Error tracking & logs | Yellow | Request IDs exist. Need fixed structured event schema. |
| Monitoring & alerts | Yellow | Add small pilot-health set. No Grafana stack required. |
| Testing | Yellow | Good phase tests. Add concurrency, deletion, upstream-contract, and recovery tests. |
| Scaling | Yellow | 5–10 credible. 50 requires measured capacity gate. |
| Data lifecycle / privacy | Red | Chat history vs hard delete must be explicitly decided. |

---

# 1. System design

Core ownership model is correct:

```text
Context Engine
  owns auth, permissions, sources, canonical blocks,
  conversation history, evidence mapping, chat orchestration.

LightRAG
  owns semantic/graph retrieval and indexing internals.

Browser
  talks only to Context Engine API.
```

This keeps public/client behavior separate from retrieval-engine internals. It avoids duplicate vector stores, local fallback retrieval, browser-side provider control, and direct LightRAG exposure.

## Required correction: one owner per operation type

Scaffold language suggests a generic operation/audit model. Keep resource-specific operation rows instead.

```text
domain_operations
  owns lifecycle work.

source_preparation_operations
  owns parsing/preparation work.

source_documents.index_state
  owns indexing work.

conversation_turns
  owns chat work.
```

Do not add:

```text
generic operations table
workflow engine
event bus
job orchestration platform
```

## Required correction: resolve three spec contradictions

### Parser mismatch

P2 defines one active parser kind. P4 references `parser_profile_id` and `parser_config_revision`, but those concepts do not exist in P2.

Use:

```text
source_documents.parser_kind
  docling | reducto
```

Freeze parser kind at upload.

On retry, resolve the current credential privately.

Remove:

```text
parser_profile_id
parser_config_revision
prepared_schema_version
```

Add schema-versioning only if a real canonical-model migration/reprepare feature appears.

### Embedding mismatch

P3 makes `embedding_profile_id` immutable at domain creation. P5 permits changing it until first source reaches ready. These rules conflict.

Use:

```text
Domain embedding profile selected at create.
Immutable immediately.
Wrong profile -> hard delete empty domain -> recreate.
```

Remove:

```text
embedding_locked_at
pre-index embedding changes
embedding revision logic
```

### Delete mismatch

P3 defines domain delete as synchronous `204` after all resources vanish. P5 extends deletion into worker-driven remote LightRAG cleanup and source deletion.

Use:

```text
DELETE domain
-> state=deleting
-> return 202
-> worker clears sources + remote LightRAG content
-> controller removes runtime + database + workspace
-> domain row disappears

GET domain after completion -> 404
```

Single-click delete remains. Success no longer lies.

---

# 2. Conversation history — correct multi-domain model

Do **not** bind a conversation to one domain.

```text
Conversation
  belongs to one user.

Turn
  records active domain used for that turn.
```

```sql
conversations (
  id,
  owner_user_id,
  title,
  created_at,
  updated_at
);

conversation_turns (
  id,
  conversation_id,
  ordinal,
  domain_id,
  request_id,
  question,
  answer,
  status,
  synthesis_profile_id,
  citations_json,
  cited_source_ids,
  created_at,
  completed_at
);
```

Rules:

```text
Conversation may switch domain every turn.

Current turn domain -> only retrieval scope.

Past turns -> bounded synthesis context only.

Past turns never expand current retrieval scope.

No conversation_domains table.
No session_indexes table.
No chat vector store.
No semantic retrieval over old chats.
No shared user-chat memory.
```

Under the current RAG-only product, `turn.domain_id` remains required. General chat with no domain is a separate product decision.

## One active turn per conversation

```sql
CREATE UNIQUE INDEX one_running_turn_per_conversation
ON conversation_turns (conversation_id)
WHERE status = 'running';
```

Result:

```text
Same conversation, second send -> 409 conversation_busy.
Different conversations -> parallel.
Different users -> parallel.
```

No Redis lock.

## Critical deletion decision

Strict hard delete and durable chat history conflict. A stored answer may contain information from a deleted source. Hiding its citation is not enough.

Recommended strict rule:

```text
Source deleted
-> future retrieval blocked immediately
-> cited answer turns marked redacted
-> answer/evidence removed from history
-> original user question remains

Domain deleted
-> all turns tied to domain become redacted
-> conversation remains visible
-> deleted-domain turns cannot continue
```

Store `cited_source_ids` directly on the turn. Do not add a citation-history subsystem.

Without this rule, “hard delete” means only “delete current source storage,” not “remove derived content.”

---

# 3. System architecture

Private controller boundary is correct:

```text
API lacks Docker socket.
Only controller holds Docker privilege.
Runtimes have no public ports.
Runtime identity uses generated instance IDs and fencing generations.
```

Keep all of this.

## Missing blocker: provider-secret delivery

P2 decrypts credentials only through `TrustedRuntimeResolver`. P3 intentionally starts LightRAG without provider credentials. P5 requires LightRAG indexing, which needs embedding/LLM provider configuration.

Add one narrow contract before P5:

```text
API resolves typed provider config privately.
API -> controller over private network.
Controller accepts only approved typed config fields.
Controller injects secrets at runtime process start.
No domain.env.
No generated Compose.
No DB plaintext.
No browser exposure.
No logs.
No arbitrary environment map.
```

Credential rotation:

```text
Admin rotates encrypted credential.
Existing runtime continues current process config.
Admin stop/start applies new credential.
No secret-sync worker.
No runtime config history.
```

P5 should not proceed until a real pinned LightRAG fixture proves this flow.

## LightRAG concurrency rule

Do not call synchronous LightRAG SDK wrappers from FastAPI request handlers.

Use:

```text
private HTTP calls to each runtime
or
async LightRAG APIs only
```

Avoid shared cross-thread synchronous wrapper use under concurrent traffic.

---

# 4. APIs and backend logic

Keep public API thin:

```text
Browser
-> Context Engine API
-> DB / source worker / private runtime
```

Add these backend rules:

```text
Never hold DB transaction during:
- parser execution
- LightRAG HTTP call
- provider LLM stream
- SSE response

Write short durable state.
Commit.
Perform slow work.
Re-lock only to settle guarded state.
```

Use idempotency only where duplicate requests cause real harm:

```text
Chat turn:
  client request UUID -> unique per conversation.

Upload:
  content SHA-256 unique per domain.

Domain lifecycle:
  existing domain operation ID + generation fencing.
```

Keep stale-state protection:

```text
Readiness updates require current generation and accepted state.
Late results cannot restore query eligibility.
```

---

# 5. Admin upload while users query

Current split is good:

```text
API
  validates upload, persists intent, returns quickly.

Source worker
  parses, normalizes, indexes, polls readiness, cleans up.

LightRAG runtime
  serves retrieval.
```

Add only:

```text
Upload size limit.
Allowed MIME/type validation.
Parser timeout.
Worker memory/CPU limit.
One worker job lease.
Domain delete fence.
```

Do not add:

```text
separate parsing worker
separate index worker
status poller service
Redis queue
event bus
```

Users querying Domain A must not wait for an admin indexing Domain B.

Provider quotas may still contend. Solve with fixed concurrency caps, not new architecture.

---

# 6. Runtime limits and scaling

Add server-owned deployment limits. No admin UI sliders.

```text
API:
  request timeout
  max SSE streams
  max request body size

Source worker:
  CPU limit
  memory limit
  parser timeout
  max one active parse/index mutation initially

Each LightRAG runtime:
  CPU cap
  memory cap
  PID cap
  max in-flight queries/domain
  embedding / LLM async caps
  upstream timeout
```

Pin LightRAG concurrency and timeout settings in runtime bootstrap. Browser requests must not change them.

## Capacity position

```text
5–10 users:
  one API
  one Postgres
  one source worker
  one controller
  one runtime/domain
  = valid target.

50 users:
  benchmark first.
```

Benchmark before promising 50:

```text
10 concurrent evidence queries.
5 concurrent streamed chats.
1–2 active source preparations/indexes.
Queries across multiple domains.
Admin delete during indexing.
Runtime restart during request.
Provider timeout/rate-limit simulation.
```

Measure:

```text
p95 evidence latency
p95 first-token latency
error rate
runtime memory
Postgres CPU/connections
worker queue age
provider 429/timeout count
disk growth
```

Scale only proven bottleneck. Likely order:

```text
1. Provider quota/concurrency.
2. LightRAG runtime RAM.
3. Source worker throughput.
4. API replicas.
5. PostgreSQL tuning.
```

Do not prebuild high availability.

---

# 7. Auth, permissions, security

Opaque DB-backed session design is appropriate:

```text
random opaque session cookie
HttpOnly
Secure outside development
SameSite policy
DB stores token hash only
Argon2id password hashes
fresh server-side role checks
```

Add before browser rollout:

```text
Every conversation route filters:
  owner_user_id = current_user.id

Admin does not automatically read member chats.

Unsafe cookie-authenticated requests:
  enforce Origin/CSRF policy.

Production ingress:
  TLS only.
```

Parser security needs:

```text
Worker non-root.
No Docker socket.
Restricted source-folder mount.
No LightRAG workspace/log mount.
MIME/type validation.
Size/time/resource limits.
```

Do not add antivirus scanning unless untrusted public uploads become a confirmed requirement.

---

# 8. Rate limiting

Add before internal pilot browser access. Keep it small.

```text
POST /auth/login
  ingress login limit.

POST source upload/retry
  admin-only upload limit.

POST retrieval/chat
  authenticated user limit.

Per-domain query cap
  protects shared runtime.
```

Return:

```text
429 rate_limited
Retry-After
requestId
```

No Redis needed on one API host.

When API replicas arrive, move enforcement to ingress. Do not create database rate-limit rows.

---

# 9. Caching and CDN

**Do not add a CDN.** Internal authenticated RAG app gains little.

**Do not cache chat answers.** Cached answers complicate citations, history, deletion, provider changes, and evidence eligibility.

Allowed later:

```text
Static browser asset cache.
Authenticated image/source ETag cache.
Very short domain-list client cache.
```

Pinned upstream fixtures must prove deleted source content cannot reappear due to delayed readiness or stale retrieval state.

---

# 10. Logs, monitoring, Langfuse

Use one structured log schema:

```text
event
request_id
actor_kind
domain_id
source_id
conversation_turn_id
operation_id
safe_error_code
elapsed_ms
```

Never log:

```text
provider secrets
session tokens
raw document text
raw parser payload
full prompt
full answer
LightRAG raw response
Docker errors
filesystem paths
```

## Langfuse placement

Add Langfuse in P7/P8. Not P1.

Trace:

```text
Context Engine request
-> retrieval
-> evidence mapping
-> synthesis
-> stream completion/failure
```

Send metadata only by default:

```text
request_id
opaque turn ID
domain ID
model-profile ID
latency
retrieval hit count
citation count
safe outcome code
```

Do not send user questions, assistant answers, source blocks, images, uploaded files, provider secrets, or real usernames by default.

Langfuse must remain observational only:

```text
Langfuse unavailable
-> chat, retrieval, upload still work.
```

---

# 11. CI/CD, tests, release

Current plans specify Compose, migrations, focused phase tests, OpenAPI snapshots, and pinned LightRAG contract fixtures. Good base.

Missing minimum pipeline:

```text
Every pull request:
  formatting/lint
  type checks
  unit tests
  PostgreSQL integration tests
  Alembic fresh-upgrade test
  OpenAPI snapshot test
  secret scan

Pinned LightRAG image update:
  real container contract fixture

Before pilot release:
  full E2E:
  auth -> domain -> upload -> prepare -> index
  -> retrieve -> chat -> delete -> restore test
```

No automatic database downgrade. Back up before production migration. Test restore, not only backup creation.

---

# Final architecture

```text
Browser
  -> TLS ingress
  -> Context Engine API
     -> PostgreSQL
     -> source storage
     -> source worker
     -> private domain controller
     -> private LightRAG runtime/domain
     -> synthesis provider

Langfuse
  <- optional masked trace metadata only
```

## Final call

Keep architecture lean.

Add:

```text
conversation history per user
domain selection per turn
strict deletion/redaction contract
runtime/provider secret delivery contract
resource/admission limits
minimal CI
structured logs + optional masked Langfuse traces
```

Do not add:

```text
Redis
Celery/RQ
generic workflow engine
chat-memory vector DB
cross-domain retrieval
CDN
Kubernetes
provider failover
agent system
second retrieval stack
```
