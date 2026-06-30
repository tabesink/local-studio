# Slice 01 — Runtime Foundation

## User outcome
App boots with typed env, one API boundary, design tokens, common error rendering, test harness.

## In scope
- Create server/client config boundary. Browser gets only public API base URL.
- Create `apiRequest()` with cookie credentials, abort support, request ID capture, normalized errors.
- Create contracts module. Feature modules own endpoint wrappers; no raw `fetch` in UI.
- Create or adapt Local Studio-compatible primitives needed now: Button, Input, Modal/Dialog, Alert/ErrorBox, Table/List, PageState/LoadingState, and toast host. Use shadcn/Radix only behind Local Studio tokenized wrappers when needed.
- Create root error/not-found/loading surfaces and test fixtures.

## Explicitly out of scope
- Feature endpoints.
- Auth persistence.
- React Query/global cache.
- Telemetry platform.
- Generic retry framework.

## Routes affected
- `/` redirect placeholder
- root `layout.tsx`
- root error/loading/not-found

## Frontend modules
- `src/lib/config/env.ts`
- `src/lib/api/client.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/contracts.ts`
- `src/components/shared/AppErrorState.tsx`
- `src/styles/tokens.css`

## API contracts consumed
- No feature endpoint required; safe `/health` probe only if product needs it.

## Data models
- `ApiError` target: `status`, `code`, `message`, optional `fieldErrors`, optional `requestId`.
- Public runtime config.

## Authorization behavior
Public. Never expose backend secrets, provider keys, private URLs, internal ports.

## UI states
- Loading: root fallback/skeleton.
- Error: safe failure state + retry callback.
- Not found: route-level.
- Success: render child route.
- Network: distinguish abort from request failure.

## UI parity and Local Studio transfer
- Current client has typed API helpers, root provider composition, Tailwind-based UI.
- Current client transports bearer plus cookies; target must start cookie-first before auth slice.
- Runtime test needed: deployed API base URL and CORS.

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

- Root loading, error, not-found, and unavailable states use Local Studio PageState/ErrorBox/LoadingState grammar on the dark-first app canvas.
- Token bootstrap imports Local Studio-compatible theme aliases before feature CSS; primitives consume tokens rather than feature utility colors.
- API error display is compact and safe: request ID in mono when present, retry where valid, no raw stack/provider detail.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Keep `apiRequest` transport-only: URL, headers, credentials, JSON/form-data, error normalize.
- Do not put feature endpoint strings in components.
- Freeze browser config object after validation.

## Tests
- Invalid/missing public API URL fails build/start with actionable safe message.
- All feature API wrappers compile against one error type.
- One raw transport module only.
- Root error/loading/not-found render without layout crash.

## Test scenarios to create
- Unit: malformed JSON/non-JSON/network/abort error normalize.
- Unit: request sends `credentials: include`.
- Unit: public config rejects secret-like env access.
- Smoke: root route renders token styles.

## Files to modify
- `src/lib/config/env.ts`
- `src/lib/api/client.ts`
- `src/lib/api/errors.ts`
- `src/lib/api/contracts.ts`
- `src/components/shared/AppErrorState.tsx`
- `src/components/shared/LoadingState.tsx`
- `src/styles/tokens.css`
- `tests/api/client.test.ts`

## Deliberately not added
- root layout/style entrypoints
- test config

## Dependencies
- Access-token browser storage.
- Data-fetching library.
- Global feature store.
- Provider abstractions.

## Evidence / verification
- None.
