---
id: ARCH-003
title: Data Ownership and Lifecycle
status: draft
owner: <data owner>
last_reviewed: <YYYY-MM-DD>
depends_on: [PROD-002, ARCH-002]
supersedes: []
---

# Data Ownership and Lifecycle

## System of record

| Data set/entity | System of record | Writer(s) | Reader(s) | Retention | Classification |
| --- | --- | --- | --- | --- | --- |
| `<data>` | `<system>` | `<components>` | `<components>` | `<period>` | `<public/internal/confidential/...>` |

## Lifecycle

For each high-risk or important entity, define:
- creation authority;
- state transitions;
- immutable vs mutable fields;
- delete/archive/purge behaviour;
- audit requirements;
- backup and restore expectations.

## Migration rules

- Schema changes must be versioned and reversible where practical.
- Data migration must have validation, backfill strategy, and rollback/compensation plan.
- Destructive changes require explicit approval and a tested recovery path.
