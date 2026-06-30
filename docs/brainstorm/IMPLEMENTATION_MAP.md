# Backend Implementation Map

This is the shared technical source of truth for multi-issue backend work. Keep it current whenever a slice changes state ownership, routes, schemas, or cross-layer contracts.

## Architecture

```text
Browser -> Context Engine API -> PostgreSQL
                             -> Worker
                             -> Private Domain Controller -> Docker/LightRAG runtimes
                             -> Provider adapters
```

The API is the only browser-facing backend. The worker performs slow source/index/delete work. The controller is the only Docker-privileged process.

## Layer Boundaries

- Routes parse requests and render responses.
- Services orchestrate use cases and transactions.
- Domain policies own state transitions and validation.
- Repositories own SQL and table access.
- Infrastructure clients own Docker/controller, LightRAG, storage, parser, and provider adapters.
- Cross-cutting middleware owns request IDs, error envelopes, auth dependencies, logging, rate limits, and tracing.

## Core State

Domain state:

```text
stopped | running | deleting
```

Source state:

```text
pending | prepared | deleting
```

Source index state:

```text
not_requested | queued | submitting | accepted | ready | failed | cancelling | cancelled
```

Turn status:

```text
running | completed | failed | redacted
```

Turn answer kind:

```text
general | grounded
```

## Database Sequence

1. `0001_users_and_sessions`
2. `0002_trusted_runtime_config`
3. `0003_domain_lifecycle`
4. `0004_source_documents_and_preparation`
5. `0005_source_index_state`
6. P6 indexes only if query plans prove need
7. `0007_conversations_and_turns`

## Cross-Phase Contracts

Auth:

- opaque cookie token;
- DB stores token hash only;
- role comes from DB;
- admin/member enforced server-side.

Config:

- provider set is closed enum;
- credentials encrypted at rest;
- only private resolver decrypts;
- embedding profile is immutable from domain create.

Runtime:

- API has no Docker socket;
- controller has fixed actions only;
- runtime containers have no host ports;
- runtime names/paths/DBs derive from domain ID and runtime instance ID.

Source:

- original file is immutable;
- parser kind freezes at upload;
- prepared source is flat ordered blocks and images;
- no persisted parser-native payload.

Indexing:

- one deterministic render per source;
- one current index intent on source row;
- native LightRAG ready required;
- exact source delete requires remote delete before local row removal when indexed.

Retrieval:

- browser selects domain only;
- every raw hit must map to exactly one local `SourceBlock`;
- unmapped, ambiguous, foreign, deleted, or ineligible hits are discarded;
- browser receives opaque refs only.

Chat:

- prior context includes prior user questions only;
- direct chat has no retrieval and no citations;
- grounded chat uses P6 mapped evidence only;
- citation validator allows only current-turn evidence IDs;
- source/domain delete redacts grounded turns only.

Observability:

- metadata only;
- failure isolated;
- no questions, prompts, answers, source text, source refs, raw payloads, paths, runtime URLs, or secrets.

## Forbidden Shortcuts

Do not add:

- Redis, Celery/RQ, Temporal, generic workflow engine, or event bus;
- local vector/BM25/graph retrieval fallback;
- direct LightRAG browser route;
- raw original/source download;
- generic config key-value table;
- provider/model selection from user requests;
- persisted runtime manifests or env files;
- source/evidence/query-history persistence outside planned tables;
- unbounded agent loops or tool-calling.

## Handoff Requirements

Before handing off a phase:

- update issue baton status and notes;
- update `docs/master-build-plan.md`;
- update this implementation map if contracts changed;
- update `docs/DATABASE_OWNERSHIP.md` for schema changes;
- update `docs/test-strategy.md` with exact commands/results;
- record durable decisions in `docs/decisions/log.md` or ADRs.

