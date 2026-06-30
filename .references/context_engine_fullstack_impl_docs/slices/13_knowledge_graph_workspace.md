# Slice 13 — Knowledge Graph Workspace

## User outcome
User opens graph route, sees stable graph loading/empty/error state and safe inspected entity details from backend graph proxy.

## In scope
- Build `/database-visualize` page shell.
- Call only verified graph proxy/list/detail endpoints after OpenAPI capture.
- Render graph canvas/list fallback with selected-node detail pane.
- Use evidence/document link affordances only when IDs/permissions supplied by API.
- Add no graph mutation in first pass.

## Explicitly out of scope
- Graph editing.
- Client-side graph inference.
- Raw LightRAG exposure.
- Domain lifecycle.
- Full graph analytics.
- Custom visualization engine.

## Routes affected
- `/database-visualize`

## Frontend modules
- `features/graph/GraphPage.tsx`
- `GraphCanvas.tsx`
- `GraphDetailsPanel.tsx`
- `api.ts`
- `types.ts`

## API contracts consumed
- Graph proxy endpoints exist in backend architecture; exact endpoint names/models **capture before wiring**.

## Data models
- Graph node/edge/detail DTO unknown.
- Selected node ID local UI state.
- Document/evidence link DTO only if API provides it.

## Authorization behavior
Authenticated read only if backend grants. Admin-only graph controls must not be assumed. Never call LightRAG direct from browser; backend proxy is boundary.

## UI states
- Loading: canvas/list skeleton.
- Empty: no graph/domain data explanation.
- Error: safe retry.
- Unauthenticated: login redirect.
- Forbidden: backend 403 state.
- Success: nodes/edges or accessible list fallback.
- Selection: detail panel; no stale detail after graph refresh.

## UI parity and Local Studio transfer
- Confirmed: v1 client exposes `database-visualize` route/rail entry; backend architecture describes graph proxy routes.
- Unknown: exact graph contract, role rules, renderer library. Capture before build.

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

- Parity: workbench surface, low visual noise, right detail panel optional.
- Graph cannot be only visual channel: keyboard/list fallback mandatory.
- Keep node color/status semantics minimal/accessibly labeled.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Graph data hook maps API DTO to renderer-neutral `GraphViewModel`.
- Renderer component has no API calls.
- Use URL search param for selected node only if verified desired; local state first.

## Tests
- Route loads safely with empty graph.
- Selected node details match returned data.
- Keyboard/list fallback exposes same key details.
- No direct browser call to LightRAG/internal service.

## Test scenarios to create
- Success: nodes/edges fixture.
- Validation: n/a read-only.
- Unauthenticated: route redirect.
- Unauthorized: 403 state.
- Network/API: retry.
- Edge: selected node removed during refresh clears details.

## Files to modify
- `app/(app)/database-visualize/page.tsx`
- `features/graph/api.ts`
- `types.ts`
- `GraphPage.tsx`
- `GraphCanvas.tsx`
- `GraphDetailsPanel.tsx`
- `tests/graph/page.test.tsx`

## Deliberately not added
- nav route
- app shell placeholder

## Dependencies
- Graph mutation.
- Raw backend client.
- Complex analytics.
- Speculative graph cache.

## Evidence / verification
- 03 App Shell.
- 09 Documents Library.
