# Independent systems-slices review

**Scope:** design review of current greenfield docs, not code audit. P1–P5 are detailed plans; P6–P8 remain scaffold-level. Review includes agreed additions: user-owned conversation history, domain switching per turn, admin uploads during user queries, runtime limits, and Langfuse.

## Overall verdict — conditional go

- **5–10 concurrent users:** architecture fits.
- **Admin uploads while members query:** fits, with one worker handling slow preparation/indexing and API handling fast authenticated requests.
- **50 users:** possible later. Not proven. Main limits become active LightRAG containers, provider quotas, RAM, document-processing throughput, and chat streaming—not PostgreSQL sessions.

Do not redesign into microservices, Redis, Kubernetes, queues, CDN, or multi-region now.

### Six decisions block a clean pilot

1. P2/P4 parser snapshot mismatch.
2. P3/P5 embedding-lock mismatch.
3. P3 synchronous delete conflicts with P5 worker-driven remote cleanup.
4. Provider-secret delivery into LightRAG runtime undefined.
5. Conversation-history retention conflicts with strict source/domain hard delete.
6. Runtime admission/resource limits absent.

## Slice scorecard

| Slice | Status | Verdict |
| --- | --- | --- |
| System design | Yellow | Strong core. Cross-phase rules need consolidation. |
| System architecture | Yellow | Isolation strong. Provider-secret runtime path missing. |
| Frontend | Grey | Deferred correctly. Must later expose domain-at-turn, evidence, history, stream state. |
| APIs & backend logic | Yellow | Good ownership. Need idempotency, cancellation, query admission. |
| Databases & storage | Yellow | Canonical source model good. Conversation/deletion contract missing. |
| Auth & permissions | Green/Yellow | Opaque DB-backed session design strong. Add conversation ownership + browser CSRF gate. |
| Hosting & cloud | Yellow | Single-host Compose fit. Need ingress TLS, resource caps, disk policy. |
| CI/CD & version control | Red | Test gates exist; actual CI/release pipeline not specified. |
| Security | Yellow | Controller boundary strong. Parser sandbox, secret injection, deletion semantics need decisions. |
| Rate limiting | Yellow | Needed before shared browser deployment. No Redis required. |
| Caching & CDN | Green | Do not add now. |
| Error tracking & logs | Yellow | Request IDs exist. Need fixed structured event schema. |
| Monitoring & alerts | Yellow | Add small pilot-health set. No Grafana stack required. |
| Testing | Yellow | Good phase tests. Add concurrency, deletion, upstream-contract, recovery tests. |
| Scaling | Yellow | 5–10 credible. 50 requires measured capacity gate. |
| Data lifecycle / privacy | Red | Chat history vs hard delete must be explicitly decided. |

---

## 1. System design

Core ownership model is correct:

```
Context Engine
  owns auth, permissions, sources, canonical blocks,
  conversation history, evidence mapping, chat orchestration.

LightRAG
  owns semantic/graph retrieval and indexing internals.

Browser
  talks only to Context Engine API.
```

This matches scaffold boundaries and avoids duplicate vector stores, local fallback retrieval, browser-side provider control, and direct LightRAG exposure.

### Required correction: one owner per operation type

Scaffold says “one generic operation/audit model.” P3 correctly uses `domain_operations`; P4 uses `source_preparation_operations`. Keep resource-specific operation rows.

```
domain_operations
  owns lifecycle work.

source_preparation_operations
  owns parsing/preparation work.

source_documents.index_state
  owns indexing work.

conversation_turns
  owns chat work.
```

No generic operations table. No workflow engine.

### Required correction: resolve three spec contradictions

#### Parser mismatch

P2 defines one active parser kind. P4 stores `parser_profile_id` and `parser_config_revision`, neither defined in P2.

Use:

```
source_documents.parser_kind
  docling | reducto
```

- Freeze parser kind at upload.
- Resolve current credential privately on retry.
- Remove parser profile and revision fields.

#### Embedding mismatch

P3 makes `embedding_profile_id` immutable at domain creation. P5 permits changing it until first source reaches ready. These rules conflict.

Use P3 rule:

- Domain embedding profile selected at create.
- Immutable immediately.
- Wrong profile → hard delete empty domain → recreate.

Remove:

- `embedding_locked_at`
- pre-index embedding changes
- embedding revision logic

#### Delete mismatch

P3 defines domain delete as synchronous 204 after all resources vanish. P5 extends deletion into worker-driven remote LightRAG cleanup and source deletion. Both cannot be true.

Use one rule:

```
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

## 2. Conversation history — correct multi-domain model

Do not bind a conversation to one domain.

- **Conversation** belongs to one user.
- **Turn** records active domain used for that turn.

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

### Rules

- Conversation may switch domain every turn.
- Current turn domain → only retrieval scope.
- Past turns → bounded synthesis context only.
- Past turns never expand current retrieval scope.

Do **not** add:

- `conversation_domains` table
- `session_indexes` table
- chat vector store
- semantic retrieval over old chats
- shared user-chat memory

Under current RAG-only product, `turn.domain_id` stays required. “General chat with no domain” is a separate product decision. Scaffold explicitly rejects unrestricted assistant behavior today.

### One active turn per conversation

```sql
CREATE UNIQUE INDEX one_running_turn_per_conversation
ON conversation_turns (conversation_id)
WHERE status = 'running';
```

**Result:**

- Same conversation, second send → `409 conversation_busy`.
- Different conversations → parallel.
- Different users → parallel.

No Redis lock.

### Critical deletion decision

Strict hard delete and durable chat history conflict.

A stored answer may contain information from a deleted source. Hiding its citation is not enough.

**Recommended strict rule:**

| Event | Action |
| --- | --- |
| Source deleted | Future retrieval blocked immediately; cited answer turns marked redacted; answer/evidence removed from history; original user question remains |
| Domain deleted | All turns tied to domain become redacted; conversation remains visible; deleted-domain turns cannot continue |

Store `cited_source_ids` directly on the turn. Do not add a citation-history subsystem.

Without this rule, “hard delete” means only “delete current source storage,” not “remove derived content.”

---

## 3. System architecture

Private controller boundary is correct. API lacks Docker socket; only controller holds Docker privilege; runtimes have no public ports; runtime identity uses generated instance IDs and fencing generations. Keep all of it.

### Missing blocker: provider-secret delivery

P2 decrypts credentials only through `TrustedRuntimeResolver`. P3 intentionally starts LightRAG without provider credentials. P5 requires LightRAG indexing, which needs embedding/LLM provider configuration. Current plans do not define how that trusted configuration reaches runtime.

Add one narrow contract before P5:

1. API resolves typed provider config privately.
2. API → controller over private network.
3. Controller accepts only approved typed config fields.
4. Controller injects secrets at runtime process start.

Do **not**:

- `domain.env`
- generated Compose
- DB plaintext
- browser exposure
- logs
- arbitrary environment map

**Credential rotation:**

- Admin rotates encrypted credential.
- Existing runtime continues current process config.
- Admin stop/start applies new credential.

No secret-sync worker. No runtime config history.

P5 blocked until real pinned LightRAG fixture proves this flow.

### LightRAG concurrency rule

Do not call LightRAG synchronous SDK wrappers from FastAPI handlers. Upstream warns synchronous wrappers are not cross-thread safe for concurrent workloads and recommends async APIs for async applications. Context Engine should use private HTTP runtime calls or async `a*` methods only.

---

## 4. APIs and backend logic

Keep public API thin:

```
Browser
  -> Context Engine API
  -> DB / source worker / private runtime
```

Add these backend rules.

**Never hold DB transaction during:**

- parser execution
- LightRAG HTTP call
- provider LLM stream
- SSE response

Write short durable state → commit → perform slow work → re-lock only to settle guarded state.

**Use idempotency only where duplicate user requests cause real harm:**

| Operation | Key |
| --- | --- |
| Chat turn | client request UUID → unique per conversation |
| Upload | content SHA-256 unique per domain |
| Domain lifecycle | existing domain operation ID + generation fencing |

P5 already has good stale-state protection: readiness updates require current generation and accepted state; late results cannot restore query eligibility. Keep that.

---

## 5. Admin upload while users query

Current split is good:

| Component | Role |
| --- | --- |
| API | validates upload, persists intent, returns quickly |
| Source worker | parses, normalizes, indexes, polls readiness, cleans up |
| LightRAG runtime | serves retrieval |

P4 explicitly keeps parsing out of API; P5 keeps remote source mutation inside one worker.

**Add only:**

- Upload size limit
- Allowed MIME/type validation
- Parser timeout
- Worker memory/CPU limit
- One worker job lease
- Domain delete fence

No separate parsing worker, index worker, poller, Redis queue, or event bus.

Users querying Domain A must not wait for an admin indexing Domain B. Provider quotas may still contend. Solve with static concurrency caps, not new architecture.

---

## 6. Runtime limits and scaling

Add server-owned deployment limits. No admin UI sliders.

| Component | Limits |
| --- | --- |
| API | request timeout, max SSE streams, max request body size |
| Source worker | CPU limit, memory limit, parser timeout, max one active parse/index mutation initially |
| Each LightRAG runtime | CPU cap, memory cap, PID cap, max in-flight queries/domain, embedding/LLM async caps, upstream timeout |

LightRAG itself exposes async/concurrency and timeout settings for embedding, LLM, and reranking work. Pin them in runtime bootstrap; do not let browser requests change them.

### Capacity position

**5–10 users:**

```
one API
one Postgres
one source worker
one controller
one runtime/domain
= valid target
```

**50 users:** benchmark first.

**Benchmark before promising 50:**

- 10 concurrent evidence queries
- 5 concurrent streamed chats
- 1–2 active source preparations/indexes
- Queries across multiple domains
- Admin delete during indexing
- Runtime restart during request
- Provider timeout/rate-limit simulation

**Measure:**

- p95 evidence latency
- p95 first-token latency
- error rate
- runtime memory
- Postgres CPU/connections
- worker queue age
- provider 429/timeout count
- disk growth

At 50, scale only proven bottleneck. Likely order:

1. Provider quota/concurrency
2. LightRAG runtime RAM
3. Source worker throughput
4. API replicas
5. PostgreSQL tuning

Do not prebuild high availability.

---

## 7. Auth, permissions, security

P1 session design is appropriate: opaque random HttpOnly cookie, token hash only in DB, Argon2id passwords, fresh server-side role checks, Secure cookies outside development.

**Add before browser rollout:**

- Every conversation route filters: `owner_user_id = current_user.id`
- Admin does not automatically read member chats
- Unsafe cookie-authenticated requests: enforce Origin/CSRF policy
- Production ingress: TLS only

P1 already notes CSRF/origin rules before separate-origin browser deployment. Make that a release gate, not an optional note.

**Parser security needs:**

- Worker non-root
- No Docker socket
- Restricted source folder mount
- No LightRAG workspace/log mount
- MIME/type validation
- Size/time/resource limits

No antivirus pipeline unless external/untrusted upload becomes real requirement.

---

## 8. Rate limiting

Add before internal pilot browser access. Keep it small.

| Endpoint | Limit |
| --- | --- |
| `POST /auth/login` | ingress login limit |
| `POST` source upload/retry | admin-only upload limit |
| `POST` retrieval/chat | authenticated user limit |
| Per-domain query cap | protects shared runtime |

**Return:**

- `429 rate_limited`
- `Retry-After`
- `requestId`

No Redis needed on one API host.

When API replicas arrive, move enforcement to ingress. Do not create DB rate-limit rows.

---

## 9. Caching and CDN

Do not add CDN. Internal authenticated RAG app gains little.

Do not cache chat answers. Cached answers complicate citations, history, deletion, provider changes, and evidence eligibility.

**Allowed later:**

- Static browser asset cache
- Authenticated image/source ETag cache
- Very short domain-list client cache

P5 upstream fixture must prove a deleted source cannot reappear due to LightRAG delayed readiness or stale caching. That test is already correctly required.

---

## 10. Logs, monitoring, Langfuse

P1 request IDs and typed safe errors are strong start.

**Use one structured log schema:**

```
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

**Never log:**

- provider secrets
- session tokens
- raw document text
- raw parser payload
- full prompt
- full answer
- LightRAG raw response
- Docker errors
- filesystem paths

### Langfuse placement

Add Langfuse in P7/P8. Not P1.

**Trace:**

```
Context Engine request
  -> retrieval
  -> evidence mapping
  -> synthesis
  -> stream completion/failure
```

**Send metadata only by default:**

- `request_id`
- opaque turn ID
- domain ID
- model-profile ID
- latency
- retrieval hit count
- citation count
- safe outcome code

Do not send user questions, assistant answers, source blocks, images, uploaded files, provider secrets, or real usernames by default.

Langfuse supports async tracing, OpenTelemetry-compatible trace IDs, sampling, and export-time masking. Use masking before any trace payload leaves Context Engine.

**Langfuse must be observational only:**

- Langfuse unavailable → chat, retrieval, upload still work.

---

## 11. CI/CD, tests, release

Current docs specify Compose, migrations, focused phase tests, OpenAPI snapshots, and pinned LightRAG contract fixtures. Good base.

**Missing minimum pipeline:**

Every pull request:

- formatting/lint
- type checks
- unit tests
- PostgreSQL integration tests
- Alembic fresh-upgrade test
- OpenAPI snapshot test
- secret scan

Pinned LightRAG image update:

- real container contract fixture

Before pilot release — full E2E:

```
auth -> domain -> upload -> prepare -> index
  -> retrieve -> chat -> delete -> restore test
```

No automatic database downgrade. Backup before production migration. Test restore, not only backup creation.

---

## Final architecture

```
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

**Keep architecture lean.**

**Add:**

- conversation history per user
- domain selection per turn
- strict deletion/redaction contract
- runtime/provider secret delivery contract
- resource/admission limits
- minimal CI
- structured logs + optional masked Langfuse traces

**Do not add:**

- Redis
- Celery/RQ
- generic workflow engine
- chat-memory vector DB
- cross-domain retrieval
- CDN
- Kubernetes
- provider failover
- agent system
- second retrieval stack
