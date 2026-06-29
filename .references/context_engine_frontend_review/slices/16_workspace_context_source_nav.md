# Slice 16 — Workspace Context + Source Navigation

    ## User outcome
    User opens evidence/source context from chat or document surface; sees grounded source metadata and safe navigation, not raw private content.

    ## In scope
    - Create reusable evidence/source navigation panel.
- Accept normalized evidence model from chat/document feature.
- Render document title/source path/reference/chunk metadata only when supplied.
- Support select/open focus state and back-to-chat/document navigation.
- Render images/assets only with authorized safe URL/ID contract.

    ## Explicitly out of scope
    - New retrieval engine.
- Client source-path resolution.
- Raw full-document exposure.
- Cross-domain browse.
- Citation fabrication.
- Asset direct-storage URLs.

    ## Routes affected
    - chat evidence side panel
- documents context pane
- optional workspace detail route

    ## Frontend modules
    - `features/evidence/EvidencePanel.tsx`
- `EvidenceList.tsx`
- `EvidenceDetail.tsx`
- `types.ts`
- `evidence-view-model.ts`

    ## API contracts consumed
    - Chat `sources` SSE event
- document/context endpoint only if verified.

    ## Data models
    - Evidence: source_path/document_title/chunk_id/reference_id concept; exact wire shape capture.
- Selected evidence ID local UI state.

    ## Authorization behavior
    Authenticated. Backend authorizes all source/content access. Frontend never reconstructs source URLs/paths or assumes document visibility. Hide unavailable evidence fields; do not guess.

    ## UI states
    - Loading: source panel placeholder while event/request pending.
- Empty: no evidence returned.
- Error: source detail unavailable without breaking chat answer.
- Forbidden: safe unavailable state.
- Success: evidence list/detail.
- Missing asset: compact unavailable state.

## UI parity
- Confirmed: architecture describes common evidence/source navigation concepts and chat sources event.
- Unknown: exact asset/document detail endpoint and authorization behavior. Capture before rendering content beyond returned metadata.

    ## Implementation shape

    ```text
    route/layout
      → feature shell
      → feature controller/hook
      → typed API or stream client
      → mapped view state
      → rendered UI
    ```

    ['Thin right panel or inline source block; calm, narrow, readable metadata.', 'Source title primary; path/reference muted; chunk text clipped by default.', 'Do not overwhelm chat with citations/cards.']

    ## Acceptance criteria
    - Evidence mapper converts feature-specific payloads to one view model.
- Panel purely presentational; navigation callback owned by parent.
- Never fetch raw source based on client constructed path.

    ## Tests
    - Chat sources render before/with answer completion.
- Evidence list handles absent optional metadata.
- Selection change is keyboard accessible.
- Unauthorized source content cannot be revealed through UI guessing.

    ## Files to create
    - Success: evidence fixture with all fields.
- Validation: n/a.
- Unauthenticated: shell guard.
- Unauthorized: source detail 403 safe state.
- Network/API: details unavailable preserves answer.
- Edge: duplicate reference IDs / missing title / asset missing.

    ## Files to modify
    - `features/evidence/types.ts`
- `evidence-view-model.ts`
- `EvidencePanel.tsx`
- `EvidenceList.tsx`
- `EvidenceDetail.tsx`
- `tests/evidence/panel.test.tsx`

    ## Deliberately not added
    - chat and documents surface integration

    ## Dependencies
    - Raw document browser.
- Direct storage paths.
- Citation generator.
- Local retrieval.

    ## Evidence / verification
    - 09 Documents Library.
- 12 Chat SSE + Evidence.
