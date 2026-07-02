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

-# Source Blocks Table

Table: `source_blocks` — flat, ordered, citable units produced after parsing.

Parent overview: [[F-004 P4 Table Schema]]. Owning source: [[Source Documents Table]].

**Status:** Column detail is a proposed DATA-001 patch — not migrated yet.

---

## What It Owns

Stable Context Engine block identity and canonical Markdown. P5/P6/P7 use these for evidence — **not** parser chunks or a persisted document tree.

Do not rename to **chunk** in code or contracts.

**Kinds:** `text` | `table` | `figure`

---

## Schema

```text
source_blocks
+----------------------+------------------------------------------+
| id (PK)              | stable CE UUID (NOT parser id)           |
| source_document_id   | FK -> source_documents.id                |
| domain_id            | FK -> domains.id                         |
| source_order         | 1, 2, 3... stable order in source       |
| kind                 | text | table | figure                    |
| canonical_markdown   | normalized block content                 |
| heading_level        | nullable (e.g. 1 = H1)                     |
| page_start, page_end | nullable page range                      |
| section_path         | ordered heading labels (array/json)      |
| created_at           |                                          |
+----------------------+------------------------------------------+
```

---

## Example Rows

For prepared source `src_d4e5f6` (safety manual):

```text
id        order  kind    page   section_path              markdown (truncated)
--------  -----  ------  ----   ------------------------  ---------------------
blk_001   1      text    1      ["Safety Manual"]         "# Safety Manual\n..."
blk_002   2      text    1-2    ["Safety Manual","Intro"] "## Introduction\n..."
blk_003   3      table   5      ["Appendix A"]            "| Col A | Col B |\n..."
blk_004   4      figure  7      ["Diagrams"]              "![Figure 3](...)"
```

Figure block `blk_004` may link to [[Source Images Table]] rows. See [[P4 Image Storage Architecture]] and [[P5 LightRAG Text Indexing]] for text vs bytes split.

---

## Publish Rule

Insert blocks and images in **one DB transaction** with [[Source Images Table]]. Partial publish on validator failure = rollback; source stays `pending`.

---

## Related

- [[P4 Image Storage Architecture]]
- [[P5 LightRAG Text Indexing]]
- [[F-004 P4 Table Schema]]
- [[Source Documents Table]]
- [[Source Images Table]]
- [[Source Preparation Operations Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
