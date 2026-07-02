---
type: architecture
phase: P4
feature: F-004
status: active
layer:
  - storage
  - lightrag
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/architecture
  - layer/storage
  - layer/lightrag
  - architecture
  - status/active
---

# P4 Image Storage Architecture

How figure and table content split between Postgres, private disk, and what later phases search or display.

Tables: [[Source Blocks Table]], [[Source Images Table]]. Storage: [[P4 Private Storage Rules]]. Indexing: [[P5 LightRAG Text Indexing]]. Delivery: [[P6 Evidence And Asset Delivery]].

---

## Core Split

```text
                    PREP (P4 worker)
                           |
         +-----------------+------------------+
         |                                    |
   source_blocks                         source_images
   canonical_markdown                    content_hash, mime, alt_text
   kind: text | table | figure           FK -> figure/table block
         |                                    |
   searchable TEXT later                  binary bytes on private disk
   (via P5 render)                        (NOT sent to LightRAG)
```

**Junior rule:** Blocks hold **words**. Images table + disk hold **pixels**. LightRAG only sees **words**.

---

## Block Kinds

| Kind | `canonical_markdown` | `source_images` row | LightRAG (P5) |
| --- | --- | --- | --- |
| `text` | paragraph/heading markdown | none | embedded as text |
| `table` | markdown table syntax | optional if parser emits raster | embedded as **text** (not a separate table file) |
| `figure` | caption / `![alt](...)` text | **required** linkage to image file | embedded as **text** only; bytes stay on CE disk |

Do not call blocks **chunks** in contracts.

---

## Publish Transaction

```text
validate PreparedSource
  -> INSERT all source_blocks
  -> INSERT all source_images
  -> write all private image files
  -> COMMIT (all-or-none)
  -> source.state = prepared
```

Partial failure = rollback; source stays `pending`, operation `failed`.

---

## Common Misconception

> Client gets a path from retrieval and reads the CE data folder.

**Not in greenfield contract.**

- Browser never accesses storage paths (constitution)
- P4 has no image download API
- P6 evidence returns safe text excerpts only — no block IDs, asset IDs, or paths
- Showing actual figure pixels needs a **future opaque source-ref API** — see [[P6 Evidence And Asset Delivery]]

Correct model: CE backend serves bytes **after authz** through an API contract, not raw filesystem paths to the client.

---

## Data Ownership (Summary)

| Data | System of record | Browser in P4 |
| --- | --- | --- |
| Original upload | private storage + [[Source Documents Table]] metadata | no |
| Image bytes | private storage + [[Source Images Table]] metadata | no |
| Block text | [[Source Blocks Table]] | no (admin safe DTOs only; no full corpus in P4) |

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Private Storage Rules]]
- [[Source Blocks Table]]
- [[Source Images Table]]
- [[P5 LightRAG Text Indexing]]
- [[P6 Evidence And Asset Delivery]]
- [[F-004 P4 Table Schema]]
- [[Context Engine Index]]
