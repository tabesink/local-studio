# Slice 17 — Audit + Diagnostics

## User outcome
Admin investigates safe operation/audit/health signals without exposing secrets, stack traces, private documents, or worker internals.

## In scope
- Create admin diagnostics summary linked from Operations/settings only after verified endpoints.
- Render safe audit event rows: actor/action/target/time/allowed metadata.
- Render health/dependency status if endpoint exists.
- Add request ID copy affordance for support only if returned by API.
- Redact known secret/token/header field names in client display as defense-in-depth.

## Explicitly out of scope
- Full log tail.
- Provider prompt/completion capture.
- Raw stack traces.
- Secret inspection.
- SIEM integration.
- Client-side audit source truth.

## Routes affected
- admin diagnostics/audit route or panel

## Frontend modules
- `features/diagnostics/DiagnosticsPage.tsx`
- `AuditTable.tsx`
- `HealthSummary.tsx`
- `api.ts`
- `redaction.ts`

## API contracts consumed
- Audit/log/health endpoints — exact paths/models **verify before implementation**.

## Data models
- Audit event likely actor/event/target_id/metadata/created_at per architecture; exact DTO/access policy verify.
- Health summary DTO unknown.

## Authorization behavior
Admin only by default. Backend decides audit visibility. Client redaction is backup, not data control. Never make raw log transport part of common UI.

## UI states
- Loading: summary/table skeleton.
- Empty: no events.
- Error: safe error + retry.
- Forbidden: no data.
- Success: safe event/status rows.
- Degraded: health/status explanation without provider secrets.

## UI parity and Local Studio transfer
- Confirmed: v1 architecture describes audit logging for destructive/admin actions and app logging limitations.
- Unknown: exact audit/health endpoints and data retention. Contract capture gate.

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

- Dense support table, clear timestamp/action/target.
- Use monospaced IDs only in secondary/copyable detail.
- Metadata collapsed and redact before render.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Keep diagnostics adapter separate from operations adapter.
- Redaction function handles display only; backend response must already be safe.
- No polling faster than actual operational need.

## Tests
- Admin sees only verified safe audit/health fields.
- Sensitive-looking metadata is redacted in UI test fixtures.
- Member gets forbidden.
- Request ID support flow works without copying secret payload.

## Test scenarios to create
- Success: safe audit/health fixtures.
- Validation: n/a read-only.
- Unauthenticated: redirect.
- Unauthorized: 403.
- Network/API: retry.
- Edge: metadata contains token/key/header-like field; UI redacts.

## Files to modify
- `features/diagnostics/api.ts`
- `redaction.ts`
- `DiagnosticsPage.tsx`
- `AuditTable.tsx`
- `HealthSummary.tsx`
- `tests/diagnostics/redaction.test.ts`

## Deliberately not added
- admin route/nav config

## Dependencies
- Log tail.
- Raw trace viewer.
- Telemetry platform.
- Secret inspect.
- Background monitoring agent.

## Evidence / verification
- 15 Operations Recovery.
- 07 Security/Auth.
