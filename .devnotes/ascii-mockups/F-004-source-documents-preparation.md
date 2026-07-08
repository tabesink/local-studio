# F-004 Source Documents And Preparation

Status: implementation handoff draft.

## Purpose

Documents library, admin upload dialog, preparation/index state, and inline PDF preview shell. P9 ports old CE `/documents` structure and restyles with Local Studio.

## Specs

- `specs/04-features/F-004-source-documents-preparation/spec.md`
- `specs/04-features/F-004-source-documents-preparation/ux.md`
- `specs/04-features/F-005-lightrag-indexing-eligibility/spec.md`
- `specs/04-features/F-009-frontend-delivery/ce-client-port-and-parity.md`
- `specs/04-features/F-009-frontend-delivery/frontend-slice-map.md` slices 09-10
- `specs/03-contracts/api/context-engine-v1.md`
- `specs/03-contracts/data/context-engine-data.md`

## Reference Targets

- `.references/ce-local-studio/webui/src/features/documents/DocumentRoute.tsx`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-004-source-documents-preparation.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-005-lightrag-indexing-eligibility.md`
- future port targets named by F-009: `DocumentPreviewPanel`, `DocumentPdfPreview`, upload dialog
- `.references/code/local-studio-codebase/frontend/src/ui/table.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/progress-bar.tsx`

## ASCII Mockup

```text
/documents
+-----------------------------------------------------------------+----------------+
| Documents                         Domain [manuals v] [Upload]*  | Preview        |
|-----------------------------------------------------------------|----------------|
| status | filename          parser   prep        index      updated| manual.pdf     |
| good   | startup.pdf       docling  prepared    ready      12:05  |----------------|
| info   | procedure.md      reducto  prepared    submitting 12:02  | PDF object     |
| warn   | draft.docx        docling  pending     queued     11:55  | <object>       |
| danger | bad.pdf           docling  failed op   not_req    11:40  |                |
|-----------------------------------------------------------------|----------------|
| row click selects Source Document and opens 50% preview panel.                   |
+--------------------------------------------------------------------------------+

mobile:
  table full width
  row click -> preview drawer

upload dialog:
+--------------------------------------------------+
| Upload Source Document                  [x]      |
| file [Choose file........................]       |
| parser: frozen from active runtime setting        |
| [Cancel] [Upload]                                |
+--------------------------------------------------+
```

`*` admin-only. Members may browse only if later route permits; P4 APIs are admin-only.

## Wiring

| UI event | API |
| --- | --- |
| List sources | `GET /api/v1/admin/domains/{domain_id}/sources` |
| Upload | `POST /api/v1/admin/domains/{domain_id}/sources` multipart `file` |
| Source detail | `GET /api/v1/admin/domains/{domain_id}/sources/{source_id}` |
| Outline | `GET /api/v1/admin/domains/{domain_id}/sources/{source_id}/outline` |
| Prep ops | `GET /api/v1/admin/domains/{domain_id}/sources/{source_id}/operations` |
| Retry prep | `POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/retry` |
| Cancel prep | `POST /api/v1/admin/domains/{domain_id}/sources/{source_id}/cancel` |
| Delete source | `DELETE /api/v1/admin/domains/{domain_id}/sources/{source_id}` |
| Index retry/cancel | P5 index routes |

PDF preview blob fetch is blocked until a safe preview contract is captured. Port panel shell first.

## State Mapping

```text
Source state:
  pending  -> warning/default
  prepared -> good
  deleting -> warning/info

Preparation operation:
  queued/running/succeeded/failed/cancelled

Index state:
  not_requested, queued, submitting, accepted, ready, failed, cancelling, cancelled
```

Dual status rule from the F-005 wiring pack:

```text
Source row shows prep status and index status separately.
prep: prepared | index: ready       -> query-ready candidate; backend still owns eligibility
prep: prepared | index: submitting  -> info + optional thin progress
prep: failed   | index: not_req     -> danger on prep, no index action
index failed                         -> danger + Retry
index submitting/accepted            -> info + Cancel
index cancelled                      -> default + Retry
```

## Parity Rules

- Use table/list density, not document cards.
- Keep inline preview split on desktop and drawer on mobile.
- Status dot plus text; no colored row backgrounds.
- Upload is one focused modal, not nested upload cards.
- File names are safe labels, not paths.

## Do Not Wire

- No parser selection on upload in P4; parser kind is frozen server-side.
- No original download/image/source-content viewer unless a contract adds it.
- No storage path, parser task id, parser URL, raw parser payload, raw error, Source Block canonical Markdown, LightRAG remote id, rendered index text, or query eligibility calculation in browser.
- No `/documents/{id}` detail route.
