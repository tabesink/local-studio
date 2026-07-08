# ID-A - documents preview and source refs (junior dev explainer)

Parent: [ID-A.md](./ID-A.md)

Related docs: `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`, `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md`, `specs/03-contracts/api/context-engine-v1.md`, `specs/03-contracts/data/context-engine-data.md`.

**Question:** Can P9 fully wire document PDF preview and evidence-to-source navigation from existing source IDs?

## Decision

No. P9 may port the `/documents` table and inline preview shell, but the PDF blob fetch is blocked until a safe preview contract exists. Evidence-to-source navigation is blocked until an opaque source-ref contract exists.

Use P4/P5 safe source DTOs for the table, upload, prep/index status, retry/cancel, and source delete. Do not expose private Source Block ids or raw source access.

## Why

| Bad path | Good path |
| --- | --- |
| Copy old `GET /documents/{id}/preview` path. | Wait for API-001 safe preview blob route. |
| Put Source Document id or Source Block id into public citation URLs. | Wait for opaque source-ref contract. |
| Fetch original file or private storage target from browser. | Browser consumes only Context Engine API. |
| Treat preview as a nested document route. | Keep single `/documents` route with inline preview panel. |

## What Can Ship First

```text
/documents
  RoutePageShell
    DocumentLibraryTable
    DocumentLibraryToolbar
    after: DocumentPreviewPanel shell
  DocumentUploadDialog
```

Safe table fields from API-001:

```text
id
domainId
originalFilename
contentType
originalSizeBytes
originalSha256
state
parserKind
blockCount
imageCount
indexState
indexErrorCode
indexErrorMessage
indexAcceptedAt
indexReadyAt
indexUpdatedAt
createdAt
updatedAt
```

Do not render private fields that API-001 excludes.

## Blocked Wiring

| Feature | Status | Owner patch |
| --- | --- | --- |
| PDF blob fetch | Blocked | API-001 preview route, authz, response type, errors, caps |
| Highlight adapter | Blocked | preview/source-ref contract |
| Evidence click to source | Blocked | opaque source-ref contract |
| Source detail raw text | Forbidden unless later contract approves safe excerpt/detail |
| Browser storage of preview blobs | Avoid; object URL lifecycle only after route exists |

## Implement Order

1. Port table + toolbar + upload dialog structure.
2. Restyle with Local Studio table/panel/modal tokens.
3. Wire P4 source list/upload/operations and P5 index retry/cancel.
4. Add preview panel shell with unavailable state.
5. Add preview blob fetch only after API-001 captures it.
6. Keep evidence-to-source links disabled until opaque source-ref exists.
7. Add tests for no raw storage path/runtime/provider/source content in client payloads.

## Red Flags In PR

- `/documents/[id]` route appears for preview.
- Client calls old reference preview endpoint without contract patch.
- Client fetches file paths, storage targets, runtime URLs, or controller routes.
- Evidence links use `source_document_id`, `source_block_id`, or private evidence ids.
- PDF object URL is not revoked.
- Preview unavailable state implies the file is missing when the contract is missing.
- Member can trigger admin upload/delete/retry/cancel controls.

## Tests

- Documents list renders safe P4/P5 fields.
- Admin upload queues preparation and refreshes status.
- Member sees read-only document library.
- Preview panel opens from row click but blob fetch stays disabled when contract absent.
- No client fixture contains forbidden private fields.
- Later preview test: blob fetch uses approved route and revokes object URL.
- Source navigation test stays pending/blocked until source-ref contract exists.

## One-line summary

Port the documents workspace now; wire preview and citation navigation only after safe public refs exist.
