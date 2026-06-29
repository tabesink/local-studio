# Context Engine — Cross-Phase Alignment Resolutions

**Status:** Canonical reconciliation layer for the greenfield phase plans.

This document resolves the known tensions between the high-level scaffold, phase leaf plans, systems-slices review, launch-readiness review, frontend API review, old Context Engine behavior, and Local Studio UI references. When a phase document still contains older conflicting detail, this document and `development-scafold.md` win until the leaf plan is corrected.

## Source Precedence

1. Context Engine product boundary and terminology in `CONTEXT.md`.
2. `development-scafold.md` plus this alignment document.
3. Phase leaf documents `p1` through `p8`.
4. Systems-slices and launch-readiness reviews as critique lenses.
5. Old Context Engine and Local Studio reference code as evidence, not runtime authority.

Reference architectures can inform implementation patterns, but they cannot add product scope, browser authority, storage ownership, or retrieval paths that conflict with Context Engine.

## Resolved Decisions

### Product Boundary

Context Engine is a small internal shared-workspace RAG product. It is not a general assistant, tenant platform, document-management system, agent system, or model playground.

All authenticated users query administrator-curated **Knowledge Domains**. Administrators manage domains, sources, providers, parsers, operations, and diagnostics.

### Browser and API Boundary

The browser talks only to the Context Engine application API.

The browser never talks directly to LightRAG, Docker, workers, object storage, databases, model providers, or parser services. It never selects provider, model, embedding profile, parser, prompt, retrieval strategy, top-k, reranker, runtime URL, or LightRAG route.

### Operation Ownership

Do not build a generic operation/workflow table.

Use resource-specific ownership:

| Work type | Canonical owner |
| --- | --- |
| Domain lifecycle | `domain_operations` |
| Source parsing/preparation | `source_preparation_operations` |
| Source indexing eligibility | `source_documents.index_state` and guarded source worker transitions |
| Chat turns | `conversation_turns` |
| Security/admin audit | `audit_events` |

No workflow engine, event bus, Redis queue, Celery/RQ stack, or cross-resource operation abstraction is part of the pilot.

### Parser Snapshot

P2 owns one active parser setting:

```text
runtime_settings.active_parser_kind = docling | reducto
```

P4 freezes only the selected parser kind on upload:

```text
source_documents.parser_kind = docling | reducto
```

On retry, the worker keeps the frozen parser kind and resolves the current credential privately. Do not add `parser_profile_id`, `parser_config_revision`, or `prepared_schema_version` until a real canonical-model migration/reprepare feature exists.

### Embedding Profile

The domain embedding profile is selected at domain creation and immutable immediately.

Wrong profile means hard-delete the empty domain and recreate it. Do not add `embedding_locked_at`, pre-index embedding edits, embedding revision logic, or an embedding migration workflow in the pilot.

### Provider Secrets for LightRAG Runtime

P5 cannot proceed until a pinned real LightRAG fixture proves this flow:

```text
API resolves typed provider config through TrustedRuntimeResolver.
API sends only approved typed fields to the private controller.
Controller injects secrets into the runtime process at start.
No domain.env file.
No generated Compose file per domain.
No plaintext DB copy.
No arbitrary environment map.
No browser exposure.
No logging.
```

Credential rotation is stop/start based:

```text
admin rotates encrypted credential
existing runtime keeps current process config
admin stop/start applies new credential
```

No secret-sync worker or runtime config history.

### Delete and Redaction

Source and domain deletion must be honest about asynchronous cleanup.

Domain delete:

```text
DELETE domain
-> mark domain state=deleting
-> return 202 with safe operation/domain state
-> fence new uploads, retries, retrieval, and chat turns
-> worker deletes source content from LightRAG before local source removal
-> controller removes runtime, runtime database, workspace, logs
-> domain row disappears
-> GET domain after completion returns 404
```

Source delete:

```text
DELETE source
-> block future retrieval immediately
-> return 202 when remote cleanup is required
-> delete remote LightRAG content before local row/file removal
-> late ready results cannot restore eligibility
```

Conversation history and hard delete are reconciled through redaction:

```text
source deleted -> turns citing that source lose answer/citations; user question remains
domain deleted -> turns for that domain lose answer/citations; user question remains
conversation remains visible to its owner
deleted-domain turns cannot continue
```

No soft-delete product, citation-history subsystem, tombstone UI, archive, restore, or generic purge framework is part of the pilot.

### Conversation and Chat

The pilot chat product is RAG-only.

```text
Conversation belongs to one user.
Turn records the active domain used for that turn.
turn.domain_id is required.
Past turns provide bounded continuity only; they never expand retrieval scope.
Current turn retrieval is scoped only to the selected available domain.
One active running turn per conversation.
Different conversations and users may run in parallel subject to server-owned admission limits.
```

General chat with no domain, direct non-grounded answers, chat-memory vector stores, semantic search over old chats, shared team conversations, and cross-domain retrieval are separate product decisions and are deferred.

### Runtime Limits and Admission

The first pilot target is 5-10 concurrent users. A 50-user promise requires benchmark evidence first.

Add server-owned limits before browser pilot:

```text
API request body limit
request timeout
max SSE streams
login/admin-write/chat rate limits
per-domain query cap
parser timeout
worker CPU/memory caps
LightRAG runtime CPU/memory/PID caps
provider timeout/concurrency caps
```

Do not expose these as admin UI sliders in the pilot.

### Observability and Langfuse

Structured logs use one safe event schema and request correlation. Logs, audit, and tracing must never include provider secrets, session tokens, raw source text, parser payloads, prompts, raw answers, raw LightRAG responses, runtime paths, or stack traces.

Langfuse is optional, off by default, metadata-only, and observational. If Langfuse is unavailable, auth, upload, retrieval, chat, SSE, source deletion, and domain deletion still work.

### Launch Readiness

Before internal pilot, prove:

```text
format/lint
type checks
unit tests
PostgreSQL integration tests
Alembic fresh-upgrade test
OpenAPI snapshot test
secret scan
Compose smoke test
full auth -> domain -> upload -> prepare -> index -> retrieve -> chat -> delete -> restore E2E
lightweight expected-load test for 5-10 concurrent users
dependency failure tests for provider timeout/rate limit, worker unavailable, DB unavailable, and invalid upload
```

Do not invent numeric latency/error targets as facts. Record proposed defaults and calibrate them against the actual pilot environment, provider quotas, hardware, and data size.

## Deferred Decisions

These are intentionally not resolved for the pilot:

```text
general non-grounded chat
domainless chat
cross-domain retrieval
private per-user corpora
team conversation sharing
50-user scale target
Kubernetes or high availability
CDN
provider failover
parser plugin marketplace
compliance/legal retention policy
full content tracing
```
