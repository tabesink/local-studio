# P9 - Frontend Delivery

Goal: build Next.js UI as thin client over P1-P8 contracts. Local Studio gives visual system only.

## Decision

Frontend does not define product truth. It renders API truth.

Use:

- Next.js App Router.
- TypeScript.
- Tailwind.
- shadcn/Radix-style primitives.
- Local Studio visual parity: compact shell, dark-first tokens, dense lists, dialogs, right detail panel.

Do not port:

- Local Studio agent runtime.
- terminal/filesystem UI.
- Electron/Pi/controller session mechanics.
- command queue/replay model.

## Existing Slice Map

| Frontend slice | Backend gate |
| --- | --- |
| 01 Runtime foundation | P1 error/config contract |
| 02 Login cookie session | P1 auth/session/logout |
| 03 App shell/nav/settings entry | P1 current user + role |
| 04 Settings general | P1 session + UI prefs only |
| 05 Settings users | P1/P8 admin proof, later user admin contract |
| 06 Settings domains | P3 admin/member domain APIs |
| 07 Settings model provider | P2 runtime-settings APIs |
| 08 Settings document parser | P2 active parser + P4 parser status |
| 09 Documents library | P4/P5 safe source list/index state |
| 10 Upload operations | P4 upload/prep + P5 index state |
| 11 Chat route shell | P3 domains + P6/P7 capability |
| 12 Chat SSE evidence | P7 SSE + P6 evidence DTO |
| 13 Graph workspace | post-P6/P7 graph proxy contract, defer until captured |
| 14 LightRAG domain lifecycle | P3 lifecycle APIs |
| 15 Operations recovery | P3/P4/P5 operation/status surfaces |
| 16 Source nav | later source-view contract, not P6 |
| 17 Audit diagnostics | P8 audit/diagnostics APIs |

## Build Order

1. Runtime foundation.
2. Cookie login/logout/me.
3. Authenticated shell with role nav.
4. Admin Settings panels after OpenAPI capture.
5. Domain lifecycle.
6. Source document list/upload/status.
7. Evidence-only route.
8. RAG chat SSE.
9. Audit/diagnostics.
10. Source navigation only after opaque source-ref contract exists.

## UI Rules

- API DTOs are not DB models.
- Shared UI primitives never call API.
- Feature modules own endpoint wrappers.
- UI hides admin controls for usability only; backend enforces auth.
- No browser credential persistence.
- No provider secret value in state, logs, URL, storage, analytics.
- Unknown contract means fixture capture task, not guess.
- One status map per entity.
- Document state and operation state stay separate.
- No mock persistence disguised as product behavior.

## Route Shape

Minimum:

```text
/(public)/login
/(app)/chat
/(app)/documents
/(app)/graph
/(app)/operations
settings dialog/panels
```

Route files stay thin. Feature behavior lives in `features/*`.

## Chat UI

P6 evidence-only:

- domain selector.
- question field.
- evidence cards.
- no answer bubble.
- memory only.

P7 chat:

- conversation list/thread.
- composer.
- current turn evidence visible.
- old evidence collapsed.
- no model/provider/prompt/retrieval controls.
- SSE parses Context Engine events, not provider events.
- cancel aborts fetch and shows interrupted local state.

## Visual Parity

Use existing:

- `DESIGN.md`
- `docs/design/context_engine_agent_ui_guidelines.md`
- `.references/local-studio-visual-parity-package.md`
- `.references/code/local-studio/`

Before new UI pattern, check Local Studio reference for token/primitive/shell evidence.

## Test Gate

- browser storage has no token.
- 401 clears auth state once.
- 403 shows forbidden, no redirect loop.
- member cannot see/call admin controls.
- admin can use admin panels.
- upload/status states follow backend.
- SSE ordering fixtures pass.
- no secret/path/raw payload in client errors/logs.
- Playwright covers desktop/mobile key flows.
- visual checks compare shell, dialogs, dense tables, chat states.

## Handoff

Frontend done means it consumes typed API/SSE contracts and preserves backend ownership. No frontend shortcut becomes product truth.

