# Database Ownership

This document defines planned table ownership, migration guardrails, and deletion rules. Update it before changing schema or persistence behavior.

## Principles

- One owner per concern.
- Durable state lives in PostgreSQL unless explicitly documented otherwise.
- Runtime artifacts, paths, URLs, generated env files, and container names are derived, not persisted.
- Failure facts live on operation or current work fields, not duplicated across multiple state systems.
- Hard delete means owned durable rows and owned artifacts are gone.
- Deleting rows must not remove the retry/fencing anchor before external artifacts are confirmed removed.

## Planned Tables

P1:

| Table | Owner | Purpose |
|---|---|---|
| `users` | authentication service | user identity, role, active flag, password hash |
| `auth_sessions` | session service | hashed opaque session tokens, expiry, revocation |

P2:

| Table | Owner | Purpose |
|---|---|---|
| `provider_configs` | trusted runtime config service | one row per provider kind, encrypted credential, Bedrock region |
| `model_profiles` | trusted runtime config service | admin allowlist of synthesis and embedding models |
| `runtime_settings` | trusted runtime config service | active synthesis profile and active parser kind singleton |

P3:

| Table | Owner | Purpose |
|---|---|---|
| `domains` | domain lifecycle service | domain registry, immutable embedding profile reference, lifecycle state |
| `domain_operations` | domain lifecycle service | domain-specific running/succeeded/failed lifecycle operations |

P4-P5:

| Table | Owner | Purpose |
|---|---|---|
| `source_documents` | source document service | source lifecycle, immutable original metadata, parser kind, current index state |
| `source_preparation_operations` | source worker | preparation attempts, status, stage, lease, safe error |
| `source_blocks` | source document service | stable ordered canonical source content units |
| `source_images` | source document service | extracted images linked to source blocks |

P7:

| Table | Owner | Purpose |
|---|---|---|
| `conversations` | chat service | user-owned conversation container |
| `conversation_turns` | chat service | durable turn, question, answer, answer kind, status, safe citations, redaction fields |

## Forbidden Tables Without ADR

Do not add these unless a later ADR documents a real measured need:

- generic `jobs`, `operations`, `events`, or workflow tables;
- source versions or document revisions;
- source sections/pages/assets parallel to block fields;
- source index handoff history;
- remote status mirror tables;
- evidence, citation, source-ref, asset-ref, or query-history tables;
- chat-memory vector store;
- local embedding, vector, graph, or BM25 retrieval tables;
- runtime manifests, generated compose, runtime URL, container, workspace, path, or env tables.

## State Ownership

Domain:

- `domains.state` has only `stopped`, `running`, `deleting`.
- `domain_operations` records running/succeeded/failed work.
- Health and availability are computed observations, not durable state axes.

Source:

- `source_documents.state` has only `pending`, `prepared`, `deleting`.
- Preparation failure lives on `source_preparation_operations`.
- Index failure lives on source index fields.
- `index_state=ready` plus `index_ready_at` is required for query eligibility.

Chat:

- `conversation_turns.answer_kind` is `general` or `grounded`.
- Grounded turns can cite sources and are redacted on source/domain delete.
- General turns have no citations and are not redacted because a selected domain is deleted.

## Migration Guardrails

Every migration must:

- be deterministic;
- run against a fresh database;
- use constraints to enforce known state enums and invariants;
- add indexes required by public query paths;
- avoid provider, Docker, LightRAG, parser, filesystem, or network calls;
- include a development downgrade only when safe and adopted by the repo;
- update this ownership document when table responsibilities change.

Before production migration:

- backup database and source storage;
- test restore;
- run fresh-upgrade test;
- run affected integration tests;
- document residual risks.

## Delete Semantics

User/session:

- deleting a user cascades sessions only when user-management behavior is explicitly implemented.
- password hashes and session token hashes never leave the DB/API boundary.

Domain:

- `DELETE domain` sets `state=deleting` and records a delete operation.
- worker removes sources and remote LightRAG content, then controller removes runtime container, runtime DB, workspace, and logs.
- only after verification does the system delete the domain row and cascade operation rows.
- repeated delete resumes cleanup.

Source:

- local-only sources can be removed locally and return `204`.
- indexed/indexing sources become `deleting`/`cancelling`, return `202`, delete remote content first, then remove local rows/files.
- source delete redacts grounded chat turns that cited the source once P7 exists.

Conversation:

- source delete redacts grounded turns where the source appears in `cited_source_ids`.
- domain delete redacts grounded turns for that domain.
- redaction preserves user questions and removes derived answers/citations.
- direct/general turns remain intact.

## Ownership Review Checklist

Before adding or changing a table, answer:

- What concern owns this table?
- Is this duplicating a state already represented elsewhere?
- What deletes it?
- What fences stale writes?
- What public contract reads it?
- What migration/test proves it?
- Could this be a derived value instead of persisted state?

