---
type: index
phase: P5
feature: F-005
status: active
audience: reviewer
lifecycle: review
spec: specs/04-features/F-005-lightrag-indexing-eligibility/spec.md
tags:
  - phase/p5
  - feature/f-005
  - type/index
  - review/id-a
  - status/active
---

# P4 Review Index

Hub for P4 post-impl review and **P5 blocker package**. Start at [[ID-A LightRAG Indexing Contract]].

Source: `.devnotes/P4-post-impl-REVIEW/`

## Readiness

- [[F-005 P5 Readiness]] — goal, lifecycle, dependency gates, ACs, build order

## ID-A slices

- [[ID-A LightRAG Proof Fixture]] — T-001 pinned runtime proof and stop condition
- [[ID-A Source Index Fields]] — DATA-001/API-001 P5 index field and DTO patch
- [[ID-A Render LightRAG Input]] — deterministic `CE_SOURCE`/`CE_BLOCK` render from Source Blocks
- [[ID-A Index Worker And Delete Fences]] — submit/readiness/retry/cancel/delete state machine
- [[ID-A Query Eligibility]] — one `source_is_query_eligible()` helper
- [[ID-A Live Parser SDK Followup]] — live Docling/Reducto SDK gap; pilot-prep follow-up, not P4 drift

## Related

- [[P4 Index]]
- [[P5 Index]]
- [[P3 Review Index]]
- [[Reviews Index]]

## Repo sources

- `.devnotes/P4-post-impl-REVIEW/ID-A.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`
