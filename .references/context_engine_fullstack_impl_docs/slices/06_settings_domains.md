# Slice 06 — Settings Dialog — Domains / Knowledge Graph

## User outcome
Admin sees domain registry and safe domain configuration/lifecycle entry points without mixing graph visualization or document workflow.

## In scope
- Admin-only Domains panel.
- Render domain list/status/config summary only from verified domain API.
- Link/launch domain lifecycle actions into dedicated lifecycle slice.
- Explain embedding/model lock or running-domain config implications where API returns them.

## Explicitly out of scope
- Graph visualization.
- Document upload.
- Provider secret edit.
- Automatic migration/recreate logic.
- Generic multi-tenant admin.

## Routes affected
- global Settings dialog section `domains` / current `knowledge-graph` key

## Frontend modules
- `features/settings/domains/DomainsPanel.tsx`
- `features/settings/domains/api.ts`
- `features/settings/domains/types.ts`

## API contracts consumed
- LightRAG/domain API endpoints — exact route names/DTOs require runtime/OpenAPI capture before implementation.

## Data models
- Domain summary/lifecycle model; exact fields unknown.
- Domain env snapshot is runtime artifact, not editor source.

## Authorization behavior
Admin only. Hide panel for member. Backend authorizes every lifecycle/config action. Domain ownership ACL is deferred/unknown.

## UI states
- Loading: domain summary skeleton.
- Empty: no domains with verified next action.
- Error: safe request error/retry.
- Unauthenticated: shell redirect.
- Forbidden: no panel/direct route forbidden.
- Success: domain summary with status labels.

## UI parity and Local Studio transfer
- Confirmed: architecture documents domain runtimes and lifecycle as backend-owned control plane.
- Unknown: exact frontend domain registry endpoint shapes. Capture OpenAPI/runtime before wiring.

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

- Settings panel, not dashboard: flat list rows, status badge/text, small actions.
- Keep configuration details read-only until exact write contract confirmed.
- Do not show raw domain env/secret values.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Use no domain endpoint until contract captured. Start with read-only adapter interface.
- Domain action buttons delegate to lifecycle feature; no inline orchestration.

## Tests
- Member cannot access panel.
- Admin sees each verified domain status.
- No domain API/field guessed.
- Running-domain config warning renders only when API supplies state.

## Test scenarios to create
- Success: admin list fixture.
- Validation: n/a read-only first pass.
- Unauthenticated: protected dialog blocked.
- Unauthorized: member 403/direct route forbidden.
- Network/API: retry state.
- Edge: domain disappears while dialog open -> safe refresh/empty.

## Files to modify
- `features/settings/domains/DomainsPanel.tsx`
- `features/settings/domains/api.ts`
- `features/settings/domains/types.ts`
- `tests/settings/domains.test.tsx`

## Deliberately not added
- Settings route registry

## Dependencies
- Domain editor based on `domain.env`.
- Lifecycle implementation.
- Graph renderer.
- ACL system.

## Evidence / verification
- 03 App Shell.
- 14 Domain Lifecycle for actions.
