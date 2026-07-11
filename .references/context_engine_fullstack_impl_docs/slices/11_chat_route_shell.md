# Slice 11 — Chat Route Shell

## User outcome
Authenticated user opens `/chat`, sees capability state, composer, local conversation frame, domain requirement guidance; no stream parsing yet.

## In scope
- Build `/chat` route shell.
- Fetch `GET /chat/capability`.
- Render ready/setup-required/config-invalid states.
- Build composer: question text, optional domain selector only when backend capability/flow requires it, submit disabled by prerequisites.
- Create local turn draft model and initial message placeholders.
- Generate per-submit client turn ID.

## Explicitly out of scope
- SSE parsing.
- Partial answer rendering.
- Conversation persistence across reload.
- Model selector UI.
- Prompt templates.
- Client-side retrieval.

## Routes affected
- `/chat`

## Frontend modules
- `features/chat/ChatPage.tsx`
- `ChatCapabilityGate.tsx`
- `ChatComposer.tsx`
- `ConversationFrame.tsx`
- `chat-api.ts`
- `types.ts`

## API contracts consumed
- `GET /chat/capability`
- `POST /chat/turn/stream` request shape defined but invoked in Slice 12.

## Data models
- Chat capability: ready/setup_required/configuration_invalid.
- Chat request: domain_id optional, client_turn_id, question, conversation history.
- Local draft/turn state.

## Authorization behavior
Authenticated. Server decides domain requirements and synthesis availability. UI cannot claim chat ready solely from selected local values. Member/admin same chat behavior unless backend says otherwise.

## UI states
- Loading: capability skeleton.
- Setup required: explanatory empty state; admin gets Settings route affordance, member gets contact/admin message.
- Configuration invalid: safe configuration error state.
- Empty: first-question prompt.
- Ready: composer enabled.
- Validation: empty/too-long question local + server.
- Unauthenticated: login redirect.

## UI parity and Local Studio transfer
- Confirmed: v1 `/chat` route delegates to LightRagChatShell.
- Confirmed: `/chat/capability` uses ready/setup-required/config-invalid concepts; stream request supports domain/client turn id/question/history.
- Verify domain selector source and exact capability response fields.

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

- Parity: central conversation workbench; readable width; composer anchored visually low.
- Sources/evidence reserved region but no fake cards until stream events arrive.
- Use compact send/cancel control geometry.

## Visual acceptance checks

- Dark mode at `1440x900` and `1280x800` reads as Local Studio's compact workstation, not the legacy white Context Engine UI.
- Light mode uses Local Studio's matching light token system without becoming a separate SaaS dashboard aesthetic.
- Narrow viewport keeps rail/dialog/detail/composer/table content usable without overlap or hidden primary actions.
- No feature-local hard-coded colors, shadows, radius, row height, or spacing when a Local Studio token or primitive exists.
- Loading, empty, error, forbidden, disabled, pending, and success states use the same component grammar as the rest of the shell.

## Acceptance criteria
- Capability gate owns readiness. Composer owns text/draft validation.
- Create `ChatTurnDraft` before request. Stream feature will attach event state.
- Use client-generated UUID once per submit; preserve on manual retry only if backend idempotency semantics prove it.

## Tests
- `/chat` renders capability-aware shell.
- Ready state allows non-empty question submit path to stream controller seam.
- Missing required domain produces guidance before/after server validation.
- No answer fabricated before SSE terminal event.

## Test scenarios to create
- Success: ready capability + composer.
- Validation: blank/whitespace question.
- Unauthenticated: route guard.
- Unauthorized: server 403 safe state.
- Network/API: capability error/retry.
- Edge: `setup_required` vs `configuration_invalid` maps distinct visible state.

## Files to modify
- `app/(app)/chat/page.tsx`
- `features/chat/types.ts`
- `chat-api.ts`
- `ChatPage.tsx`
- `ChatCapabilityGate.tsx`
- `ChatComposer.tsx`
- `ConversationFrame.tsx`
- `tests/chat/shell.test.tsx`

## Deliberately not added
- navigation config
- App Shell route placeholder

## Dependencies
- SSE parser.
- Persistent chat history.
- Local RAG fallback.
- Model switcher.

## Evidence / verification
- 03 App Shell.
- 01 API/Error Foundation.
