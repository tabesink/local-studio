---
type: architecture
phase: P4
feature: F-004
status: active
layer:
  - data
  - lightrag
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/architecture
  - layer/data
  - layer/lightrag
  - architecture
  - status/active
---

# P4 Parser To LightRAG Data Shape

Terse data-shape guide: Docling/Reducto native output → PreparedSource → Source Blocks → LightRAG marker text.

Full doc: `.devnotes/P4-parser-output-to-lightrag-data-shape-guide.md`

**Feature:** [[F-004 P4 Readiness]] → [[P5 LightRAG Text Indexing]]

---

## Pipeline (One Screen)

```text
upload -> source_documents(pending) + prep op(queued)
  -> worker: Docling|Reducto parse (ephemeral)
  -> PreparedSource (validate, NOT persisted)
  -> source_blocks + source_images (all-or-none)
  -> [P5] render_lightrag_input() -> LightRAG ainsert(text)
  -> [P6] CE_BLOCK marker in hit -> source_blocks row
```

P4 stops at `prepared`. No LightRAG call in P4.

---

## Native Parser Shapes (Discard After Map)

| | Reducto | Docling |
| --- | --- | --- |
| Top unit | `result.chunks[]` | `DoclingDocument` |
| Walk order | `chunks[].blocks[]` | `body` tree reading order |
| Atoms | `type` + `content` + `bbox` | `texts/tables/pictures` + JSON pointers |
| CE keeps | content, page (from bbox), header inference | content, page, section headers |
| CE drops | `job_id`, urls, bbox, confidence, `embed` | tree, pointers, raw dict blob |

Refs: [Reducto parse format](https://docs.reducto.ai/parse/response-format), [DoclingDocument](https://docling-project.github.io/docling/concepts/docling_document/)

---

## Product Truth Tables

See [[F-004 P4 Table Schema]] and [[Source Blocks Table]].

Canonical document = flat **`source_blocks`** rows, not parser chunks or Docling tree.

---

## LightRAG Embed Shape

- Input: one deterministic string per source with `[CE_SOURCE ...]` + repeated `[CE_BLOCK ...]` + `canonical_markdown`
- LightRAG splits/embeds **text** internally; CE Block id lives in marker line
- Image bytes: **not** embedded — [[P4 Image Storage Architecture]]

Details: [[P5 LightRAG Text Indexing]]

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Image Storage Architecture]]
- [[Source Blocks Table]]
- [[Source Documents Table]]
- [[P5 LightRAG Text Indexing]]
- [[P6 Evidence And Asset Delivery]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
