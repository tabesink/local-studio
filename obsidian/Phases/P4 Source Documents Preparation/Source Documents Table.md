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

# Source Documents Table

Table: `source_documents` — one admin-uploaded file in one Knowledge Domain.

Parent overview: [[F-004 P4 Table Schema]]. Feature context: [[F-004 P4 Readiness]].

**Status:** Column detail is a proposed DATA-001 patch (`.devnotes/P3-post-impl-REVIEW/ID-A*.md`) — not migrated yet.

---

## What It Owns

Safe metadata, lifecycle state, frozen parser choice, and a generation fence for stale workers. The immutable original file lives on **private disk**; this row does not store paths.

**States:** `pending` | `prepared` | `deleting`

No `failed` state — failures live on [[Source Preparation Operations Table]] rows.

---

## Schema

```text
source_documents
+----------------------+------------------------------------------+
| id (PK)              | opaque source id                         |
| domain_id (FK)       | -> domains.id                            |
| original_filename    | safe display name, NOT a path            |
| content_type         | e.g. application/pdf                     |
| original_sha256      | hash of immutable original               |
| original_size_bytes  | file size                                |
| state                | pending | prepared | deleting            |
| parser_kind          | docling | reducto (frozen at upload)     |
| preparation_generation| int fence, starts at 1                  |
| created_by_user_id   | FK -> users.id                           |
| created_at, updated_at| timestamps                              |
+----------------------+------------------------------------------+

UNIQUE (domain_id, original_sha256)  -- same file twice in same domain = reject
INDEX  (domain_id, created_at DESC)    -- admin list
```

---

## Example Rows

```text
id          domain_id   original_filename   state     parser_kind  prep_gen
----------  ----------  ------------------  --------  -----------  --------
src_a1b2c3  acme-docs   Q3-report.pdf       pending   docling      1
src_d4e5f6  acme-docs   safety-manual.pdf   prepared  reducto      1
src_g7h8i9  acme-docs   old-draft.pdf       deleting  docling      2
```

---

## Junior Mental Model

Think **file header row**. One row per upload.

**Child rows:** [[Source Preparation Operations Table]], [[Source Blocks Table]], [[Source Images Table]].

**Upload:** created by [[P4 Source Upload Flow]]; original bytes on private disk per [[P4 Private Storage Rules]].

**Do not store here:** storage path, parser task id, raw text, LightRAG/index fields (P5 adds `index_*` on this table).

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Private Storage Rules]]
- [[F-004 P4 Table Schema]]
- [[Source Preparation Operations Table]]
- [[Source Blocks Table]]
- [[Source Images Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
