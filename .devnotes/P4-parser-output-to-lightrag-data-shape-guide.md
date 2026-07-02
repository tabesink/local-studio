# P4 Data Shape Guide — Parser Output → Source Blocks → LightRAG

**Audience:** junior devs and coding agents  
**Feature:** `F-004` (P4) handoff to `F-005` (P5)  
**Authority:** active specs/contracts beat this note. If drift, patch spec first.

**One-liner:** Parsers speak their own JSON trees/chunks; Context Engine flattens to **Source Blocks**; P5 renders **marker text** for LightRAG; LightRAG embeds **text**, not image bytes.

---

## End-To-End Pipeline

```text
Administrator
  |
  | POST /admin/domains/{domain_id}/sources  (multipart: file)
  v
source_documents (pending) + source_preparation_operations (queued)
  + private original bytes on disk
  |
  | worker claim + parse (outside DB txn)
  v
+------------------------------------------------------------------+
| PARSER LAYER (private, ephemeral)                                 |
|   docling  -> DoclingDocument JSON tree                          |
|   reducto  -> ParseResponse { chunks[], blocks[] }               |
|   BOTH normalize -> PreparedSource (NOT persisted)               |
+------------------------------------------------------------------+
  |
  | validate PreparedSource
  | publish all-or-none DB txn
  v
source_blocks + source_images
source_documents.state = prepared
  |
  | P5 only (NOT P4)
  v
render_lightrag_input(source) -> deterministic marker text + hash
  |
  | LightRAG ainsert(text, ids=..., split_by_character=...)
  v
LightRAG internal: doc -> text chunks -> embeddings + entity graph
  |
  | P6 retrieval
  v
raw hit text MUST still contain exact [CE_BLOCK id=...] marker
  -> map to source_blocks row -> safe Evidence excerpt
```

**Phase boundary:** P4 stops at `prepared` + flat blocks. P4 must **not** call LightRAG.

---

## Canonical Postgres Objects (Product Truth)

Only these four P4 tables (+ private disk) are durable product entities.

```text
domains (P3)
  |
  +-- source_documents ............... uploaded file identity + lifecycle
  |     |
  |     +-- source_preparation_operations ... parse attempts (queued..cancelled)
  |     +-- source_blocks ................... flat citable units (THE canonical doc)
  |           |
  |           +-- source_images ........... figure byte metadata (NOT in LightRAG)
  |
  +-- private disk: original file + image files (paths NEVER in API/DB columns)
```

P5 adds `source_documents.index_*` fields only — no new block table.

---

## Table Schemas (Proposed DATA-001 Patch)

### `source_documents`

```text
id, domain_id, original_filename, content_type
original_sha256, original_size_bytes
state: pending | prepared | deleting
parser_kind: docling | reducto          <-- frozen at upload, NOT current settings
preparation_generation                 <-- retry/cancel/delete fence
created_by_user_id, created_at, updated_at

UNIQUE(domain_id, original_sha256)
```

### `source_preparation_operations`

```text
id, source_document_id, domain_id
operation_type: prepare
status: queued | running | succeeded | failed | cancelled
preparation_generation_at_start
error_code, error_message              <-- safe codes only
lease_owner, lease_expires_at
started_at, finished_at, created_at, updated_at

UNIQUE one active (queued|running) per source_document_id
```

### `source_blocks` — **canonical document object**

```text
id (PK)                 stable CE UUID — NOT parser block id
source_document_id, domain_id
source_order            1,2,3... unique per source — stable citation order
kind                    text | table | figure
canonical_markdown      normalized block text (restricted data)
heading_level           nullable int (1 = H1)
page_start, page_end    nullable page range
section_path            ordered safe heading labels (json/array)
created_at
```

### `source_images`

```text
id, source_document_id, source_block_id   (figure block only)
content_hash, mime_type, alt_text?, page_number?, created_at
+ private image bytes on disk
```

**Naming rule:** say **Source Block**, never `chunk` in contracts/API.

---

## Parser-Native Shapes (Ephemeral — Discard After Normalize)

Both parsers are **private worker inputs**. QA-002 forbids persisting or exposing native payloads.

### Reducto `parse` response

Source: [Reducto Parse Response Format](https://docs.reducto.ai/parse/response-format)

```text
ParseResponse
  job_id, duration, usage, pdf_url, studio_link   <-- DISCARD (never persist/expose)
  result
    type: "full" | "url"
    chunks[]  OR fetch url -> chunks[]
      content     markdown chunk (display-oriented)
      embed       embedding-optimized variant (may summarize tables/figures)
      blocks[]
        type      Title | Section Header | Text | Table | Figure | ...
        content   markdown/html table text, caption, etc.
        bbox      normalized 0-1 coords + page   <-- DISCARD for CE product
        confidence, granular_confidence           <-- DISCARD
        image_url                                 <-- fetch bytes privately if needed; DISCARD url
```

Reducto mental model:

```text
         ParseResponse
              |
              +-- chunks[]  (RAG-oriented grouping — CE does NOT copy chunk boundaries)
              |      |
              |      +-- blocks[]  (atomic layout elements — primary walk order)
              |
              +-- job_id, bbox, confidence, urls  (throw away)
```

**CE adapter job:** walk `blocks[]` in document order (flatten across chunks if needed), map block `type` → `kind`, normalize `content` → `canonical_markdown`, derive `section_path` from headers, copy safe page from `bbox.page` only during mapping.

Do **not** use Reducto `embed` string as product truth — CE owns canonical markdown on Source Blocks. Do **not** use Reducto chunk ids as Source Block ids.

### Docling `DoclingDocument`

Source: [Docling DoclingDocument concept](https://docling-project.github.io/docling/concepts/docling_document/)

```text
DoclingDocument (Pydantic / export_to_dict)
  name, origin
  texts[]           TitleItem | SectionHeaderItem | TextItem | ListItem | ...
  tables[]          TableItem (+ structure annotations)
  pictures[]        PictureItem
  key_value_items[]
  groups[]          list/chapter containers
  body              tree of NodeItem refs (reading order)
  furniture         headers/footers tree
  pages{}           page layout metadata

Each DocItem:
  self_ref JSON pointer (#/texts/5)
  parent/children refs
  prov, bbox, label, text content   <-- keep page/heading during map; DISCARD refs/bbox/ids
```

Docling mental model:

```text
    DoclingDocument
         |
         +-- content lists (texts, tables, pictures, ...)
         |
         +-- body tree (reading order via JSON pointer refs)
                |
                walk body children in order -> emit PreparedBlocks
```

**CE adapter job:** traverse `body` reading order (not raw list index), emit flat `PreparedBlock` sequence. Map section headers → `heading_level` + `section_path`. Tables → `kind=table`. Pictures → `kind=figure` + `PreparedImage` bytes/hash.

Do **not** persist the document tree, JSON pointers, or `export_to_dict()` blob.

---

## Side-By-Side: Native → CE

| Concern | Reducto native | Docling native | CE retains (on Source Block) |
| --- | --- | --- | --- |
| Identity | block index in chunk | `#/texts/N` pointer | new CE UUID in `source_blocks.id` |
| Order | chunk.blocks order | `body` tree walk | `source_order` 1..N |
| Text | `Text`, `Title`, headers | `TextItem`, headers | `kind=text`, `canonical_markdown` |
| Tables | `Table.content` md/html | `TableItem` | `kind=table`, markdown table text |
| Figures | `Figure` + optional `image_url` | `PictureItem` | `kind=figure` + `source_images` row |
| Page | `bbox.page` | provenance/page on item | `page_start`/`page_end` (nullable) |
| Section | inferred from header blocks | `SectionHeaderItem` + tree | `heading_level`, `section_path[]` |
| Job/task/url/bbox/confidence | yes | yes | **never** |

Both adapters must produce the **same PreparedSource semantics** (AC-003).

---

## PreparedSource — Internal Bridge (Worker-Only)

Not an API DTO. Not persisted. Exists only between parse and validate/publish.

```text
PreparedSource
  sourceDocumentId
  parserKind              docling | reducto
  blocks[]                PreparedBlock
  images[]                PreparedImage
  warnings[]              safe codes/messages only

PreparedBlock
  sourceOrder             int, unique ascending
  kind                    text | table | figure
  canonicalMarkdown       str (required for text/table; figure caption/alt text)
  headingLevel?           int
  pageStart?, pageEnd?
  sectionPath[]           safe heading labels

PreparedImage
  temp image_ref OR sourceOrder link to figure block
  contentHash, mimeType, bytes/private temp handle
  altText?, pageNumber?
```

Validator rejects: empty blocks, duplicate order, bad kind, empty text/table markdown, bad page range, leaked parser-native fields.

Publish: INSERT all `source_blocks` + `source_images` in **one transaction** or rollback (source stays `pending`).

```text
PreparedSource                source_blocks row
-------------                 -----------------
blocks[0].sourceOrder=1   ->  source_order=1, id=<new uuid>
blocks[0].kind=text       ->  kind=text
blocks[0].canonicalMarkdown -> canonical_markdown
blocks[0].sectionPath     ->  section_path
images[0] for figure      ->  source_images + private file
```

---

## Example: Same Semantic Document, Three Layers

Synthetic safety-manual excerpt — **not real customer text**.

### After parser (conceptual)

```text
Reducto blocks[] walk:
  [Title] "Safety Manual"
  [Section Header] "Introduction"
  [Text] "This manual describes..."
  [Table] "| Hazard | Mitigation |..."
  [Figure] "Figure 3: Assembly" + image bytes

Docling body walk:
  texts[0] title, texts[1] section header, texts[2] para,
  tables[0], pictures[0]
```

### After P4 publish (`source_blocks`)

```text
id        order  kind    page   section_path                    canonical_markdown (truncated)
--------  -----  ------  ----   ------------------------------  ---------------------------
blk_001   1      text    1      ["Safety Manual"]               "# Safety Manual\n..."
blk_002   2      text    1-2    ["Safety Manual","Introduction"] "## Introduction\n..."
blk_003   3      table   5      ["Appendix A"]                  "| Hazard | Mitigation |\n..."
blk_004   4      figure  7      ["Diagrams"]                    "Figure 3: Assembly"
```

`source_images`: one row pointing at `blk_004` + PNG bytes on private disk.

### After P5 `render_lightrag_input()` (deterministic text, NOT stored)

```text
[CE_SOURCE id=src_d4e5f6 schema=1 sha256=<original_sha256>]

[CE_BLOCK id=blk_001 order=1 page=1 section="Safety Manual"]
# Safety Manual
...

[CE_BLOCK id=blk_002 order=2 page=1 section="Safety Manual > Introduction"]
## Introduction
...

[CE_BLOCK id=blk_003 order=3 page=5 section="Appendix A"]
| Hazard | Mitigation |
...

[CE_BLOCK id=blk_004 order=4 page=7 section="Diagrams"]
Figure 3: Assembly
```

Same prepared source → same rendered string → same hash (F-005 FR-002).

---

## What LightRAG Actually Embeds

Context Engine submits **one rendered text document per Source Document** to private LightRAG (`ainsert`).

```text
render_lightrag_input(source)
        |
        |  single str (marker lines + canonical_markdown per block)
        v
LightRAG ainsert(input=text, ids=<stable doc id>, split_by_character=...)
        |
        +-- stores full doc text (content)
        +-- splits into internal text chunks (token/char rules)
        +-- embedding model -> vector per internal chunk
        +-- entity/relation graph extraction on chunk text
        |
        v
Retrieval returns text hits (may be sub-span of a block)
        BUT hit text must still contain intact [CE_BLOCK id=...] marker (P5 proof)
```

| Content | In LightRAG index? | Where CE keeps authoritative copy |
| --- | --- | --- |
| Text block markdown | yes (via rendered text) | `source_blocks.canonical_markdown` |
| Table markdown | yes | `source_blocks.canonical_markdown` |
| Figure caption/alt text | yes (text only) | `source_blocks` + optional `source_images.alt_text` |
| PNG/JPEG bytes | **no** | private disk + `source_images` |
| Original PDF | **no** | private disk |
| Reducto `embed` summaries | **no** (unless CE copies into canonical_markdown deliberately — don't) | n/a |
| Docling JSON tree | **no** | n/a |
| `CE_BLOCK` marker strings | yes (in submitted text) | **not** stored in P4; rendered at index time in P5 |

LightRAG internal chunk boundaries ≠ Source Block boundaries. That is OK. **Evidence mapping uses `CE_BLOCK id`, not LightRAG chunk id** (DEC-003, constitution).

P6 flow:

```text
LightRAG raw hit text
  -> parse [CE_BLOCK id=blk_003 ...]
  -> load source_blocks.id = blk_003
  -> source_is_query_eligible(...)
  -> safe excerpt from canonical_markdown
```

---

## Adapter Implementation Cheatsheet

```text
UPLOAD
  parser_kind = runtime_settings.active_parser_kind   # freeze now
  retry uses source.parser_kind                       # NOT current settings

WORKER
  claim op -> read original bytes privately
  if parser_kind == docling:  DoclingDocument -> PreparedSource
  if parser_kind == reducto:  ParseResponse -> PreparedSource (+ private cred)
  validate(PreparedSource)
  if preparation_generation stale: publish zero rows
  else: txn insert source_blocks + source_images; state=prepared

ERROR MAP (operation DTO only)
  parser_not_ready | parser_auth_failed | parser_unavailable
  parser_malformed_response | source_preparation_invalid
  (never raw provider text)
```

---

## What To Read First

| Path | Why |
| --- | --- |
| `specs/04-features/F-004-source-documents-preparation/spec.md` | P4 scope, AC-003 |
| `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md` | render + index eligibility |
| `specs/03-contracts/data/context-engine-data.md` | DATA-001 tables/states |
| `.devnotes/P3-post-impl-REVIEW/ID-A-canonical-source-blocks.md` | PreparedSource validator |
| `.devnotes/P3-post-impl-REVIEW/ID-A-parser-adapters.md` | adapter safety rules |
| `obsidian/P5 LightRAG Text Indexing.md` | CE_BLOCK handoff |
| Reducto docs | https://docs.reducto.ai/parse/response-format |
| Docling docs | https://docling-project.github.io/docling/concepts/docling_document/ |

---

## Junior Dev / Agent Checklist

1. **Normalize, don't persist:** Docling/Reducto JSON dies in the adapter; only Source Blocks survive.
2. **Flat beats tree:** no persisted `body`/`chunks` product model — walk parser structure once, emit ordered blocks.
3. **CE owns ids:** Source Block UUIDs are generated at publish; never copy Reducto/Docling ids.
4. **Frozen parser:** `source_documents.parser_kind` set at upload; retry ignores later admin parser changes.
5. **P4 ≠ LightRAG:** no `ainsert`, no embeddings, no `CE_BLOCK` columns in DB.
6. **P5 renders markers:** `render_lightrag_input()` reads `source_blocks` rows; deterministic hash required.
7. **Embed text, not bytes:** figures index caption text; image files stay private for later asset delivery (P6).
8. **Evidence = exact block id:** retrieval must preserve `[CE_BLOCK id=...]` through LightRAG — prove in P5 fixture before P6.

---

**Status:** F-004 / F-005 approved, not fully implemented (2026-07-02). Column detail is proposed DATA-001 patch — verify against live contract before coding.
