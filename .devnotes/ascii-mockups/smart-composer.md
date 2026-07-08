# Smart Composer

Status: deferred implementation mockup.

## Purpose

Future governed right workbench tab for Wiki Contributions. It is the only planned wiki write surface, but it is not P9 scope.

## Specs

- `CONTEXT.md` Smart Composer vocabulary
- `specs/04-features/F-009-frontend-delivery/spec.md` out-of-scope wiki note
- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md` evidence safety
- F-011 knowledge-curation-workspace deferred until API/data contracts are promoted.
- `DESIGN.md`

## Frontend Module

`src/features/wiki/` after F-011 contracts exist.

## Reference Targets

- `.references/obsidian-smart-composer_impl_docs/README.md`
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md`
- `.references/obsidian-smart-composer_impl_docs/PACKAGE_MANIFEST.json`
- `.references/obsidian-smart-composer_impl_docs/COPYING_AND_ATTRIBUTION.md`
- `.references/obsidian-smart-composer_impl_docs/REVIEW_SUMMARY.md`

Useful source anchors from the pin:

```text
Chat.tsx / useChatStreamManager.ts       -> interaction and stream-state ideas
mentionable.ts / chat.ts                 -> context-token shape comparison
SimilaritySearchResults.tsx              -> evidence result layout ideas
MarkdownReferenceBlock.tsx               -> citation rendering ideas
TemplateSectionModal.tsx                 -> prompt-template UI ideas
ApplyViewRoot.tsx / apply.ts / diff.ts   -> future diff-review visuals only
```

## Adaptation Rules

- Reuse interaction ideas and small presentational patterns only.
- Copy source code only after checking the pinned commit and MIT attribution rule.
- Replace Obsidian runtime, vault persistence, provider calls, local RAG, OAuth, MCP, and filesystem writes with Context Engine backend-owned contracts.
- Treat package contracts as proposals until promoted into active `specs/`.

## ASCII Mockup

```text
right workbench tab: Composer (future)
+------------------------------------------------------+
| Right Workbench                         [Evidence][Composer] |
|------------------------------------------------------|
| Smart Composer                                        |
| [Work][Review]                                        |
|------------------------------------------------------|
| contribution target                                  |
| Wiki Page [Compressor startup v]                     |
| Evidence  [1] [2] [Add selected evidence]            |
|------------------------------------------------------|
| Draft                                                |
| +--------------------------------------------------+ |
| | governed contribution text                       | |
| | no raw source dump                               | |
| +--------------------------------------------------+ |
|------------------------------------------------------|
| checks                                               |
| good  evidence refs still authorized                 |
| warn  review required before publish                 |
|------------------------------------------------------|
| [Save draft] [Submit review]                         |
+------------------------------------------------------+
```

## Intended Wiring

Do not implement until F-011 defines durable APIs for:

```text
create/update WikiContribution
attach selected Evidence/Citations
submit for review
review approve/reject
publish WikiRevision
revalidate Evidence on save/publish
```

## Parity Rules

- Use right detail panel/work tray grammar.
- This is the right `Composer` tab paired with the `Evidence` tab in `/chat`.
- Tabs use existing `Tabs` or `SegmentedControl`; no fourth tab style.
- Draft editor uses compact textarea/editor shell with stable height.
- Actions are quiet, right-aligned, and gated by backend permissions.

## Do Not Wire

- No wiki durable writes until F-011 contract exists.
- No main chat mutation path.
- No raw prompts, raw answers, raw source text, Source Block ids, provider payload, local file paths, or browser-owned review state.
- No publish button that only updates local UI.
- No copied Smart Composer source without pinned-source inspection and attribution.
