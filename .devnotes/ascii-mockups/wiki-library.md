# Wiki Library

Status: deferred implementation mockup.

## Purpose

Future published Wiki Page browser. Read-only in this mockup. Wiki creation/edit/review/publish is out of P9 scope.

## Specs

- `CONTEXT.md` wiki vocabulary
- `specs/04-features/F-009-frontend-delivery/spec.md` out-of-scope wiki note
- F-011 knowledge-curation-workspace deferred until API/data contracts are promoted.
- `DESIGN.md`

## Frontend Module

`src/features/wiki/` after F-011 contracts exist.

## Reference Targets

- `.references/obsidian-smart-composer_impl_docs/README.md`
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md`
- `.references/obsidian-smart-composer_impl_docs/PACKAGE_MANIFEST.json`
- `.references/obsidian-smart-composer_impl_docs/REVIEW_SUMMARY.md`

Use for wiki/library navigation, conversation-to-knowledge handoff, evidence/citation presentation, and review-flow ideas only. Do not reuse Obsidian vault persistence, local database, direct provider calls, local RAG, or direct apply/write behavior.

## ASCII Mockup

```text
left wiki panel
+---------------------------------------+
| Wiki                         [search] |
| filters: domain [v] status [published]|
|---------------------------------------|
| > Compressor startup                  |
|   manuals       rev 4      reviewed   |
|                                       |
|   Maintenance interval                |
|   manuals       rev 2      reviewed   |
|                                       |
|   Safety shutdown                     |
|   field         rev 1      reviewed   |
+---------------------------------------+

main read view
+-----------------------------------------------------------+
| Compressor startup                         rev 4 published |
| evidence: [1] [2]                                          |
|-----------------------------------------------------------|
| curated wiki content, not raw Source Document text         |
|-----------------------------------------------------------|
| Citations open Evidence panel only when safe refs exist.   |
+-----------------------------------------------------------+
```

## Intended Wiring

Do not implement until F-011 defines:

```text
WikiPage
WikiRevision
WikiContribution
review/publish API
evidence traceability DTOs
permission rules
```

## Parity Rules

- Use list rows for page index and a calm read pane.
- Show revision/status as compact metadata.
- Evidence refs open the right workbench Evidence tab, not browser source paths.
- No large editorial landing page.

## Do Not Wire

- No wiki create/edit/publish in P9.
- No raw Source Block ids or full canonical source text.
- No workspaceId unless an approved product model adds Workspace.
- No local draft persistence as product truth.
