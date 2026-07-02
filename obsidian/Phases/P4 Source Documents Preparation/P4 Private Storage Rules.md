---
type: architecture
phase: P4
feature: F-004
status: active
layer: storage
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience:
  - agent
  - junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/architecture
  - layer/storage
  - architecture
  - status/active
---

# P4 Private Storage Rules

Where Context Engine stores upload originals and extracted image bytes, and what never reaches the browser.

Upload flow: [[P4 Source Upload Flow]]. Image rows: [[Source Images Table]].

**Trust rule:** Constitution + QA-002 — no storage paths, download URLs, or direct browser access to the data folder in P4.

---

## Three Storage Buckets (Conceptual)

```text
Postgres                         Private disk (CE server)
-----------                      ------------------------
source_documents                 original upload file
  original_sha256 (not path)       per domain/source layout (TBD)
  original_size_bytes

source_images                    extracted image binaries
  content_hash (not path)          keyed by hash or internal key
  mime_type, alt_text, page
  source_block_id FK

source_blocks                    (no block file blobs in P4)
  canonical_markdown
```

Server may keep an **internal storage key** for each file. That key stays server-only and must not appear in API DTOs, logs, or traces.

---

## Original Upload Rules

From `.devnotes/P3-post-impl-REVIEW/ID-A-delete-storage.md`:

```text
1. Validate domain/request before write when possible
2. Stream original to private temp/final storage
3. Compute sha256 and size
4. Insert source_documents with hash/size metadata
5. On DB failure -> delete written file
6. On duplicate hash -> delete file, safe 409
```

[[Source Documents Table]] stores hash and size — **not** a public path column.

---

## Image File Rules

During preparation (worker):

```text
parser extracts figure/table assets
  -> write bytes to private storage
  -> INSERT source_images row (hash, mime, FK to block)
  -> all-or-none with source_blocks in one transaction
```

See [[P4 Image Storage Architecture]] for figure vs table behavior.

P4 API: **no** image download route. P6 evidence: **no** paths or asset URLs yet.

---

## Delete Cleanup

**Source delete:**

```text
source.state -> deleting
cancel active prep op if possible
delete source_images rows + private image files
delete source_blocks rows
delete source_preparation_operations rows
delete original file
hard-delete source_documents row
```

**Domain delete:** purge all sources (rows + files) before domain row removal. P5 adds remote LightRAG delete before local removal when indexed.

---

## Red Flags

- API returns `storage_path`, `downloadUrl`, or filesystem path
- Browser uploads directly to disk without API
- Duplicate check uses filename only
- Domain delete drops domain row before source file cleanup

---

## Related

- [[P4 Source Upload Flow]]
- [[P4 Image Storage Architecture]]
- [[Source Documents Table]]
- [[Source Images Table]]
- [[P6 Evidence And Asset Delivery]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
