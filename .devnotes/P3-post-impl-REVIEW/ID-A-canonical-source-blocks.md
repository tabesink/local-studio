# ID-A - Canonical Source Blocks (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** How should parser output become Source Blocks without copying old chunk/tree behavior?

### Decision

Docling and Reducto adapters must normalize into one temporary `PreparedSource` shape. The worker validates that shape, then publishes flat `source_blocks` and `source_images` all-or-none.

Do not persist old `DocumentStructure`, `DocumentSection`, `DocumentBlock`, `SourceChunk`, or parser-native payloads as product truth.

### Why

| Bad | Good |
| --- | --- |
| old `document_source_chunks` drive evidence | `source_blocks` drive evidence |
| parser-native ids become stable ids | Context Engine UUIDs become stable ids |
| full document tree is persisted | flat ordered blocks with safe metadata |
| P4 creates LightRAG-ready CE_BLOCK strings | P4 creates Source Blocks; P5 renders and proves LightRAG handoff |

### PreparedSource Sketch

This shape should be captured in F-004 before code:

| Field | Rule |
| --- | --- |
| `sourceDocumentId` | owning source id |
| `blocks[]` | ordered canonical blocks |
| `images[]` | private image metadata tied to figure/table blocks |
| `parserKind` | frozen parser kind |
| `warnings[]` | safe warning codes/messages only |

Each prepared block:

| Field | Rule |
| --- | --- |
| `sourceOrder` | unique ascending order |
| `kind` | `text`, `table`, `figure` |
| `canonicalMarkdown` | normalized block content |
| `headingLevel` | nullable |
| `pageStart`, `pageEnd` | nullable; valid range |
| `sectionPath` | safe heading labels |

### Validator Rules

```text
Reject if:
  no blocks
  duplicate sourceOrder
  invalid block kind
  empty canonicalMarkdown for text/table block
  figure block has missing image linkage when required
  pageStart > pageEnd
  parser-native payload leaks into prepared shape
```

Validation failure leaves the Source Document `pending` and records a failed preparation operation.

### Vs Old Reference

Old `context_engine` code built `DocumentStructure` with pages, sections, blocks, SourceChunks, assets, parser metadata, parser job id, and storage paths. Useful ideas: adapter normalization and all-or-none repository save. Do not copy the public shape or table split.

### Implement Order

```text
1. Write PreparedSource dataclasses/Pydantic models.
2. Write validator unit tests first.
3. Write Docling fixture -> PreparedSource test.
4. Write Reducto fixture -> same PreparedSource semantics test.
5. Write publish transaction test.
```

### Red Flags In PR

- Public DTO says `chunk`.
- Source Block id comes from parser provider.
- Parser metadata JSON is persisted.
- P4 stores `CE_BLOCK` strings before P5 proof.
- Partial blocks remain after validator failure.

### Tests

- Docling and Reducto fixtures produce the same block kinds/order rules.
- Validator rejects duplicate order and invalid page range.
- Publish creates blocks/images only on valid PreparedSource.
- Failed publish leaves zero Source Blocks for that source.

### One-line Summary

P4 turns parser output into Context Engine Source Blocks, not old chunks, native parser trees, or LightRAG input.
