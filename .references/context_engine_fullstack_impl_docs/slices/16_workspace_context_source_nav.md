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

## UI parity and Local Studio transfer
- Confirmed: architecture describes common evidence/source navigation concepts and chat sources event.
- Unknown: exact asset/document detail endpoint and authorization behavior. Capture before rendering content beyond returned metadata.

## Local Studio visual transfer

Use the canonical design sources before building or styling this slice: `DESIGN.md`, `docs/design/context_engine_agent_ui_guidelines.md`, `.references/review_docs/local_studio_frontend_review/local-studio-visual-parity-package.md`, and the read-only implementation reference under `.references/code/local-studio/frontend/`.

| Concern | Required transfer |
|---|---|
| Theme | Default to `zai-dark`; support `zai-light` as the matching Local Studio light theme. |
| Tokens | Use Local Studio `--ui-*` aliases plus compatible `--bg`, `--fg`, `--surface`, `--rail`, `--border`, `--accent`, `--dim`, `--ok`, `--warn`, and `--err` aliases. |
| Typography | Geist Sans for UI/body; Geist Mono for IDs, paths, model names, timestamps, request IDs, code, and payload-shaped metadata. |
| Density | Preserve workstation density: 4px spacing rhythm, `24px` compact rows, `28px` standard rows/controls where the primitive supports it. |
| Surfaces | Layered charcoal panels, quiet 1px borders, subtle hover/selected states; no white-canvas dashboard shell. |
| Components | Reuse/adapt Local Studio primitives first: `Button`, `Input`, `Select`, `Tabs`, `SegmentedControl`, `Table`, `List`, `Status`, `ProgressBar`, `Modal`, `Drawer`, `RightDetailPanel`, `PageState`, `ErrorBox`. |
| Actions | Primary is black/white high-contrast, not blue. Secondary actions are compact ghost/icon/outline controls. Destructive actions use quiet danger styling plus confirmation when irreversible. |
| Status | Use status dot/pill/text/icon/progress combinations; color cannot be the only status signal and semantic colors stay local. |
| Detail | Use a right detail panel or drawer for evidence, source, graph-node, operation, provider, audit, or document inspection instead of navigating away for small details. |
| Accessibility | Keyboard reachability, visible focus, labels/tooltips for icon-only controls, form labels, dialog title/description, Escape close, and focus restore are required. |

## Implementation shape

```text
route/layout
  → feature shell
  → feature controller/hook
  → typed API or stream client
  → mapped view state
  → rendered UI
```

## Slice-specific UI contract

- Thin right panel or inline source block; calm, narrow, readable metadata.
- Source title primary; path/reference muted; chunk text clipped by default.
- Do not overwhelm chat with citations/cards.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Evidence mapper converts feature-specific payloads to one view model.
- Panel purely presentational; navigation callback owned by parent.
- Never fetch raw source based on client constructed path.

## Tests
- Chat sources render before/with answer completion.
- Evidence list handles absent optional metadata.
- Selection change is keyboard accessible.
- Unauthorized source content cannot be revealed through UI guessing.

## Test scenarios to create
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
