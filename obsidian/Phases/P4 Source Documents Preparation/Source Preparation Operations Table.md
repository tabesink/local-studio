---
type: table
phase: P4
feature: F-004
status: active
layer: data
contract: DATA-001
spec: specs/03-contracts/data/context-engine-data.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/table
  - layer/data
  - contract/data
  - status/active
---

# Source Preparation Operations Table

Table: `source_preparation_operations` — worker jobs that parse a Source Document.

Parent overview: [[F-004 P4 Table Schema]]. Owning source: [[Source Documents Table]]. Created on upload: [[P4 Source Upload Flow]].

**Status:** Column detail is a proposed DATA-001 patch — not migrated yet.

---

## What It Owns

History of prep work on one source. Worker claims rows with lease fields. Safe errors go here, not on the source row.

**Statuses:** `queued` | `running` | `succeeded` | `failed` | `cancelled`

**Operation types:** `prepare` | `retry` | `cancel` | `delete` (if delete is async)

---

## Schema

```text
source_preparation_operations
+-------------------------------+----------------------------------+
| id (PK)                       | operation UUID                   |
| source_document_id (FK)       | -> source_documents.id           |
| domain_id (FK)                | -> domains.id (purge/list joins) |
| operation_type                | prepare | retry | cancel | delete|
| status                        | queued | running | ...          |
| preparation_generation_at_start| copy of source.preparation_gen |
| requested_by_user_id          | FK -> users.id                   |
| message                       | safe operator text               |
| error_code, error_message     | safe failure only                |
| lease_owner, lease_expires_at | worker claim                     |
| started_at, finished_at       |                                  |
| created_at, updated_at        |                                  |
+-------------------------------+----------------------------------+

PARTIAL UNIQUE: one active op per source
  WHERE status IN ('queued', 'running')
```

---

## Example Rows

One source (`src_a1b2c3`), two attempts:

```text
id       source_id   type     status     gen@start  error_code
-------  ----------  -------  ---------  ---------  ------------------
op_001   src_a1b2c3  prepare  failed     1          PARSER_FAILED
op_002   src_a1b2c3  retry    running    2          (null)
```

---

## Stale-Worker Rule

```text
if source.preparation_generation != op.preparation_generation_at_start
  -> worker publish/cancel is a NO-OP (0 rows updated)
```

On retry: increment `preparation_generation` on [[Source Documents Table]], then enqueue a new op with the new `preparation_generation_at_start`.

---

## Pattern To Copy

P3 `domain_operations`: leases, one-active partial unique index, generation fencing.

---

## Related

- [[P4 Source Upload Flow]]
- [[F-004 P4 Table Schema]]
- [[Source Documents Table]]
- [[Source Blocks Table]]
- [[Source Images Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
