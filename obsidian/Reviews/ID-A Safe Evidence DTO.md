---
type: id-a
phase: P6
feature: F-006
status: active
layer:
  - api
contract: API-001
spec: specs/04-features/F-006-scoped-evidence-retrieval/spec.md
audience: junior-dev
lifecycle: review
tags:
  - phase/p6
  - feature/f-006
  - type/id-a
  - review/id-a
  - contract/api
  - layer/api
  - status/active
---

# ID-A — Safe Evidence DTO

Parent: [[P6 Index]]

**Question (A2):** What are the exact Evidence DTO field names, excerpt bounds, and source label shape?

### Decision

Use a **three-field safe card** on the public wire. Cap excerpt length per card. Never expose private ids, raw hits, scores, paths, or runtime URLs.

```json
{
  "kind": "evidence",
  "evidence": [
    {
      "evidenceId": "ev-01",
      "excerpt": "Inspection required after every 50,000 cycles.",
      "sourceLabel": "Fatigue Manual — Inspection — p.12"
    }
  ]
}
```

**Proposed limits** (patch API-001 before route code):

| Constant | Value | Meaning |
| --- | --- | --- |
| `RAW_HIT_LIMIT` | 12 | Max raw LightRAG hits considered before mapping |
| `EVIDENCE_LIMIT` | 8 | Max safe cards returned |
| `EVIDENCE_EXCERPT_MAX_CHARS` | 1200 | Max chars per `excerpt` |
| `SOURCE_LABEL_MAX_CHARS` | 120 | Max chars per `sourceLabel` (truncate with …) |

`evidenceId` is an **opaque turn-local citation handle** for P7 (`done` cites `ev-01`). It is **not** a Source Block UUID.

### Why

| Bad | Good |
| --- | --- |
| Return `sourceBlockId` because UI might navigate later | Return only safe preview fields until source-ref contract exists |
| Return raw LightRAG hit text | Map hit → CE_BLOCK → Source Block → bounded excerpt |
| Return full canonical markdown | Truncate excerpt on API/SSE; full block stays server-side |
| Use filesystem path in label | Build `sourceLabel` from filename + section + page only |

Raw LightRAG output is **not** evidence. Unmapped hits are discarded.

### Three sizes (don't mix them up)

```text
┌─────────────────────────────────────────────────────────────────┐
│ 1. Source Block in Postgres     │ FULL canonical_markdown       │
│    (server only)                │ may be 5k–20k+ chars          │
├─────────────────────────────────┼───────────────────────────────┤
│ 2. Public excerpt (API/SSE)     │ max 1200 chars PER card       │
│    EVT-001 + FR-003             │ max 8 cards (~9600 chars max) │
├─────────────────────────────────┼───────────────────────────────┤
│ 3. P9 list row (slice 12)       │ ~2 lines visible (line-clamp) │
│    SessionContextNavigation     │ often ~150–300 chars shown    │
└─────────────────────────────────┴───────────────────────────────┘
```

**1200 is not "all retrieved evidence."** It is a **per-card wire preview**. You still get up to **8 cards**.

P7 synthesis on the server may read **full block text from Postgres** after internal mapping. The truncated DTO is for **browser and SSE**, not the ceiling on server-side grounding.

### Field rules

**`evidenceId`**

- Opaque string, unique within one response/turn
- Used by P7 citations in the same turn
- Never a Source Block id, Source Document id, or LightRAG id

**`excerpt`**

- Truncated **canonical Source Block markdown** after successful CE_BLOCK mapping
- Not raw retrieval hit text
- Truncate at `EVIDENCE_EXCERPT_MAX_CHARS` (prefer word/paragraph boundary when easy)
- Open question: smart truncation for markdown tables mid-row

**`sourceLabel`**

Build from safe metadata only:

```text
sourceLabel = originalFilename + optional section + optional page

Examples:
  "Fatigue Manual.pdf — Inspection — p.12"
  "SOP-404.pdf — Section 3.2 — pp.12–14"
  "report.pdf"
```

Allowed inputs: `originalFilename`, section/heading text, `page_start` / `page_end`.

Forbidden: UUIDs, storage paths, parser ids, runtime URLs, raw scores.

### Must NEVER appear in public DTO

```text
sourceBlockId, sourceDocumentId
raw LightRAG id / remote document id
raw score, rank, distance
raw hit text (pre-map blob)
storage paths, runtime URLs
full canonical markdown (untruncated)
parser metadata, bbox, task ids
```

Old CE exposed many of these in `retrieve-response-adapter.ts`. Greenfield rejects that pattern.

### Response variants (same array shape)

| Status | `kind` | `evidence` |
| --- | --- | --- |
| 200 mapped hits | `evidence` | 1–8 items |
| 200 all hits discarded | `no_grounded_context` | `[]` |
| 409 no eligible source | — | no DTO; contracted error envelope |

Do not collapse `409 no eligible source` and `no_grounded_context` into one generic error.

### P9 slice 12 rendering

Port compact rows from old CE `SessionContextNavigation`:

```text
┌──────────────────────────────────────────────┐
│ [icon]  sourceLabel (truncate, xs)           │
│         excerpt (line-clamp-2, muted)        │
└──────────────────────────────────────────────┘
         click → detail pane shows more excerpt
                   still NO private ids
```

1200 supports scrollable detail; the list only needs a preview.

### Implementation order

```text
1. Patch API-001 with EvidenceItem fields + limits + response kind enum.
2. Mapper: truncate excerpt; cap at EVIDENCE_LIMIT after mapping.
3. sourceLabel builder: filename + section + page, max SOURCE_LABEL_MAX_CHARS.
4. evidenceId: new opaque id per item per response.
5. OpenAPI snapshot: assert NO forbidden fields.
6. P7 server synthesis: full block from DB internally; public SSE still uses excerpt.
```

### Red flags in PR

- DTO includes ids "for future navigation"
- Raw score or raw hit in snapshot
- `sourceLabel` contains path or UUID
- Full block markdown returned because 1200 "felt too small"
- Copied old CE `EvidenceResponse` / `retrieve.ts` shape

### Tests

- DTO snapshot excludes forbidden fields
- Excerpt length ≤ 1200 per item
- At most 8 evidence items
- `sourceLabel` built without paths or private ids
- `no_grounded_context` returns empty array with correct `kind`

### One-line summary

Public Evidence = up to 8 cards × (`evidenceId`, `excerpt` ≤1200, `sourceLabel`); full blocks and all private ids stay server-side.

## Related

- [[ID-A Evidence API Contract]]
- [[P6 Evidence And Asset Delivery]]
- [[P6 Index]]
- [[ID-A Query Eligibility]]
- [[P5 LightRAG Text Indexing]]

## Repo sources

- `.devnotes/P5-post-impl-REVIEW/F-006-P6-readiness.md` (A2)
- `.devnotes/P5-post-impl-REVIEW/ID-A-evidence-api-contract.md`
- `.references/context_engine_fullstack_impl_docs/phase_plan/P6_scoped_evidence_retrieval.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/03-contracts/api/context-engine-v1.md`
