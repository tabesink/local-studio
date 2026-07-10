---
id: F-004
title: Source Documents And Canonical Preparation UX And State Contract
status: approved
owner: Context Engine delivery team
last_reviewed: 2026-07-02
depends_on: [F-003]
supersedes: []
---


# F-004 - UX And State Contract

## Surface

Admin API supports documents library, upload dialog, outline, and operations surfaces. Member-readable source list and original preview are owned by the F-009 Library slice via API-001 `GET /domains/{domain_id}/sources` and `GET /domains/{domain_id}/sources/{source_id}/preview` (domain availability gate; no member mutation).

P9 documents UI **ports** the old CE client `/documents` pattern: library table + **inline PDF preview panel** on the same route (see `F-009/ce-client-port-and-parity.md`). Restyle with Local Studio tokens.

## Documents UI (P9 — port + restyle)

```text
/documents (single route)
  DocumentLibraryTable
  DocumentPreviewPanel  ← 50% split desktop; drawer mobile
    DocumentPdfPreview  ← blob URL + <object type="application/pdf">
  DocumentUploadDialog (admin)
```

Preview blob fetch uses the captured API-001 member preview route. Port panel structure and wire fetch for PDF / plain / markdown; docx remains unsupported.

## User/System Flow

```text
Read feature spec
-> implement named contracts and state transitions
-> run proof checks
-> update acceptance and traceability
-> stop before next phase
```

## Loading, Empty, Error, Forbidden

- API clients must preserve safe request IDs where returned.
- UI-facing phases use Local Studio compact loading, empty, error, and forbidden states from `DESIGN.md`.
- Backend-only phases expose safe status DTOs that later UI slices can render without guessing private internals.

## Accessibility And Visual Rules

- Frontend work must follow `DESIGN.md`.
- Icon-only controls need labels/tooltips.
- Preview drawer/dialog: focus trap, Escape close, title/description, opener focus restore.
- Tables/lists must support keyboard access and stable row heights.
