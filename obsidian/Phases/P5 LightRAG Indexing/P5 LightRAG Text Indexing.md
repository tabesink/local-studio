---
type: architecture
phase: P5
feature: F-005
status: active
layer: lightrag
spec: specs/04-features/F-005-lightrag-indexing-eligibility/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p5
  - feature/f-005
  - type/architecture
  - layer/lightrag
  - architecture
  - status/active
---

# P5 LightRAG Text Indexing

What gets submitted to LightRAG after P4 preparation — text only, with `CE_BLOCK` markers for round-trip mapping.

Prepared sources: [[P4 Image Storage Architecture]]. Evidence: [[P6 Evidence And Asset Delivery]]. Feature: [[F-004 P4 Readiness]] (P4 handoff) + F-005 spec in repo.

**Phase:** P5. P4 must not call LightRAG.

---

## What LightRAG Receives

Architecture boundary: `indexed text, retrieval calls` — not image binaries.

Deterministic render per prepared source:

```text
[CE_SOURCE id=<source-id> schema=1 sha256=<hash>]

[CE_BLOCK id=<source-block-id> order=42 page=12 section="Results > Fatigue"]
canonical block Markdown
```

Same prepared source -> same rendered text and hash. Rendered input is **not** persisted as a product entity.

---

## Text vs Bytes

| Content | In LightRAG index | Stays in CE |
| --- | --- | --- |
| Text blocks | yes (markdown) | also in `source_blocks` |
| Table blocks | yes (markdown table text) | also in `source_blocks` |
| Figure blocks | yes (caption/alt markdown text) | image **bytes** on private disk + `source_images` |
| Original PDF | no | private storage |

LightRAG embeds **text**. It does not embed PNG/JPEG bytes in the pilot design.

---

## Why CE_BLOCK Matters

Retrieval returns text hits that must map **exactly** back to one eligible [[Source Blocks Table]] row. No fuzzy match (DEC-003, constitution).

P6 parses the marker, loads the block, verifies query eligibility, builds safe evidence excerpt from `canonical_markdown`.

---

## Query Eligibility (P5)

One server function: `source_is_query_eligible(source, domain)`.

True only when domain running/available, source `prepared`, index `ready`, no delete fence. P6 must call this — not reimplement conditions.

---

## Handoff From P4

P4 publishes flat blocks + image metadata. P5 reads stable block IDs and ordered canonical markdown. P4 does **not** store `CE_BLOCK` strings; P5 renders them at index time.

---

## Related

- [[P4 Image Storage Architecture]]
- [[P6 Evidence And Asset Delivery]]
- [[Source Blocks Table]]
- [[Source Documents Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
