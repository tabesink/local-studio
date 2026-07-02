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

# Source Images Table

Table: `source_images` — metadata for images extracted from figure/table blocks.

Parent overview: [[F-004 P4 Table Schema]]. Owning source: [[Source Documents Table]]. Linked block: [[Source Blocks Table]].

**Status:** Column detail is a proposed DATA-001 patch — not migrated yet.

---

## What It Owns

Safe image metadata (hash, mime, alt text, page). Actual bytes live in **private storage**; DB and API must not expose storage paths or download URLs in P4.

Architecture: [[P4 Image Storage Architecture]]. Storage rules: [[P4 Private Storage Rules]]. Retrieval/display: [[P6 Evidence And Asset Delivery]].

Typically tied to `figure` (or `table`) [[Source Blocks Table]] rows.

---

## Schema

```text
source_images
+----------------------+------------------------------------------+
| id (PK)              | stable UUID                              |
| source_document_id   | FK -> source_documents.id                |
| source_block_id      | FK -> source_blocks (figure/table)       |
| content_hash         | sha256 of image bytes                    |
| mime_type            | e.g. image/png                           |
| alt_text             | nullable safe label                      |
| page_number          | nullable                                 |
| created_at           |                                          |
+----------------------+------------------------------------------+
```

---

## Example Row

Linked to figure block `blk_004` on source `src_d4e5f6`:

```text
id        source_id   block_id  hash (short)  mime        page  alt_text
--------  ----------  --------  ------------  ----------  ----  ---------
img_001   src_d4e5f6  blk_004   ab12cd34...   image/png   7     "Figure 3"
```

---

## Publish Rule

Inserted in the same transaction as [[Source Blocks Table]] rows (all-or-none). Deleted with source/domain purge.

---

## Related

- [[P4 Image Storage Architecture]]
- [[P4 Private Storage Rules]]
- [[P5 LightRAG Text Indexing]]
- [[P6 Evidence And Asset Delivery]]
- [[F-004 P4 Table Schema]]
- [[Source Documents Table]]
- [[Source Blocks Table]]
- [[Source Preparation Operations Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
