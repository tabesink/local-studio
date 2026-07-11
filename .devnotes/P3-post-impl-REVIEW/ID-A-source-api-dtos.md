# ID-A - Source API DTOs (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

**Question:** What public API shapes must be captured before implementing P4 routes?

### Decision

Patch API-001 before route code. The endpoint catalog exists, but request bodies, response DTOs, error codes, and safe field allowlists are missing.

All P4 routes are Administrator-only:

```text
POST   /admin/domains/{domain_id}/sources
GET    /admin/domains/{domain_id}/sources
GET    /admin/domains/{domain_id}/sources/{source_id}
GET    /admin/domains/{domain_id}/sources/{source_id}/outline
GET    /admin/domains/{domain_id}/sources/{source_id}/operations
POST   /admin/domains/{domain_id}/sources/{source_id}/retry
POST   /admin/domains/{domain_id}/sources/{source_id}/cancel
DELETE /admin/domains/{domain_id}/sources/{source_id}
```

### Why

| Bad | Good |
| --- | --- |
| infer DTOs from old `/documents` routes | capture P4 source DTOs in API-001 |
| return parser/source content in list rows | safe lifecycle metadata only |
| expose file paths or parser provider details | opaque ids and safe labels |
| use snake_case if P1-P3 use camelCase | keep API style consistent |

### DTO Sketch

`SourceDocumentSummary` should be narrow:

| Field | Rule |
| --- | --- |
| `id` | source id |
| `domainId` | Knowledge Domain id |
| `originalFilename` | safe label |
| `contentType` | safe metadata |
| `state` | `pending`, `prepared`, `deleting` |
| `parserKind` | frozen parser kind |
| `blockCount`, `imageCount` | counts, not raw content |
| `createdAt`, `updatedAt` | timestamps |

`SourcePreparationOperation` should mirror safe operation style:

| Field | Rule |
| --- | --- |
| `id` | operation id |
| `operationType` | closed enum |
| `status` | closed enum |
| `message` | safe operator message |
| `errorCode`, `errorMessage` | safe terminal failure |
| `startedAt`, `finishedAt`, `createdAt` | timestamps |

`SourceOutline` may expose structural labels and block references, but not full source content unless API-001 explicitly approves it.

### Error Codes To Capture

| Situation | Suggested code |
| --- | --- |
| unknown domain | reuse `domain_not_found` |
| domain deleting or unavailable for upload | `domain_state_conflict` |
| duplicate file hash in domain | `source_duplicate` |
| source not found | `source_not_found` |
| active preparation operation | `source_operation_in_progress` |
| parser not configured | `parser_not_ready` |
| unsupported file | `source_file_unsupported` |
| file too large | `source_file_too_large` |
| wrong source state | `source_state_conflict` |

Names are recommendations until API-001 is patched.

### Implement Order

```text
1. Patch API-001 DTOs and examples with safe fields only.
2. Add Pydantic request/response models.
3. Add OpenAPI snapshot test.
4. Implement routes after service tests exist.
```

### Red Flags In PR

- Response includes source original bytes, full Source Block text, storage path, parser URL, parser task id, provider payload, or runtime details.
- Upload route accepts arbitrary JSON instead of documented multipart.
- Member can call P4 source APIs.
- Error responses use raw exception text.
- `GET /outline` becomes a download/source viewer.

### Tests

- OpenAPI snapshot includes P4 DTOs.
- Member receives 403 on every `/admin/domains/{domain_id}/sources*` route.
- Safe DTO scan excludes forbidden private/parser/runtime fields.
- Validation errors use canonical envelope.

### One-line Summary

P4 route implementation is blocked until API-001 defines exact safe source DTOs and errors.
