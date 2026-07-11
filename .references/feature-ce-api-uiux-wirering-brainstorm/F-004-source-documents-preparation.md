# F-004 — Source Documents & Preparation

**Phase P4 · Admin only · UI slices 09–10, 15**

## Outcome

Upload → parse → canonical Source Blocks. Async worker. No LightRAG yet.

## API Surface

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `.../sources` | multipart upload |
| GET | `.../sources` | list |
| GET | `.../sources/{id}` | detail |
| GET | `.../sources/{id}/outline` | block outline |
| GET | `.../sources/{id}/operations` | prep ops |
| POST | `.../retry`, `.../cancel` | prep control |
| DELETE | `.../sources/{id}` | hard delete |

## Source + Prep States

```text
source.state:     pending ──success──► prepared
                  deleting (sync hard delete)

prep operation:   queued → running → succeeded | failed | cancelled
```

Parser kind frozen at upload from `runtime_settings.active_parser_kind`.

## UI Wiring

| Slice | Screen | Port from CE client |
| --- | --- | --- |
| 09–10 | Documents library + PDF | `DocumentRoute`, `DocumentPreviewPanel`, `DocumentPdfPreview` |
| 15 | Operations recovery | new (no old route); LS logs pattern |

```text
/documents (single route)
  RoutePageShell
    ├── table (list)
    └── DocumentPreviewPanel → DocumentPdfPreview (<object>)
         50% split desktop | overlay drawer mobile
```

Restyle with LS tokens; **retain** CE split-layout + blob PDF viewer pattern.

## PDF Preview

Port viewer shell from `client/.../DocumentPdfPreview.tsx`. Wire blob fetch only after safe preview API is captured in contracts (P6+ / source-ref gate).

## Document Row Fields (safe DTO)

`originalFilename`, `state`, `parserKind`, timestamps, safe error message — no block text in list.

## Upload Flow

```text
Admin clicks Upload → Modal (file picker)
  → POST multipart
  → poll source detail / operations until terminal state
  → refresh table
```

## Never

- member source viewer (P4)
- browser parser selection
- show storage paths or parser task IDs

## LS refs (restyle only)

- table density: LS `ui/table.tsx`
- upload modal: LS `ui/modal.tsx`
- PDF panel chrome: LS panel tokens (structure from CE `DocumentPreviewPanel`)

## Spec

`specs/04-features/F-004-source-documents-preparation/spec.md`
