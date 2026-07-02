---
type: flow
phase: P4
feature: F-004
status: active
layer:
  - api
  - worker
spec: specs/04-features/F-004-source-documents-preparation/spec.md
audience: junior-dev
lifecycle: done
tags:
  - phase/p4
  - feature/f-004
  - type/flow
  - layer/api
  - layer/worker
  - status/active
---

# P4 Source Upload Flow

How an administrator upload becomes a pending Source Document plus a queued preparation operation.

Parent: [[F-004 P4 Readiness]]. Storage rules: [[P4 Private Storage Rules]]. Tables: [[Source Documents Table]], [[Source Preparation Operations Table]].

**Phase:** P4 only. No LightRAG call on upload.

---

## Endpoint

```text
POST /admin/domains/{domain_id}/sources
```

Administrator-only. Domain must exist and not be `deleting`.

---

## Steps

```text
1. Authz: Administrator
2. Validate domain exists, state != deleting
3. Read multipart upload body (contract TBD in API-001)
4. Freeze runtime_settings.active_parser_kind -> source.parser_kind
5. Stream original to private storage (see [[P4 Private Storage Rules]])
6. Compute original_sha256 + original_size_bytes
7. Reject duplicate (domain_id, original_sha256) -> safe 409
8. INSERT source_documents: state=pending
9. INSERT source_preparation_operations: type=prepare, status=queued
10. Return safe Source Document + operation DTO (no paths)
```

Open contract gaps: multipart field names, max size, content types, source id format, duplicate error code.

---

## What Upload Creates

| Artifact | Where |
| --- | --- |
| Original file bytes | Private disk |
| File metadata + state | [[Source Documents Table]] row |
| Prep job | [[Source Preparation Operations Table]] row |

Worker picks up step 10+ in [[F-004 P4 Table Schema#Lifecycle Cheat Sheet]].

---

## Duplicate Guard

Same file hash in the **same** Knowledge Domain is rejected (AC-002).

```text
UNIQUE (domain_id, original_sha256)
```

Same hash in a **different** domain is allowed unless API-001 says otherwise.

On duplicate after file write: delete written file, return safe error.

---

## Failure Rollback

If DB insert fails after file write, delete the written original. See [[P4 Private Storage Rules]].

---

## Out Of Scope In P4

- Member upload routes
- Browser direct-to-storage upload
- Original download URL
- LightRAG indexing (P5)

---

## Related

- [[P4 Private Storage Rules]]
- [[P4 Image Storage Architecture]]
- [[Source Documents Table]]
- [[Source Preparation Operations Table]]
- [[F-004 P4 Readiness]]
- [[F-004 P4 Table Schema]]
- [[Context Engine Index]]
