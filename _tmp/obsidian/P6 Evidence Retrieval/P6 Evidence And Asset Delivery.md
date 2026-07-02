---
type: architecture
phase: P6
feature: F-006
status: active
layer: api
spec: specs/04-features/F-006-scoped-evidence-retrieval/spec.md
audience: junior-dev
lifecycle: building
tags:
  - phase/p6
  - feature/f-006
  - type/architecture
  - layer/api
  - architecture
  - status/active
---

# P6 Evidence And Asset Delivery

How retrieval uses LightRAG text hits today, and why figure/table **display** is blocked until a source-ref contract exists.

Indexing: [[P5 LightRAG Text Indexing]]. Image bytes: [[P4 Image Storage Architecture]]. Storage: [[P4 Private Storage Rules]].

**Phase:** P6 evidence-only retrieval. No synthesis, no chat, no source viewer in P6 scope.

---

## P6 Retrieval Flow

```text
POST /domains/{domain_id}/evidence
  { "question": "..." }

-> auth + domain available
-> at least one query-eligible source (P5)
-> private LightRAG.retrieve()     [text hits only]
-> parse exact CE_BLOCK marker per hit
-> load Source Block from Postgres
-> verify source_is_query_eligible()
-> build safe evidence card:
     excerpt     = truncated canonical_markdown
     sourceLabel = safe label (no private IDs)
```

Raw LightRAG hit is **not** evidence. Unmapped hits are discarded.

---

## What P6 Returns (Safe DTO)

Example shape from phase plan:

```json
{
  "kind": "evidence",
  "evidence": [{
    "evidenceId": "e1",
    "excerpt": "Inspection required after every 50,000 cycles.",
    "sourceLabel": "Fatigue Manual - Inspection - Page 12"
  }]
}
```

**Never return:** source ID, block ID, asset ID, path, raw score, raw hit, runtime URL, LightRAG ID.

---

## Tables vs Figures After Retrieval

| Block kind | What user sees in P6 excerpt | Separate asset fetch |
| --- | --- | --- |
| `text` | markdown text snippet | none |
| `table` | markdown table text in excerpt | none (table **is** text) |
| `figure` | alt/caption text from markdown | **pixel display not in P6** |

A figure hit may retrieve searchable **text** (caption), but showing the actual image requires a backend-mediated download — not implemented in P6.

---

## Why Client Path Pull Is Wrong

```text
BAD:  hit -> API returns filesystem path -> browser reads data folder
GOOD: hit -> excerpt in evidence DTO -> (later) opaque ref -> GET /.../assets/{ref} -> CE streams bytes
```

Blocked by:

- Constitution: browser never accesses storage paths
- F-006 FR-003: no paths in evidence response
- F-004 out of scope: image download in P4
- AGENTS.md stop: source navigation before **opaque source-ref contract**
- Frontend slice 16: no direct storage URLs; authorized safe URL/ID contract TBD

---

## Future: Opaque Source Ref (Not Yet Specified)

When product needs source panel / figure rendering (slice 16, P9):

```text
Backend issues opaque asset ref (not path, not block UUID in browser)
Client: GET authorized asset endpoint with session cookie
Backend: resolve ref, authz, stream bytes from private storage
```

Contract must be patched in API-001 before implementation. Until then, treat figure display as an **open decision**.

---

## Related

- [[P5 LightRAG Text Indexing]]
- [[P4 Image Storage Architecture]]
- [[P4 Private Storage Rules]]
- [[Source Blocks Table]]
- [[Source Images Table]]
- [[F-004 P4 Readiness]]
- [[Context Engine Index]]
