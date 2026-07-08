# Systems-slices review

Design review of greenfield docs. Not code audit.

P1–P5 = detailed plans. P6–P8 = scaffold only.

Also covers: user-owned chat history, domain switch per turn, admin upload while users query, runtime limits, Langfuse.

## Verdict — conditional go

| Scale | Call |
| --- | --- |
| 5–10 concurrent users | Architecture fits |
| Admin upload + member query same time | Fits. Worker = slow prep/index. API = fast auth req |
| 50 users | Maybe later. Not proven. Bottleneck = LightRAG containers, provider quotas, RAM, doc throughput, chat stream — not Postgres sessions |

**Do not add now:** microservices, Redis, K8s, queues, CDN, multi-region.

### Six blockers before clean pilot

1. P2/P4 parser snapshot mismatch
2. P3/P5 embedding-lock mismatch
3. P3 sync delete vs P5 worker remote cleanup
4. Provider-secret delivery into LightRAG runtime — undefined
5. Chat history vs strict source/domain hard delete — conflict
6. Runtime admission/resource limits — missing

## Slice scorecard

| Slice | Status | Verdict |
| --- | --- | --- |
| System design | Yellow | Core strong. Cross-phase rules need merge |
| System architecture | Yellow | Isolation strong. Provider-secret runtime path missing |
| Frontend | Grey | Deferred OK. Later: domain-at-turn, evidence, history, stream state |
| APIs & backend | Yellow | Ownership good. Need idempotency, cancel, query admission |
| DB & storage | Yellow | Canonical source model good. Chat/deletion contract missing |
| Auth & permissions | Green/Yellow | Opaque DB session strong. Add chat ownership + browser CSRF |
| Hosting & cloud | Yellow | Single-host Compose fits. Need ingress TLS, resource caps, disk policy |
| CI/CD & version control | Red | Test gates exist. No real CI/release pipeline |
| Security | Yellow | Controller boundary strong. Parser sandbox, secret inject, delete semantics undecided |
| Rate limiting | Yellow | Need before shared browser deploy. No Redis |
| Caching & CDN | Green | Skip |
| Error tracking & logs | Yellow | Request IDs exist. Need fixed structured event schema |
| Monitoring & alerts | Yellow | Small pilot-health set. No Grafana stack |
| Testing | Yellow | Good phase tests. Add concurrency, deletion, upstream-contract, recovery |
| Scaling | Yellow | 5–10 credible. 50 needs measured capacity gate |
| Data lifecycle / privacy | Red | Chat history vs hard delete — must decide |

---

## 1. System design

Ownership model = correct.

```
Context Engine
  owns auth, permissions, sources, canonical blocks,
  conversation history, evidence mapping, chat orchestration.

LightRAG
  owns semantic/graph retrieval and indexing internals.

Browser
  talks only to Context Engine API.
```

Matches scaffold. Avoids: duplicate vector stores, local fallback retrieval, browser-side provider control, direct LightRAG exposure.

### Fix: one owner per operation type

Scaffold says "one generic operation/audit model." Wrong for this system.

P3 uses `domain_operations`. P4 uses `source_preparation_operations`. Keep resource-specific rows.

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

### Fix: three spec contradictions

#### Parser mismatch

P2 = one active parser kind. P4 stores `parser_profile_id` + `parser_config_revision` — neither in P2.

Use:

```
source_documents.parser_kind
  docling | reducto
```

- Freeze parser kind at upload
- Resolve current credential privately on retry
- Drop parser profile + revision fields

#### Embedding mismatch

P3: `embedding_profile_id` immutable at domain create. P5: change allowed until first source ready. Conflict.

Use P3:

- Pick embedding profile at create
- Immutable immediately
- Wrong profile → hard delete empty domain → recreate

Remove:

- `embedding_locked_at`
- pre-index embedding changes
- embedding revision logic

#### Delete mismatch

P3: domain delete = sync 204 after all resources gone. P5: worker-driven remote LightRAG cleanup + source delete. Both can't be true.

One rule:

```
DELETE domain
  -> state=deleting
  -> return 202
  -> worker clears sources + remote LightRAG content
  -> controller removes runtime + database + workspace
  -> domain row disappears

GET domain after completion -> 404
```

Single-click delete stays. API stops lying about success.

---

## 2. Conversation history

Don't bind conversation to one domain.

- **Conversation** = one user
- **Turn** = domain used for that turn only

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

- Switch domain every turn — OK
- Current turn domain → retrieval scope only
- Past turns → bounded synthesis context only
- Past turns never widen current retrieval

**Don't add:**

- `conversation_domains` table
- `session_indexes` table
- chat vector store
- semantic retrieval over old chats
- shared user-chat memory

RAG-only product today → `turn.domain_id` required. "Chat with no domain" = separate product call. Scaffold rejects unrestricted assistant now.

### One active turn per conversation

```sql
CREATE UNIQUE INDEX one_running_turn_per_conversation
ON conversation_turns (conversation_id)
WHERE status = 'running';
```

| Case | Result |
| --- | --- |
| Same conversation, second send | `409 conversation_busy` |
| Different conversations | parallel OK |
| Different users | parallel OK |

No Redis lock.

### Deletion — must decide

Hard delete + durable chat history = conflict.

Deleted source info can live inside stored answer. Hiding citation ≠ enough.

**Strict rule (recommended):**

| Event | Action |
| --- | --- |
| Source deleted | Block future retrieval immediately. Redact cited turns. Strip answer/evidence. Keep user question |
| Domain deleted | Redact all turns for domain. Conversation stays visible. Can't continue deleted-domain turns |

Store `cited_source_ids` on turn. No citation-history subsystem.

Without this, "hard delete" = delete file storage only — not derived content in chat.

---

## 3. System architecture

Private controller boundary = correct.

- API has no Docker socket
- Only controller has Docker privilege
- Runtimes have no public ports
- Runtime identity = generated instance IDs + fencing generations

Keep all of it.

### Blocker: provider-secret delivery

P2 decrypts via `TrustedRuntimeResolver` only. P3 starts LightRAG without provider creds. P5 indexing needs embedding/LLM config. Plans don't say how config reaches runtime.

Add narrow contract before P5:

1. API resolves typed provider config privately
2. API → controller over private network
3. Controller accepts approved typed config fields only
4. Controller injects secrets at runtime process start

**Don't:**

- `domain.env`
- generated Compose
- DB plaintext secrets
- browser exposure
- logs with secrets
- arbitrary env map

**Credential rotation:**

- Admin rotates encrypted credential
- Running runtime keeps current process config
- Admin stop/start applies new credential

No secret-sync worker. No runtime config history.

P5 blocked until pinned LightRAG fixture proves this flow.

### LightRAG concurrency

Don't call sync SDK wrappers from FastAPI handlers. Upstream: sync wrappers not cross-thread safe under concurrent load. Use private HTTP runtime calls or async `a*` methods only.

---

## 4. APIs & backend

Public API stays thin:

```
Browser
  -> Context Engine API
  -> DB / source worker / private runtime
```

### Backend rules

**Never hold DB transaction during:**

- parser execution
- LightRAG HTTP call
- provider LLM stream
- SSE response

Pattern: write short durable state → commit → slow work → re-lock only to settle guarded state.

**Idempotency — only where duplicate req hurts:**

| Operation | Key |
| --- | --- |
| Chat turn | client request UUID, unique per conversation |
| Upload | content SHA-256, unique per domain |
| Domain lifecycle | domain operation ID + generation fencing |

P5 stale-state protection = good. Readiness updates need current generation + accepted state. Late results can't restore query eligibility. Keep it.

---

## 5. Admin upload while users query

Split = good.

| Component | Job |
| --- | --- |
| API | validate upload, persist intent, return fast |
| Source worker | parse, normalize, index, poll readiness, cleanup |
| LightRAG runtime | serve retrieval |

P4: parsing out of API. P5: remote source mutation in one worker.

**Add only:**

- upload size limit
- MIME/type validation
- parser timeout
- worker memory/CPU limit
- one worker job lease
- domain delete fence

No separate parse worker, index worker, poller, Redis queue, event bus.

User querying Domain A must not wait for admin indexing Domain B. Provider quotas may still fight — fix with static concurrency caps, not new architecture.

---

## 6. Runtime limits & scaling

Server-owned deployment limits. No admin UI sliders.

| Component | Limits |
| --- | --- |
| API | req timeout, max SSE streams, max body size |
| Source worker | CPU, memory, parser timeout, max one active parse/index mutation initially |
| Each LightRAG runtime | CPU, memory, PID cap, max in-flight queries/domain, embedding/LLM async caps, upstream timeout |

Pin LightRAG async/concurrency/timeout settings at bootstrap. Browser req must not change them.

### Capacity

**5–10 users — valid target:**

```
one API
one Postgres
one source worker
one controller
one runtime/domain
```

**50 users:** benchmark first. Don't promise.

**Benchmark scenarios:**

- 10 concurrent evidence queries
- 5 concurrent streamed chats
- 1–2 active source prep/index jobs
- queries across multiple domains
- admin delete during indexing
- runtime restart mid-request
- provider timeout/rate-limit simulation

**Measure:**

- p95 evidence latency
- p95 first-token latency
- error rate
- runtime memory
- Postgres CPU/connections
- worker queue age
- provider 429/timeout count
- disk growth

At 50: scale proven bottleneck only. Likely order:

1. provider quota/concurrency
2. LightRAG runtime RAM
3. source worker throughput
4. API replicas
5. Postgres tuning

Don't prebuild HA.

---

## 7. Auth, permissions, security

P1 session design = good: opaque random HttpOnly cookie, token hash in DB only, Argon2id passwords, fresh server-side role checks, Secure cookies outside dev.

**Before browser rollout:**

- every conversation route: `owner_user_id = current_user.id`
- admin does not auto-read member chats
- cookie-auth unsafe methods: enforce Origin/CSRF
- production ingress: TLS only

CSRF/origin rules = release gate. Not optional note.

**Parser security:**

- worker non-root
- no Docker socket on worker
- restricted source folder mount
- no LightRAG workspace/log mount on worker
- MIME/type validation
- size/time/resource limits

No AV pipeline unless untrusted external upload becomes real req.

---

## 8. Rate limiting

Add before internal pilot browser access. Keep small.

| Endpoint | Limit |
| --- | --- |
| `POST /auth/login` | ingress login limit |
| `POST` source upload/retry | admin upload limit |
| `POST` retrieval/chat | authenticated user limit |
| per-domain query cap | protects shared runtime |

Return: `429 rate_limited`, `Retry-After`, `requestId`.

No Redis on one API host.

API replicas later → move enforcement to ingress. No DB rate-limit rows.

---

## 9. Caching & CDN

Skip CDN. Internal auth RAG app gains little.

Don't cache chat answers. Breaks citations, history, deletion, provider changes, evidence eligibility.

**OK later:**

- static browser asset cache
- authenticated image/source ETag cache
- very short domain-list client cache

P5 fixture must prove deleted source can't reappear from LightRAG delayed readiness or stale cache. Test already required — keep it.

---

## 10. Logs, monitoring, Langfuse

P1 request IDs + typed safe errors = strong start.

**Structured log schema:**

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

### Langfuse

Add P7/P8. Not P1.

**Trace path:**

```
Context Engine request
  -> retrieval
  -> evidence mapping
  -> synthesis
  -> stream completion/failure
```

**Metadata only by default:**

- `request_id`
- opaque turn ID
- domain ID
- model-profile ID
- latency
- retrieval hit count
- citation count
- safe outcome code

Don't send: user questions, assistant answers, source blocks, images, uploads, provider secrets, real usernames.

Use masking before trace payload leaves Context Engine. Langfuse supports async tracing, OTel-compatible trace IDs, sampling, export-time masking.

**Langfuse = observational only.** Langfuse down → chat, retrieval, upload still work.

---

## 11. CI/CD, tests, release

Docs already have: Compose, migrations, phase tests, OpenAPI snapshots, pinned LightRAG contract fixtures. Good base.

**Missing minimum pipeline — every PR:**

- format/lint
- type checks
- unit tests
- Postgres integration tests
- Alembic fresh-upgrade test
- OpenAPI snapshot test
- secret scan

Pinned LightRAG image update → real container contract fixture.

**Before pilot — full E2E:**

```
auth -> domain -> upload -> prepare -> index
  -> retrieve -> chat -> delete -> restore test
```

No auto DB downgrade. Backup before prod migration. Test restore — not just backup creation.

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

**Keep lean.**

**Add:**

- conversation history per user
- domain pick per turn
- strict deletion/redaction contract
- runtime/provider secret delivery contract
- resource/admission limits
- minimal CI
- structured logs + optional masked Langfuse traces

**Don't add:**

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
