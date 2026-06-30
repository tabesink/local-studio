# Canonical Data Model + Ownership

| Entity | Canonical backend truth | UI representation | Important states / fields |
|---|---|---|---|
| Session/user | auth service | current user snapshot | `id`, `username`, `role`, active status; exact fields verify |
| User admin record | users API | user row/form | `id`, `username`, `role`, `is_active`, `created_at` |
| Provider profile | AI settings API | profile list/editor | kind/provider/model/base URL/enabled/default/secret status; no secret value |
| Parser profile | parser settings API | parser list/editor | provider/display/base URL/secret status/enabled/active/config |
| Document | documents API | library row/detail | id, filename, content type, status, timestamps, metadata, safe error message |
| Operation | operations API | status row/detail | id, type, status, stage/message, timestamps; exact shape verify |
| Domain | LightRAG/backend API | domain card/selector | lifecycle/provider linkage; field shape verify |
| Evidence | chat/retrieval API | source/evidence card | source/document/chunk/reference fields; shape verify |
| Chat turn | chat stream contract | conversation message | client turn id, question, source event, terminal event |

## Confirmed state machines

```text
Document:
uploaded → indexing → ready
uploaded → indexing → failed
failed → indexing → ready | failed
any → deleted

Operation:
queued → running → succeeded
queued → running → failed
queued/running → canceled
failed → running   # manual retry
failed → queued    # retryable path documented
```

## Owner rules

- Backend owns lifecycle truth. UI derives labels/progress from API.
- Frontend owns local dialog state, draft form state, selected rows, partial stream text.
- Provider/parser secret values never cross API boundary.
- Do not expose DB model wholesale. Make response DTOs.
- Do not let document status double as operation status.
- IDs/timestamps remain opaque strings until contract proves format/timezone.
