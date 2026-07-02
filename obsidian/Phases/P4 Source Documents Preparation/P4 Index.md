---
type: index
phase: P4
feature: F-004
status: active
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience:
  - agent
  - junior-dev
tags:
  - phase/p4
  - feature/f-004
  - type/index
  - status/active
---

# P4 Index

**F-004 — Source Documents And Canonical Preparation** — upload, preparation, canonical Source Blocks.

## Readiness and schema

- [[F-004 P4 Readiness]] — goal, lifecycle, blockers, ACs, build order
- [[F-004 P4 Table Schema]] — overview, relationships, lifecycle cheat sheet

## Upload and storage

- [[P4 Source Upload Flow]] — POST upload, duplicate hash, prep op enqueue
- [[P4 Upload Cancel And Cleanup]] — no cancel-upload API; abort vs prep cancel
- [[P4 Private Storage Rules]] — originals and images on private disk
- [[P4 Image Storage Architecture]] — blocks vs image bytes

## Data shapes

- [[P4 Parser To LightRAG Data Shape]] — parser output → PreparedSource → CE_BLOCK

## Table leaf notes

- [[Source Documents Table]] — `source_documents`
- [[Source Preparation Operations Table]] — `source_preparation_operations`
- [[Source Blocks Table]] — `source_blocks`
- [[Source Images Table]] — `source_images`

## Implementation

- (stub) [[P4 Implementation Summary]] — from `.devnotes/P4-source-documents-preparation-impl-SUMMARY.md`

## Reviews

- [[P3 Review Index]] — P4 design blockers (pre-impl)
- [[P4 Review Index]] — P4 post-impl review and P5 handoff blockers
- [[ID-A Live Parser SDK Followup]] — pilot-prep parser SDK gap (not P4 closure)

## Repo sources

- `specs/04-features/F-004-source-documents-preparation/spec.md`
- `specs/03-contracts/data/context-engine-data.md`
- `.devnotes/P4-source-documents-preparation-impl-SUMMARY.md`

## Related

- [[Build Order Index]]
- [[Architecture Index]]
- [[P5 Index]]
