# P0 - Shared Contract

Goal: one project spine. Stop drift before code starts.

## Product

Context Engine = internal shared-workspace RAG workbench.

Users query Administrator-curated Knowledge Domains. Administrators manage domains, Source Documents, providers, parsers, operations, diagnostics.

Not product:

- tenant platform
- generic document manager
- model playground
- agent/tool/web-browse system
- unrestricted chatbot

## System Shape

```text
Browser
  -> Context Engine API
     -> Postgres
     -> private source storage
     -> one worker process
     -> private domain controller
     -> one private LightRAG runtime per Knowledge Domain
     -> configured provider/parser services
```

Browser never touches Docker, LightRAG, workers, storage paths, DB, providers, controller, or Langfuse.

## One Owner Per Concern

| Concern | Owner |
| --- | --- |
| Identity, roles, sessions | API + Postgres |
| Provider/model/parser config | P2 trusted config service |
| Domain lifecycle | P3 domain service + `domain_operations` |
| Source preparation | P4 source service + `source_preparation_operations` |
| Indexing state | P5 source worker + `source_documents.index_state` |
| Query eligibility | P5 `source_is_query_eligible()` |
| Evidence mapping | P6 evidence resolver |
| Conversation turns | P7 chat service + `conversation_turns` |
| Audit | P8 `audit_events` |
| Semantic/vector/graph retrieval | LightRAG |

No duplicate state owner.

## State Rules

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

Failure belongs to operation/index fields, not extra source/domain states.

## Hard Rules

- DB-backed opaque cookie sessions. No JWT/localStorage.
- Server-side authorization on every protected route.
- No generic workflow engine, event bus, Redis/RQ/Celery, or generic jobs table.
- One worker process. Extend it for domain delete, source prep, indexing, remote cleanup.
- API has no Docker socket. Controller only.
- Runtime ports private. No browser/runtime direct access.
- No `domain.env`, runtime manifest, generated Compose, runtime URL, host port, workspace path column.
- No local embeddings, local vector DB, BM25 fallback, second retrieval stack.
- No approximate evidence mapping. Exact `SourceBlock` marker only.
- Deletes fence first, remove remote/provider content before local row/file removal when indexed.

## Phase Gates

```text
P1 -> auth/session.
P2 -> trusted config.
P3 -> domains/private runtime.
P4 -> source upload/prep.
P5 -> LightRAG indexing/eligibility.
P6 -> evidence only.
P7 -> RAG-only chat.
P8 -> audit/log/tracing/pilot gate.
P9 -> frontend delivery mapped to backend contracts.
```

P5 blocked until real pinned LightRAG fixture passes. No fake contract.

## Done

Every later phase can cite this file for boundary, ownership, secrets, state, delete, eligibility, logging, and forbidden infra.

