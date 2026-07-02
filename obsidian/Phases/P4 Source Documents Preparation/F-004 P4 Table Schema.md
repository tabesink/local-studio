---
type: architecture
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
  - type/architecture
  - layer/data
  - contract/data
  - architecture
  - status/active
---

# F-004 P4 Table Schema

Junior-dev explainer for the four P4 Postgres tables. Parent readiness: [[F-004 P4 Readiness]].

**Status:** Official contract (`DATA-001`) names tables and state enums. Column-level detail is a **proposed patch** (`.devnotes/P3-post-impl-REVIEW/ID-A*.md`) — not migrated yet.

---

## Big Picture

```text
domains (P3, already exists)
  |
  +-- source_documents          "the uploaded PDF/file"
  |     |
  |     +-- source_preparation_operations   "worker jobs: parse this file"
  |     +-- source_blocks                   "citable text/table/figure units"
  |           |
  |           +-- source_images             "image bytes metadata for figures"
  |
  +-- private disk: original file + image files (NOT in DB columns)
```

**Flow:** upload → `source_documents` (`pending`) + op (`queued`) → worker parses → writes `source_blocks` + `source_images` in one transaction → source becomes `prepared`.

Deep dives: [[P4 Source Upload Flow]], [[P4 Private Storage Rules]], [[P4 Image Storage Architecture]].

---

## Table Leaf Notes

| Table | Note |
| --- | --- |
| `source_documents` | [[Source Documents Table]] |
| `source_preparation_operations` | [[Source Preparation Operations Table]] |
| `source_blocks` | [[Source Blocks Table]] |
| `source_images` | [[Source Images Table]] |

---

## Relationship Diagram (Example IDs)

```text
domains
  id: acme-docs
  |
  +-- source_documents  src_d4e5f6  state=prepared  parser_kind=reducto  prep_gen=1
  |     |
  |     +-- source_preparation_operations
  |     |     op_010  prepare  succeeded  gen@start=1
  |     |
  |     +-- source_blocks
  |     |     blk_001  order=1  text
  |     |     blk_002  order=2  text
  |     |     blk_003  order=3  table
  |     |     blk_004  order=4  figure  ----+
  |     |                                    |
  |     +-- source_images                      |
  |           img_001  block=blk_004  <--------+
  |
  +-- source_documents  src_a1b2c3  state=pending  prep_gen=2
        |
        +-- source_preparation_operations
              op_001  prepare  failed
              op_002  retry    running  gen@start=2
        (no source_blocks yet)
```

---

## Lifecycle Cheat Sheet

```text
UPLOAD
  POST .../sources
    -> source_documents: state=pending, parser_kind=frozen
    -> source_preparation_operations: status=queued, type=prepare
    -> private file saved (path NOT in DB/API)

PREPARE (worker)
  claim op -> running
  parse (Docling|Reducto) -> temporary PreparedSource (NOT persisted)
  validate -> INSERT source_blocks + source_images (all-or-none)
  source.state = prepared, op.status = succeeded

FAIL
  source stays pending
  op.status = failed (+ safe error_code/message)

RETRY
  preparation_generation += 1
  new op with new gen@start, same parser_kind

DELETE
  source.state = deleting
  delete blocks, images, ops, private files
  hard-delete source row
```

---

## What Is NOT In These Tables

| Never store in P4 tables | Why |
| --- | --- |
| storage paths / URLs | private; QA-002 |
| parser task id, provider payload | parser-native; forbidden |
| raw source text in API columns | only in `canonical_markdown` on blocks after prep |
| `failed` on `source_documents.state` | use failed **operation** |
| generic `jobs` / JSON metadata | constitution / F-004 |
| LightRAG / index fields | P5 adds `source_documents.index_*` |

---

## For Implementation

1. **Read first:** `DATA-001`, F-004 spec, then `.devnotes/P3-post-impl-REVIEW/ID-A.md` field patches.
2. **Pattern to copy:** P3 `domain_operations` (leases, one-active partial unique, generation fencing).
3. **Blocked until:** DATA-001 is patched with exact columns before T-010 migration (readiness doc A1–A3).

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Private Storage Rules]]
- [[P4 Image Storage Architecture]]
- [[P5 LightRAG Text Indexing]]
- [[P6 Evidence And Asset Delivery]]
- [[Source Documents Table]]
- [[Source Preparation Operations Table]]
- [[Source Blocks Table]]
- [[Source Images Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
