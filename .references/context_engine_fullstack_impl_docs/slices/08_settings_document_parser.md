# Slice 08 — Settings Dialog — Document Parser

## User outcome
Admin selects/configures/tests parser profile with safe secret status; document pipeline reads resulting backend configuration.

## In scope
- Admin-only Parser panel.
- Load `GET /admin/document-parser-settings`.
- Render active profile and profile list; edit only documented config.
- Submit settings/profile mutation through one parser API module.
- Run profile test with explicit pending/result state.

## Explicitly out of scope
- Document upload UI.
- Parser runtime implementation.
- Secret value display.
- Automatic migration of old documents.
- Generic parser marketplace.

## Routes affected
- global Settings dialog section `document-parsing`

## Frontend modules
- `features/settings/parsers/ParserPanel.tsx`
- `ParserProfileForm.tsx`
- `api.ts`
- `types.ts`

## API contracts consumed
- `GET /admin/document-parser-settings`
- `PUT /admin/document-parser-settings`
- `POST /admin/document-parser-settings/profiles/{id}/test`

## Data models
- Parser profile: id, provider, display/base URL, api-key env/status, enabled/active/config.
- Settings: active profile + profile list + secret status.

## Authorization behavior
Admin only. Backend enforces provider/parser config and any secret storage. Member hidden/forbidden. Parser test response may contain vendor detail: render safe summary only.

## UI states
- Loading: parser setting skeleton.
- Empty: no parser profile / no active profile.
- Error: retryable safe alert.
- Unauthenticated: login redirect.
- Forbidden: panel/route forbidden.
- Success: active profile badge + saved state.
- Test: pending/complete/error inline.

## UI parity and Local Studio transfer
- Confirmed: v1 exposes parser settings GET/PUT and profile test endpoint.
- Confirmed: architecture documents seeded Docling Local/Reducto Cloud concepts and secret status-only UI.
- Verify exact create/delete/activate subroutes; not all were proven in static read.

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

- Same Settings rail/panel geometry as Provider.
- Profiles show active/enabled state in text badge.
- Config form shows only verified fields; advanced JSON only when existing contract supplies structured config.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Keep parser profile wire mapping isolated.
- Upload feature reads resulting document processing state, not parser form local state.

## Tests
- Admin sees configured/not configured secret status only.
- Changing active profile refreshes read model.
- Profile test result is visible, safe, and does not leak key.
- Member cannot reach API/UI.

## Test scenarios to create
- Success: load/save/test fixture.
- Validation: invalid parser config response maps to form.
- Unauthenticated: session expiry handling.
- Unauthorized: member 403.
- Network/API: test failure/retry.
- Edge: active profile deleted/disabled response produces clear no-active state.

## Files to modify
- `features/settings/parsers/api.ts`
- `types.ts`
- `ParserPanel.tsx`
- `ParserProfileForm.tsx`
- `tests/settings/parsers.test.tsx`

## Deliberately not added
- Settings route registry

## Dependencies
- Document ingest implementation.
- Secret retrieval.
- Parser plugin layer.
- Auto reindex.

## Evidence / verification
- 03 App Shell.
- 10 Upload for downstream use.
