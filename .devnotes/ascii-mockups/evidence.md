# Evidence

Status: implementation handoff draft.

## Purpose

Read-only provenance inspector for selected chat turn Evidence. In the proposed `/chat` shell this is the `Evidence` tab inside the right workbench.

## Specs

- `specs/04-features/F-006-scoped-evidence-retrieval/spec.md`
- `specs/04-features/F-006-scoped-evidence-retrieval/ux.md`
- `specs/04-features/F-007-grounded-streaming-chat/spec.md`
- `specs/04-features/F-009-frontend-delivery/context-panel-tabs.md`
- `specs/03-contracts/events/context-engine-sse-v1.md`

## Frontend Module

`src/features/chat/context-panel/` and `src/features/evidence/`

## Reference Targets

- `.references/feature-ce-api-uiux-wirering-brainstorm/F-006-scoped-evidence-retrieval.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-chat-shell-flow.md`
- `.references/feature-ce-api-uiux-wirering-brainstorm/F-007-context-panel-tabs.md`
- `.references/obsidian-smart-composer_impl_docs/SOURCE_PIN.md` for `SimilaritySearchResults.tsx` and `MarkdownReferenceBlock.tsx` evidence/citation UI ideas
- `.references/obsidian-smart-composer_impl_docs/COPYING_AND_ATTRIBUTION.md`
- `.references/code/local-studio-codebase/frontend/src/ui/right-detail-panel.tsx`
- `.references/code/local-studio-codebase/frontend/src/ui/tabs.tsx`

## ASCII Mockup

```text
RightWorkbenchShell
+------------------------------------------------+
| Right Workbench                                |
| [Evidence] [Composer]             collapse x   |
|------------------------------------------------|
| Evidence ledger                                |
| [This answer] [All] [Pinned when contracted]   |
|------------------------------------------------|
| > [1] manual.md                                |
|   bounded excerpt, max 500 chars...            |
|   evref_01                         selected    |
|------------------------------------------------|
|   [2] procedure.md                             |
|   bounded excerpt...                           |
|------------------------------------------------|
| Source inspector                               |
| sourceLabel: manual.md                         |
| citation: [1]                                  |
| evidenceRefId: evref_01                        |
| excerpt:                                       |
|   bounded approved excerpt only                |
+------------------------------------------------+
```

## Wiring

```text
SSE evidence event
  -> evidence refs keyed by turnId/assistant message id
  -> mergeRetrievalFrameIntoLedger(sessionContextLedger)
  -> EvidenceTabPanel ledger
  -> row selection
  -> SourceInspectorPane
```

Right workbench registry:

```text
RIGHT_WORKBENCH_TAB_IDS = ["evidence", "composer"] as const
RightWorkbenchRouter:
  evidence -> EvidenceTabPanel
  composer -> SmartComposerTab (disabled/deferred until F-011)
future ids require spec gate + panel + label
```

The Evidence tab does not call a second evidence endpoint. It consumes the P7 turn stream and persisted conversation detail only.

Standalone evidence endpoint for future evidence-only UI:

```text
POST /api/v1/domains/{domain_id}/evidence
body: { question }
response: result + EvidenceItem[]
```

## Public Evidence Fields

```text
P6 EvidenceItem:
  excerpt
  sourceLabel

P7 turn evidence ref:
  id              // turn-scoped public evidence ref id
  citationLabel
  sourceLabel
  excerpt
```

## Parity Rules

- Use right workbench / tabbed aside pattern, not cards.
- Evidence rows are dense list rows with selected/hover surfaces.
- Source labels and evidence ref ids use Geist Mono where shown.
- Status uses compact text plus dot; no colored evidence cards.

## Do Not Wire

- No Source Document id, Source Block id, raw score, raw LightRAG hit, path, full canonical Markdown, runtime URL, prompt, answer draft, or provider payload.
- No click-through source navigation until source-ref contract exists.
- No evidence fetch outside the approved P6 endpoint or P7 SSE/conversation DTOs.
